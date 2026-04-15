// ===== Steam API types =====

/** Owned game from GetOwnedGames response */
export interface SteamGame {
  appid: number
  name: string
  playtime_forever: number // minutes
}

/** Play history entry passed to Claude (top 15 by playtime) */
export interface PlayHistory {
  name: string
  playtime_hours: number
  appid: number
}

/** Real-time game details fetched from Steam appdetails */
export interface GameDetails {
  appid: number
  name: string
  price_krw: number | null
  is_free: boolean
  metacritic_score?: number
}

// ===== Supabase types =====

/** Candidate game scored by tag overlap from games_cache RPC */
export interface ScoredCandidate {
  appid: string
  name: string
  tags: Record<string, number>
  score: number
}

// ===== Claude API types =====

/** Single recommendation returned by Claude */
export interface Recommendation {
  appid: string
  reason: string
}

// ===== UI display types =====

/** Complete recommendation card shown on the result page */
export interface RecommendationCard {
  appid: number
  name: string
  reason: string
  price_krw: number | null
  is_free: boolean
  metacritic_score?: number
  store_url: string
  tag_snapshot: string[]
}

// ===== Error types =====

/** Error codes returned from API routes */
export type ErrorCode =
  | 'PRIVATE_PROFILE'
  | 'INSUFFICIENT_HISTORY'
  | 'NO_GAMES_IN_BUDGET'
  | 'AI_PARSE_FAILURE'
  | 'INVALID_URL'
  | 'GENERAL_ERROR'
  | 'DB_NOT_READY'
  | 'TAG_EXTRACTION_FAILED'
  | 'ALL_PRIVATE'
  | 'NOT_ENOUGH_MEMBERS'

// ===== Squad types =====

/** 태그명 → 정규화 점수 (0~1) */
export type TagProfile = Record<string, number>

/** Squad 멤버 한 명의 분석 결과 */
export interface SquadMember {
  steamId: string
  tagProfile: TagProfile
  ownedAppIds: number[]
}

/** analyzeSquad() 반환 값 */
export interface SquadAnalysis {
  mergedProfile: TagProfile
  matchScores: Record<string, number>  // steamId → 0~100
  avgMatchScore: number
  topSharedTags: string[]
  conflictTags: string[]
  allExcludedAppIds: number[]
}

/** Claude가 반환한 Squad 추천 카드 */
export interface SquadRecommendationCard {
  appid: number
  name: string
  reason: string
  price_krw: number | null
  is_free: boolean
  metacritic_score?: number
  store_url: string
  tag_snapshot: string[]
  match_score?: number
}

/** squad_sessions DB row */
export interface SquadSession {
  id: string
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
  created_at: string
  expires_at: string
}

// ===== Saved games types =====

export interface SavedGame {
  id: string
  user_id: string
  appid: string
  name: string
  reason: string | null
  price_krw: number | null
  metacritic_score: number | null
  saved_at: string
}

// ===== User profile types =====

export interface UserProfile {
  display_name: string | null
  bio: string | null
  is_public: boolean
}

// ===== Feedback types =====

export type FeedbackRating = 'positive' | 'negative'

// ===== Game comments types =====

export interface GameComment {
  id: string
  appid: string
  user_id: string
  body: string
  parent_id: string | null
  created_at: string
}

