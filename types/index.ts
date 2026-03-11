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

/** Candidate game after appdetails filtering */
export interface GameCandidate {
  appid: number
  name: string
  price_krw: number
  is_free: boolean
  genres: string[]
  metacritic_score?: number
  supports_korean: boolean
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

// ===== Feedback types =====

export type FeedbackRating = 'positive' | 'neutral' | 'negative'

export interface FeedbackPayload {
  game_id: string
  game_name: string
  steam_id: string
  play_profile: { name: string; playtime_hours: number }[]
  rating: FeedbackRating
}
