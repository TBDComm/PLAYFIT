export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getGameDetails, sleep } from '@/lib/steam'
import { getRecommendations } from '@/lib/claude'
import { isDbReady, getTagsForGames, getUserTagWeights, scoreCandidates } from '@/lib/supabase'
import type { ErrorCode, PlayHistory, RecommendationCard } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      steamId?: unknown
      playHistory?: unknown
      ownedAppIds?: unknown
      budget?: unknown
      freeOnly?: unknown
      koreanOnly?: unknown
    }

    const steamId = typeof body.steamId === 'string' ? body.steamId : ''
    const playHistory = Array.isArray(body.playHistory) ? body.playHistory as PlayHistory[] : []
    const ownedAppIds = Array.isArray(body.ownedAppIds) ? body.ownedAppIds as number[] : []
    const freeOnly = body.freeOnly === true
    const budget = !freeOnly && typeof body.budget === 'number' ? body.budget : undefined
    const koreanOnly = body.koreanOnly === true

    // Check DB is ready
    const dbReady = await isDbReady()
    if (!dbReady) {
      return NextResponse.json({ error: 'DB_NOT_READY' satisfies ErrorCode }, { status: 503 })
    }

    const playedAppIds = playHistory.map(g => g.appid)

    // Fetch tags for played games and user tag weights in parallel
    const [tagsMap, userTagWeights] = await Promise.all([
      getTagsForGames(playedAppIds),
      getUserTagWeights(steamId),
    ])

    // Build user tag profile: aggregate tag vote counts weighted by playtime
    const tagProfile: Record<string, number> = {}
    for (const game of playHistory) {
      const tags = tagsMap.get(game.appid)
      if (!tags) continue
      for (const [tag, voteCount] of Object.entries(tags)) {
        tagProfile[tag] = (tagProfile[tag] ?? 0) + voteCount * game.playtime_hours
      }
    }

    if (Object.keys(tagProfile).length === 0) {
      return NextResponse.json({ error: 'TAG_EXTRACTION_FAILED' satisfies ErrorCode }, { status: 400 })
    }

    // Score candidates from DB (exclude all owned games)
    const excludeAppIds = (ownedAppIds.length > 0 ? ownedAppIds : playedAppIds).map(String)
    const scored = await scoreCandidates(tagProfile, userTagWeights, excludeAppIds, 40)

    // Fetch real-time prices for top candidates, apply filters (200ms delay per rate limit)
    interface FilteredCandidate {
      appid: number
      name: string
      price_krw: number
      is_free: boolean
      metacritic_score?: number
      supports_korean: boolean
      top_tags: string[]
    }
    const candidates: FilteredCandidate[] = []

    for (const s of scored) {
      if (candidates.length >= 20) break

      const details = await getGameDetails(Number(s.appid))
      await sleep(200)

      if (!details) continue
      if (freeOnly && !details.is_free) continue
      if (!freeOnly && budget !== undefined && !details.is_free && details.price_krw > budget) continue
      if (koreanOnly && !details.supports_korean) continue

      const top_tags = Object.entries(s.tags ?? {})
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([tag]) => tag)

      candidates.push({ ...details, top_tags })
    }

    if (candidates.length === 0) {
      return NextResponse.json({
        error: 'NO_GAMES_IN_BUDGET' satisfies ErrorCode,
        filters: { budget, freeOnly, koreanOnly },
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
          supports_korean: game.supports_korean,
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
