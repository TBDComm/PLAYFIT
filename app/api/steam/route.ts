export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { parseSteamUrl, resolveVanityUrl, getOwnedGames, getFeaturedAppIds, getCandidateGames } from '@/lib/steam'
import type { ErrorCode } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { url?: unknown; budget?: unknown; korean_only?: unknown }
    const url = typeof body.url === 'string' ? body.url.trim() : ''
    const budget = typeof body.budget === 'number' ? body.budget : undefined
    const koreanOnly = body.korean_only === true

    const parsed = parseSteamUrl(url)
    if (parsed.type === 'invalid') {
      return NextResponse.json({ error: 'INVALID_URL' satisfies ErrorCode }, { status: 400 })
    }

    // Start featured categories fetch immediately — independent of steamId
    const featuredPromise = getFeaturedAppIds()

    const steamId = parsed.type === 'steamid'
      ? parsed.steamId
      : await resolveVanityUrl(parsed.vanity)

    if (!steamId) {
      return NextResponse.json({ error: 'INVALID_URL' satisfies ErrorCode }, { status: 400 })
    }

    // Owned games + featured categories in parallel
    const [playHistoryResult, featuredIds] = await Promise.all([
      getOwnedGames(steamId),
      featuredPromise,
    ])

    if (playHistoryResult === 'PRIVATE_PROFILE' || playHistoryResult === 'INSUFFICIENT_HISTORY') {
      return NextResponse.json({ error: playHistoryResult satisfies ErrorCode }, { status: 400 })
    }

    const ownedAppIds = new Set(playHistoryResult.map(g => g.appid))
    const candidates = await getCandidateGames(featuredIds, ownedAppIds, budget, koreanOnly)

    if (candidates === 'NO_GAMES_IN_BUDGET') {
      return NextResponse.json({ error: 'NO_GAMES_IN_BUDGET' satisfies ErrorCode }, { status: 400 })
    }

    return NextResponse.json({ steamId, playHistory: playHistoryResult, candidates })
  } catch {
    return NextResponse.json({ error: 'GENERAL_ERROR' satisfies ErrorCode }, { status: 500 })
  }
}
