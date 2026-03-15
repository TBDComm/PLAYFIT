export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { parseSteamUrl, resolveVanityUrl, getOwnedGames } from '@/lib/steam'
import type { ErrorCode } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { url?: unknown }
    const url = typeof body.url === 'string' ? body.url.trim() : ''

    const parsed = parseSteamUrl(url)
    if (parsed.type === 'invalid') {
      return NextResponse.json({ error: 'INVALID_URL' satisfies ErrorCode }, { status: 400 })
    }

    const steamId = parsed.type === 'steamid'
      ? parsed.steamId
      : await resolveVanityUrl(parsed.vanity)

    if (!steamId) {
      return NextResponse.json({ error: 'INVALID_URL' satisfies ErrorCode }, { status: 400 })
    }

    const ownedGamesResult = await getOwnedGames(steamId)

    if (ownedGamesResult === 'PRIVATE_PROFILE' || ownedGamesResult === 'INSUFFICIENT_HISTORY') {
      return NextResponse.json({ error: ownedGamesResult satisfies ErrorCode }, { status: 400 })
    }

    return NextResponse.json({ steamId, playHistory: ownedGamesResult.playHistory, ownedAppIds: ownedGamesResult.ownedAppIds })
  } catch (e) {
    console.error('[steam] GENERAL_ERROR:', e)
    return NextResponse.json({ error: 'GENERAL_ERROR' satisfies ErrorCode }, { status: 500 })
  }
}
