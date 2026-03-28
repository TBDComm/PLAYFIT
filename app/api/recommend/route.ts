export const runtime = 'edge'

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getGameDetails } from '@/lib/steam'
import { getRecommendations } from '@/lib/claude'
import { isDbReady, getTagsForGames, getUserTagWeights, scoreCandidates } from '@/lib/supabase'
import type { ErrorCode, PlayHistory, RecommendationCard } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({})

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    // Start all independent operations immediately
    const sessionPromise = supabase.auth.getSession()
    const bodyPromise = request.json() as Promise<{
      steamId?: unknown
      playHistory?: unknown
      ownedAppIds?: unknown
      manualGames?: unknown
      budget?: unknown
      freeOnly?: unknown
    }>
    const dbReadyPromise = isDbReady()

    const [{ data: { session } }, dbReady, body] = await Promise.all([
      sessionPromise,
      dbReadyPromise,
      bodyPromise,
    ])

    if (!dbReady) {
      return NextResponse.json({ error: 'DB_NOT_READY' satisfies ErrorCode }, { status: 503 })
    }

    const userId = session?.user?.id ?? null
    const freeOnly = body.freeOnly === true
    const budget = !freeOnly && typeof body.budget === 'number' ? body.budget : undefined

    let steamId = ''
    let playHistory: PlayHistory[] = []
    let ownedAppIds: number[] = []

    if (Array.isArray(body.manualGames)) {
      // Manual mode: use provided games directly as play history
      playHistory = (body.manualGames as { appid: number; name: string; playtime_hours: number }[])
        .map(g => ({ name: g.name, playtime_hours: g.playtime_hours, appid: g.appid }))
    } else {
      // Steam mode
      steamId = typeof body.steamId === 'string' ? body.steamId : ''
      playHistory = Array.isArray(body.playHistory) ? body.playHistory as PlayHistory[] : []
      ownedAppIds = Array.isArray(body.ownedAppIds) ? body.ownedAppIds as number[] : []
    }

    const playedAppIds = playHistory.map(g => g.appid)

    // Fetch tags for played games and user tag weights in parallel
    // Cases 1–3 (logged in): weights by user_id; Case 4 (no session): weights by steam_id
    const [tagsMap, userTagWeights] = await Promise.all([
      getTagsForGames(playedAppIds),
      userId
        ? getUserTagWeights(userId, 'user_id')
        : getUserTagWeights(steamId, 'steam_id'),
    ])

    // Build user tag profile: aggregate tag vote counts weighted by playtime
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
        tagProfile[tag] = tagProfile[tag] / maxProfileVal
      }
    }

    if (Object.keys(tagProfile).length === 0) {
      return NextResponse.json({ error: 'TAG_EXTRACTION_FAILED' satisfies ErrorCode }, { status: 400 })
    }

    // Score candidates from DB (exclude all owned games)
    const excludeAppIds = (ownedAppIds.length > 0 ? ownedAppIds : playedAppIds).map(String)
    const scored = await scoreCandidates(tagProfile, userTagWeights, excludeAppIds, 40)

    // Fetch real-time prices for top candidates in parallel, then apply filters
    interface FilteredCandidate {
      appid: number
      name: string
      price_krw: number
      is_free: boolean
      metacritic_score?: number
      top_tags: string[]
    }
    
    const detailsPromises = scored.map(s => getGameDetails(Number(s.appid)))
    const detailsResults = await Promise.all(detailsPromises)

    const candidates: FilteredCandidate[] = []
    for (let i = 0; i < scored.length; i++) {
      if (candidates.length >= 20) break
      const details = detailsResults[i]
      const s = scored[i]

      if (!details) continue
      if (freeOnly && !details.is_free) continue
      if (!freeOnly && budget !== undefined && !details.is_free && details.price_krw > budget) continue

      const top_tags = Object.entries(s.tags ?? {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([tag]) => tag)

      candidates.push({ ...details, top_tags })
    }

    if (candidates.length === 0) {
      return NextResponse.json({
        error: 'NO_GAMES_IN_BUDGET' satisfies ErrorCode,
        filters: { budget, freeOnly },
      }, { status: 400 })
    }

    // Build play history with top_tags for Claude
    const playHistoryForClaude = playHistory.map(g => ({
      name: g.name,
      playtime_hours: g.playtime_hours,
      top_tags: Object.entries(tagsMap.get(g.appid) ?? {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([tag]) => tag),
    }))

    const result = await getRecommendations(playHistoryForClaude, candidates)

    if (result === 'AI_PARSE_FAILURE') {
      return NextResponse.json({ error: 'AI_PARSE_FAILURE' satisfies ErrorCode }, { status: 500 })
    }

    // Build recommendation cards from Claude selections
    const candidateMap = new Map(candidates.map(c => [String(c.appid), c]))
    const recommendations: RecommendationCard[] = result
      .filter(r => candidateMap.has(String(r.appid)))
      .map(r => {
        const game = candidateMap.get(String(r.appid))!
        return {
          appid: game.appid,
          name: game.name,
          reason: r.reason,
          price_krw: game.price_krw,
          is_free: game.is_free,
          metacritic_score: game.metacritic_score,
          store_url: `https://store.steampowered.com/app/${game.appid}`,
          tag_snapshot: game.top_tags,
        }
      })

    return NextResponse.json({ steamId, recommendations })
  } catch (e) {
    console.error('[recommend] GENERAL_ERROR:', e)
    return NextResponse.json({ error: 'GENERAL_ERROR' satisfies ErrorCode }, { status: 500 })
  }
}
