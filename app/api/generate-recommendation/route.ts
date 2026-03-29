import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { parseSteamUrl, resolveVanityUrl, getOwnedGames, getGameDetails } from '@/lib/steam'
import { getRecommendations } from '@/lib/claude'
import { isDbReady, getTagsForGames, getUserTagWeights, scoreCandidates, serviceSupabase, getGamePriceCache, upsertGamePriceCache } from '@/lib/supabase'
import type { ErrorCode, GameDetails, PlayHistory, RecommendationCard } from '@/types'

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

    // Check games_cache for already-cached prices — avoids hitting Steam for known games
    const scoredAppids = scored.map(s => s.appid)
    const priceCache = await getGamePriceCache(scoredAppids)

    const PRICE_TTL_MS = 24 * 60 * 60 * 1000
    const now = Date.now()

    // Cap at 15 Steam fetches — CF Workers free plan allows 50 subrequests/invocation.
    // Fixed cost: ~8 (Supabase auth/tags/weights/score/priceCache/claude/insert) + 1 getOwnedGames
    // Dynamic budget: 15 Steam fetches + 15 upserts = 30 → total ~39, safely under 50.
    const needsFetch = scored
      .filter(s => {
        const cached = priceCache.get(s.appid)
        if (!cached) return true
        if (cached.price_updated_at === null) return true
        return now - new Date(cached.price_updated_at).getTime() > PRICE_TTL_MS
      })
      .map(s => s.appid)
      .slice(0, 15)
    console.log('[rec] price cache: hit', scored.length - needsFetch.length, 'miss', needsFetch.length)

    // Fetch from Steam only for uncached/stale games
    const fetchedDetails = needsFetch.length > 0
      ? await Promise.all(needsFetch.map(id => getGameDetails(Number(id))))
      : []

    // Upsert fresh prices back to DB (fire-and-forget — don't block response)
    void Promise.all(
      needsFetch.map((id, i) => {
        const d = fetchedDetails[i]
        if (!d) return Promise.resolve()
        return upsertGamePriceCache(d.appid, d.price_krw, d.is_free, d.metacritic_score)
      })
    )

    // Build unified detail map: freshly fetched takes priority over cache
    const detailMap = new Map<string, GameDetails>()
    for (let i = 0; i < needsFetch.length; i++) {
      const d = fetchedDetails[i]
      if (d) detailMap.set(String(d.appid), d)
    }
    for (const [id, cached] of priceCache) {
      if (!detailMap.has(id) && cached.price_updated_at !== null) {
        const name = scored.find(s => s.appid === id)?.name ?? ''
        detailMap.set(id, {
          appid: Number(id),
          name,
          price_krw: cached.price_krw ?? 0,
          is_free: cached.is_free,
          metacritic_score: cached.metacritic_score ?? undefined,
        })
      }
    }

    const candidates = scored
      .map(s => {
        const details = detailMap.get(s.appid)
        if (!details) return null
        if (freeOnly && !details.is_free) return null
        if (!freeOnly && budget !== undefined && !details.is_free && details.price_krw > budget) return null
        return {
          ...details,
          top_tags: Object.entries(s.tags ?? {}).sort(([, a], [, b]) => b - a).slice(0, 3).map(([tag]) => tag),
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
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
