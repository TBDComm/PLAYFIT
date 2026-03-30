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

// ===== Feedback types =====

export type FeedbackRating = 'positive' | 'negative'

