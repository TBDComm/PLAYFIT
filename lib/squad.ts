// Squad MVP 전용 pure functions — 네트워크 호출 없음
// buildTagProfile 공식: voteCount × √playtime_hours (기존 /api/generate-recommendation 인라인 로직과 동일)

import type { TagProfile, SquadMember, SquadAnalysis, PlayHistory } from '@/types'

/**
 * 한 멤버의 플레이 기록과 게임 태그 맵으로 TagProfile 생성
 * @param games - 멤버의 playHistory (상위 15개)
 * @param gameTags - appid → { tagName: voteCount } 맵
 */
export function buildTagProfile(
  games: PlayHistory[],
  gameTags: Map<number, Record<string, number>>
): TagProfile {
  const raw: Record<string, number> = {}

  for (const game of games) {
    const tags = gameTags.get(game.appid)
    if (!tags) continue
    const sqrtPlaytime = Math.sqrt(Math.max(game.playtime_hours, 0.1))
    for (const [tag, voteCount] of Object.entries(tags)) {
      raw[tag] = (raw[tag] ?? 0) + voteCount * sqrtPlaytime
    }
  }

  // 0~1 정규화
  const max = Math.max(...Object.values(raw), 1)
  const profile: TagProfile = {}
  for (const [tag, score] of Object.entries(raw)) {
    profile[tag] = score / max
  }
  return profile
}

/**
 * N개 TagProfile을 합의 프로필로 병합
 * presenceThreshold: 태그가 전체 멤버 중 해당 비율 이상에게 있어야 생존
 * 4명 이상 자동 적용 threshold = 0.7
 */
export function mergeTagProfiles(
  profiles: TagProfile[],
  opts: { presenceThreshold?: number } = {}
): TagProfile {
  const n = profiles.length
  if (n === 0) return {}

  const threshold = opts.presenceThreshold ?? (n >= 4 ? 0.7 : 0.5)

  // 모든 태그 수집
  const allTags = new Set<string>()
  for (const p of profiles) {
    for (const tag of Object.keys(p)) allTags.add(tag)
  }

  const merged: TagProfile = {}
  for (const tag of allTags) {
    // 이 태그를 가진 멤버 수
    const presentCount = profiles.filter(p => (p[tag] ?? 0) > 0).length
    if (presentCount / n < threshold) continue

    // 평균값
    const avg = profiles.reduce((sum, p) => sum + (p[tag] ?? 0), 0) / n
    merged[tag] = avg
  }

  // 재정규화
  const max = Math.max(...Object.values(merged), 1)
  for (const tag of Object.keys(merged)) {
    merged[tag] = merged[tag] / max
  }
  return merged
}

/**
 * 개인 프로필과 그룹 프로필의 코사인 유사도 → 0~100 점수
 */
export function calcMatchScore(individual: TagProfile, group: TagProfile): number {
  const keys = new Set([...Object.keys(individual), ...Object.keys(group)])
  let dot = 0, normA = 0, normB = 0
  for (const k of keys) {
    const a = individual[k] ?? 0
    const b = group[k] ?? 0
    dot += a * b
    normA += a * a
    normB += b * b
  }
  if (normA === 0 || normB === 0) return 0
  return Math.round((dot / (Math.sqrt(normA) * Math.sqrt(normB))) * 100)
}

/**
 * Squad 전체 분석: mergeTagProfiles + calcMatchScore + topSharedTags + conflictTags
 */
export function analyzeSquad(members: SquadMember[]): SquadAnalysis {
  const profiles = members.map(m => m.tagProfile)
  const mergedProfile = mergeTagProfiles(profiles)

  const matchScores: Record<string, number> = {}
  for (const m of members) {
    matchScores[m.steamId] = calcMatchScore(m.tagProfile, mergedProfile)
  }

  const avgMatchScore = Math.round(
    Object.values(matchScores).reduce((a, b) => a + b, 0) / members.length
  )

  // topSharedTags: mergedProfile 상위 5개 태그
  const topSharedTags = Object.entries(mergedProfile)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag]) => tag)

  // conflictTags: 한 멤버만 강하게 가진 태그 (개인 score > 0.5, mergedProfile에 없는)
  const conflictSet = new Set<string>()
  for (const m of members) {
    for (const [tag, score] of Object.entries(m.tagProfile)) {
      if (score > 0.5 && (mergedProfile[tag] ?? 0) < 0.1) {
        conflictSet.add(tag)
      }
    }
  }
  const conflictTags = [...conflictSet].slice(0, 5)

  // 모든 멤버 소유 appId 합집합 (추천 제외 목록)
  const allExcludedAppIds = [...new Set(members.flatMap(m => m.ownedAppIds))]

  return { mergedProfile, matchScores, avgMatchScore, topSharedTags, conflictTags, allExcludedAppIds }
}
