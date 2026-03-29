import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { parseSteamUrl, resolveVanityUrl, getOwnedGames, getGameDetails } from '@/lib/steam'
import { getRecommendations } from '@/lib/claude'
import { isDbReady, getTagsForGames, getUserTagWeights, scoreCandidates, serviceSupabase } from '@/lib/supabase'
import type { ErrorCode, PlayHistory, RecommendationCard } from '@/types'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const [cookieStore, body] = await Promise.all([
    cookies(),
    request.json() as Promise<{ url?: unknown; manualGames?: unknown; budget?: unknown; freeOnly?: unknown }>,
  ])
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  try {
    const [{ data: { session } }, dbReady] = await Promise.all([
      supabase.auth.getSession(),
      isDbReady(),
    ])

    if (!dbReady) {
      return NextResponse.json({ error: 'DB_NOT_READY' satisfies ErrorCode }, { status: 503 })
    }

    const userId = session?.user?.id ?? null
    const freeOnly = body.freeOnly === true
    const budget = !freeOnly && typeof body.budget === 'number' ? body.budget : undefined

    let steamId: string | null = null
    let playHistory: PlayHistory[] = []
    let ownedAppIds: number[] = []

    // --- Logic Branch: Steam URL vs Manual Input ---
    if (typeof body.url === 'string' && body.url.trim()) {
      const parsed = parseSteamUrl(body.url.trim())
      if (parsed.type === 'invalid') {
        return NextResponse.json({ error: 'INVALID_URL' satisfies ErrorCode }, { status: 400 })
      }
      steamId = parsed.type === 'steamid' ? parsed.steamId : await resolveVanityUrl(parsed.vanity)
      if (!steamId) {
        return NextResponse.json({ error: 'INVALID_URL' satisfies ErrorCode }, { status: 400 })
      }

      const ownedGamesResult = await getOwnedGames(steamId)
      if (ownedGamesResult === 'PRIVATE_PROFILE' || ownedGamesResult === 'INSUFFICIENT_HISTORY') {
        return NextResponse.json({ error: ownedGamesResult }, { status: 400 })
      }
      playHistory = ownedGamesResult.playHistory
      ownedAppIds = ownedGamesResult.ownedAppIds
    } else if (Array.isArray(body.manualGames)) {
      playHistory = (body.manualGames as { appid: number; name: string; playtime_hours: number }[])
        .map(g => ({ name: g.name, playtime_hours: g.playtime_hours, appid: g.appid }))
    } else {
      return NextResponse.json({ error: 'GENERAL_ERROR' satisfies ErrorCode, message: 'No valid input provided' }, { status: 400 })
    }

    if (playHistory.length === 0) {
        return NextResponse.json({ error: 'INSUFFICIENT_HISTORY' satisfies ErrorCode }, { status: 400 })
    }

    const playedAppIds = playHistory.map(g => g.appid)

    // --- Parallel data fetching for recommendation logic ---
    const [tagsMap, userTagWeights] = await Promise.all([
      getTagsForGames(playedAppIds),
      userId ? getUserTagWeights(userId, 'user_id') : (steamId ? getUserTagWeights(steamId, 'steam_id') : Promise.resolve({})),
    ])

    const tagProfile: Record<string, number> = {}
    for (const game of playHistory) {
      const tags = tagsMap.get(game.appid)
      if (!tags) continue
      for (const [tag, voteCount] of Object.entries(tags)) {
        tagProfile[tag] = (tagProfile[tag] ?? 0) + voteCount * Math.sqrt(game.playtime_hours)
      }
    }

    const maxProfileVal = Math.max(...Object.values(tagProfile))
    if (maxProfileVal > 0) {
      for (const tag of Object.keys(tagProfile)) {
        tagProfile[tag] /= maxProfileVal
      }
    }

    if (Object.keys(tagProfile).length === 0) {
      return NextResponse.json({ error: 'TAG_EXTRACTION_FAILED' satisfies ErrorCode }, { status: 400 })
    }

    const topTagsFromProfile = Object.entries(tagProfile).sort(([, a], [, b]) => b - a).slice(0, 10).map(([tag]) => tag)

    const excludeAppIds = (ownedAppIds.length > 0 ? ownedAppIds : playedAppIds).map(String)
    const scored = await scoreCandidates(tagProfile, userTagWeights, excludeAppIds, 80)
    console.log('[rec] scored candidates:', scored.length)

    // Fetch all 80 candidates in parallel — same latency as before but
    // 2× the pool, so null returns (missing KR pricing / transient Steam errors)
    // have far less chance of exhausting all candidates.
    const detailsResults = await Promise.all(scored.map(s => getGameDetails(Number(s.appid))))
    const nullCount = detailsResults.filter(d => d === null).length
    console.log('[rec] game details: total', detailsResults.length, 'null', nullCount)

    const candidates = detailsResults
      .map((details, i) => ({ details, score: scored[i] }))
      .filter(({ details }) => {
        if (!details) return false
        if (freeOnly && !details.is_free) return false
        if (!freeOnly && budget !== undefined && !details.is_free && details.price_krw > budget) return false
        return true
      })
      .map(({ details, score }) => ({
        ...details!,
        top_tags: Object.entries(score.tags ?? {}).sort(([, a], [, b]) => b - a).slice(0, 3).map(([tag]) => tag),
      }))
      .slice(0, 20)
    console.log('[rec] filtered candidates:', candidates.length)

    if (candidates.length === 0) {
      return NextResponse.json({ error: 'NO_GAMES_IN_BUDGET' satisfies ErrorCode, filters: { freeOnly, budget } }, { status: 400 })
    }

    const playHistoryForClaude = playHistory.map(g => ({
      name: g.name,
      playtime_hours: g.playtime_hours,
      top_tags: Object.entries(tagsMap.get(g.appid) ?? {}).sort(([, a], [, b]) => b - a).slice(0, 3).map(([tag]) => tag),
    }))

    const claudeResult = await getRecommendations(playHistoryForClaude, candidates)
    console.log('[rec] claude result:', claudeResult === 'AI_PARSE_FAILURE' ? 'PARSE_FAILURE' : `ok (${(claudeResult as unknown[]).length} items)`)

    if (claudeResult === 'AI_PARSE_FAILURE') {
      return NextResponse.json({ error: 'AI_PARSE_FAILURE' satisfies ErrorCode }, { status: 500 })
    }

    const candidateMap = new Map(candidates.map(c => [String(c.appid), c]))
    const finalRecommendations: RecommendationCard[] = claudeResult
      .filter(r => candidateMap.has(String(r.appid)))
      .map(r => {
        const game = candidateMap.get(String(r.appid))!
        return {
          appid: game.appid, name: game.name, reason: r.reason,
          price_krw: game.price_krw, is_free: game.is_free, metacritic_score: game.metacritic_score,
          store_url: `https://store.steampowered.com/app/${game.appid}`, tag_snapshot: game.top_tags,
        }
      })

    // --- Final Step: Save to DB and return ID ---
    // Use service role to allow anonymous users to INSERT (anon key blocked by RLS)
    const { data: dbData, error: dbError } = await serviceSupabase
      .from('recommendation_sets')
      .insert({
        user_id: userId,
        steam_id: steamId,
        budget_krw: budget,
        tags: topTagsFromProfile,
        cards: finalRecommendations, 
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('[rec] Supabase insertion error:', dbError)
      return NextResponse.json({ error: 'GENERAL_ERROR' satisfies ErrorCode }, { status: 500 })
    }

    return NextResponse.json({ id: dbData.id })

  } catch (e: unknown) {
    const err = e as Error
    console.error('[generate-recommendation] GENERAL_ERROR:', err.message, err.stack)
    return NextResponse.json({ error: 'GENERAL_ERROR' satisfies ErrorCode }, { status: 500 })
  }
}
