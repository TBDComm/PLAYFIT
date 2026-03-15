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
  price_krw: number
  is_free: boolean
  metacritic_score?: number
  supports_korean: boolean
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

/** Full Claude response */
export interface ClaudeRecommendationResponse {
  recommendations: Recommendation[]
}

// ===== UI display types =====

/** Complete recommendation card shown on the result page */
export interface RecommendationCard {
  appid: number
  name: string
  reason: string
  price_krw: number
  is_free: boolean
  metacritic_score?: number
  supports_korean: boolean
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
  | 'GAME_NOT_FOUND'
  | 'TAG_EXTRACTION_FAILED'

// ===== Feedback types =====

export type FeedbackRating = 'positive' | 'neutral' | 'negative'

export interface FeedbackPayload {
  game_id: string
  game_name: string
  steam_id: string
  play_profile: { name: string; playtime_hours: number }[]
  rating: FeedbackRating
  tag_snapshot: string[]
}
