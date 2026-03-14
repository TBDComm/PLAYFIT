export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getRecommendations } from '@/lib/claude'
import type { ErrorCode, PlayHistory, GameCandidate, RecommendationCard } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      steamId?: unknown
      playHistory?: unknown
      candidates?: unknown
    }

    const steamId = typeof body.steamId === 'string' ? body.steamId : ''
    const playHistory = Array.isArray(body.playHistory) ? body.playHistory as PlayHistory[] : []
    const candidates = Array.isArray(body.candidates) ? body.candidates as GameCandidate[] : []

    const result = await getRecommendations(playHistory, candidates)

    if (typeof result === 'string') {
      return NextResponse.json({ error: result }, { status: 500 })
    }

    // Merge Claude recommendations with GameCandidate details
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
        }
      })

    return NextResponse.json({ steamId, recommendations })
  } catch {
    return NextResponse.json({ error: 'GENERAL_ERROR' satisfies ErrorCode }, { status: 500 })
  }
}
