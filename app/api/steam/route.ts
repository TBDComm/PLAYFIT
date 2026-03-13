import { NextRequest, NextResponse } from 'next/server'
import { parseSteamUrl, resolveVanityUrl } from '@/lib/steam'
import type { ErrorCode } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { url?: unknown }
    const url = typeof body.url === 'string' ? body.url.trim() : ''

    const parsed = parseSteamUrl(url)

    if (parsed.type === 'invalid') {
      return NextResponse.json({ error: 'INVALID_URL' satisfies ErrorCode }, { status: 400 })
    }

    if (parsed.type === 'steamid') {
      return NextResponse.json({ steamId: parsed.steamId })
    }

    // vanity URL — resolve via Steam API
    const steamId = await resolveVanityUrl(parsed.vanity)
    if (!steamId) {
      return NextResponse.json({ error: 'INVALID_URL' satisfies ErrorCode }, { status: 400 })
    }

    return NextResponse.json({ steamId })
  } catch {
    return NextResponse.json({ error: 'GENERAL_ERROR' satisfies ErrorCode }, { status: 500 })
  }
}
