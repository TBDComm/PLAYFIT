export const runtime = 'edge'

import { parseSteamUrl, resolveVanityUrl, getOwnedGames } from '@/lib/steam'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url') ?? ''

  const parsed = parseSteamUrl(url.trim())
  if (parsed.type === 'invalid') {
    return Response.json({ status: 'invalid_url' })
  }

  const steamId = parsed.type === 'steamid'
    ? parsed.steamId
    : await resolveVanityUrl(parsed.vanity)

  if (!steamId) return Response.json({ status: 'resolve_failed' })

  const result = await getOwnedGames(steamId)
  if (result === 'PRIVATE_PROFILE') return Response.json({ status: 'private' })
  if (result === 'INSUFFICIENT_HISTORY') return Response.json({ status: 'insufficient' })
  return Response.json({ status: 'valid' })
}
