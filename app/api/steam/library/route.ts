export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { getAllLibraryGames } from '@/lib/steam'

export async function GET(request: NextRequest) {
  const steamId = new URL(request.url).searchParams.get('steamId')
  if (!steamId || !/^\d+$/.test(steamId)) {
    return NextResponse.json({ error: 'INVALID_STEAM_ID' }, { status: 400 })
  }

  try {
    const result = await getAllLibraryGames(steamId)
    if (result === 'PRIVATE_PROFILE') {
      return NextResponse.json({ error: 'PRIVATE_PROFILE' }, { status: 400 })
    }
    return NextResponse.json({ games: result })
  } catch (e) {
    console.error('[steam/library] error:', e)
    return NextResponse.json({ error: 'GENERAL_ERROR' }, { status: 500 })
  }
}
