import { createClient } from '@supabase/supabase-js'
import type { ScoredCandidate } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client — bypasses RLS for server-side reads (e.g. user_tag_weights)
const serviceSupabase = createClient(
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
  if (error) console.error('[supabase] scoreCandidates error:', error)
  return (data as ScoredCandidate[]) ?? []
}
