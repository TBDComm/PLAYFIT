export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

type ParsedUrl =
  | { type: 'steamid'; steamId: string }
  | { type: 'vanity'; vanity: string }
  | { type: 'invalid' }

export function parseSteamUrl(url: string): ParsedUrl {
  const profileMatch = url.match(/\/profiles\/(\d+)/)
  if (profileMatch) return { type: 'steamid', steamId: profileMatch[1] }

  const vanityMatch = url.match(/\/id\/(\w+)/)
  if (vanityMatch) return { type: 'vanity', vanity: vanityMatch[1] }

  return { type: 'invalid' }
}

export async function resolveVanityUrl(vanity: string): Promise<string | null> {
  const key = process.env.STEAM_API_KEY
  const res = await fetch(
    `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${key}&vanityurl=${encodeURIComponent(vanity)}`
  )
  const data = await res.json() as { response: { success: number; steamid?: string } }
  if (data.response?.success !== 1) return null
  return data.response.steamid ?? null
}
