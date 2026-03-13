import type { PlayHistory, SteamGame, GameCandidate } from '@/types'

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function getOwnedGames(steamId: string): Promise<PlayHistory[] | 'PRIVATE_PROFILE' | 'INSUFFICIENT_HISTORY'> {
  const key = process.env.STEAM_API_KEY
  const res = await fetch(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${key}&steamid=${steamId}&include_appinfo=true&include_played_free_games=true`
  )
  const data = await res.json() as { response: { games?: SteamGame[] } }
  const games = data.response?.games

  if (!games || games.length === 0) return 'PRIVATE_PROFILE'
  if (games.length < 5) return 'INSUFFICIENT_HISTORY'

  return games
    .sort((a, b) => b.playtime_forever - a.playtime_forever)
    .slice(0, 15)
    .map(g => ({
      name: g.name,
      playtime_hours: Math.round(g.playtime_forever / 60 * 10) / 10,
      appid: g.appid,
    }))
}

interface FeaturedCategoriesResponse {
  new_releases?: { items?: { id: number }[] }
  top_sellers?: { items?: { id: number }[] }
}

interface AppDetailsResponse {
  [appid: string]: {
    success: boolean
    data?: {
      name: string
      price_overview?: { final: number }
      is_free?: boolean
      genres?: { description: string }[]
      metacritic?: { score: number }
      supported_languages?: string
    }
  }
}

export async function getFeaturedAppIds(): Promise<number[]> {
  const res = await fetch('https://store.steampowered.com/api/featuredcategories?cc=kr&l=korean')
  const data = await res.json() as FeaturedCategoriesResponse

  const ids = new Set<number>()
  data.new_releases?.items?.forEach(item => ids.add(item.id))
  data.top_sellers?.items?.forEach(item => ids.add(item.id))
  return [...ids]
}

async function getGameDetails(appid: number): Promise<GameCandidate | null> {
  const res = await fetch(
    `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=kr&l=korean`
  )
  const data = await res.json() as AppDetailsResponse
  const entry = data[appid.toString()]
  if (!entry?.success || !entry.data) return null

  const d = entry.data
  const is_free = d.is_free ?? false
  if (!is_free && !d.price_overview) return null

  return {
    appid,
    name: d.name,
    price_krw: is_free ? 0 : Math.round(d.price_overview!.final / 100),
    is_free,
    genres: d.genres?.map(g => g.description) ?? [],
    metacritic_score: d.metacritic?.score,
    supports_korean: d.supported_languages?.includes('Korean') ?? false,
  }
}

export async function getCandidateGames(
  featuredIds: number[],
  ownedAppIds: Set<number>,
  budget?: number
): Promise<GameCandidate[] | 'NO_GAMES_IN_BUDGET'> {
  const candidates: GameCandidate[] = []

  for (const appid of featuredIds) {
    if (candidates.length >= 30) break
    if (ownedAppIds.has(appid)) continue

    const details = await getGameDetails(appid)
    await sleep(200)

    if (!details) continue
    if (budget !== undefined && !details.is_free && details.price_krw > budget) continue
    candidates.push(details)
  }

  if (candidates.length === 0) return 'NO_GAMES_IN_BUDGET'
  return candidates
}

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
