import { createClient } from '@supabase/supabase-js'
import type { ScoredCandidate, SquadSession, TagProfile, SquadRecommendationCard } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client — bypasses RLS; use for all server-side writes/reads that need elevated access
export const serviceSupabase = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function isDbReady(): Promise<boolean> {
  const { count, error } = await supabase
    .from('games_cache')
    .select('*', { count: 'exact', head: true })
  if (error) console.error('[supabase] isDbReady error:', error)
  return (count ?? 0) > 0
}

export async function getTagsForGames(appids: number[]): Promise<Map<number, Record<string, number>>> {
  const { data } = await supabase
    .from('games_cache')
    .select('appid, tags')
    .in('appid', appids.map(String))

  const map = new Map<number, Record<string, number>>()
  if (data) {
    for (const row of data) {
      if (row.tags && typeof row.tags === 'object') {
        map.set(Number(row.appid), row.tags as Record<string, number>)
      }
    }
  }
  return map
}

export async function getUserTagWeights(
  id: string,
  by: 'user_id' | 'steam_id' = 'steam_id'
): Promise<Record<string, number>> {
  if (!id) return {}
  const { data } = await serviceSupabase
    .from('user_tag_weights')
    .select('tag, weight')
    .eq(by, id)

  const weights: Record<string, number> = {}
  if (data) {
    for (const row of data) {
      weights[row.tag] = row.weight
    }
  }
  return weights
}

export interface GamePriceCacheRow {
  appid: string
  price_krw: number | null
  is_free: boolean
  metacritic_score: number | null
  price_updated_at: string | null
}

export async function getGamePriceCache(
  appids: string[]
): Promise<Map<string, GamePriceCacheRow>> {
  const { data } = await serviceSupabase
    .from('games_cache')
    .select('appid, price_krw, is_free, metacritic_score, price_updated_at')
    .in('appid', appids)
  const map = new Map<string, GamePriceCacheRow>()
  if (data) {
    for (const row of data) map.set(row.appid, row as GamePriceCacheRow)
  }
  return map
}

export async function upsertGamePriceCache(
  appid: number,
  price_krw: number,
  is_free: boolean,
  metacritic_score: number | undefined
): Promise<void> {
  await serviceSupabase
    .from('games_cache')
    .update({
      price_krw,
      is_free,
      metacritic_score: metacritic_score ?? null,
      price_updated_at: new Date().toISOString(),
    })
    .eq('appid', String(appid))
}

// ===== Squad session functions =====

export async function saveSquadSession(row: {
  share_token: string
  host_user_id: string | null
  member_steam_ids: string[]
  member_count: number
  merged_profile: TagProfile
  result_cards: SquadRecommendationCard[]
  match_scores: Record<string, number>
  avg_match_score: number
  top_shared_tags: string[]
  conflict_tags: string[]
  budget_krw: number | null
  free_only: boolean
}): Promise<string> {
  const { data, error } = await serviceSupabase
    .from('squad_sessions')
    .insert(row)
    .select('share_token')
    .single()
  if (error) throw new Error(`saveSquadSession error: ${error.message}`)
  return data.share_token
}

export async function getSquadSession(token: string): Promise<SquadSession | null> {
  const { data, error } = await serviceSupabase
    .from('squad_sessions')
    .select('*')
    .eq('share_token', token)
    .gt('expires_at', new Date().toISOString())
    .single()
  if (error || !data) return null
  return data as SquadSession
}

// 공개 프로필 표시용 lite 조회 — host_user_id로 닉네임 + is_public 만 가져옴
export async function getPublicProfileLite(
  userId: string
): Promise<{ display_name: string | null } | null> {
  const { data, error } = await serviceSupabase
    .from('user_profiles')
    .select('display_name, is_public')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data || !data.is_public) return null
  return { display_name: data.display_name }
}

export async function scoreCandidates(
  tagProfile: Record<string, number>,
  userTagWeights: Record<string, number>,
  ownedAppIds: string[],
  limit: number = 50
): Promise<ScoredCandidate[]> {
  const { data, error } = await supabase.rpc('score_candidates', {
    p_tag_profile: tagProfile,
    p_user_tag_weights: userTagWeights,
    p_owned_appids: ownedAppIds,
    p_limit: limit,
  })
  if (error) throw new Error(`scoreCandidates RPC error: ${error.message}`)
  return (data as ScoredCandidate[]) ?? []
}
