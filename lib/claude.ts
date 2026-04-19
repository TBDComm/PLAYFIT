import Anthropic from '@anthropic-ai/sdk'
import type { Recommendation, SquadRecommendationCard } from '@/types'

interface PlayHistoryForClaude {
  name: string
  playtime_hours: number
  top_tags: string[]
}

interface CandidateForClaude {
  appid: number
  name: string
  top_tags: string[]
}

interface SquadCandidateForClaude {
  appid: number
  name: string
  price_krw: number | null
  is_free: boolean
  metacritic_score?: number
  top_tags: string[]
}

interface SquadContext {
  memberCount: number
  avgMatchScore: number
  topSharedTags: string[]
  conflictTags: string[]
  budget: number | null
  freeOnly: boolean
  // ENH-2: steamId → 코드에서 사전 선택된 멤버별 후보 2개
  memberCandidates: Record<string, SquadCandidateForClaude[]>
}

export interface SquadResult {
  groupRecs: SquadRecommendationCard[]
  memberPicks: Record<string, SquadRecommendationCard[]>
  analysisReason: string
}

// 모듈 수준 싱글톤 — 매 호출마다 재생성 방지
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const SYSTEM_PROMPT =
  'You are a Steam game recommendation engine. Match games to the user\'s taste based on tag overlap with their play history. Respond ONLY in valid JSON.'

export async function getRecommendations(
  playHistory: PlayHistoryForClaude[],
  candidates: CandidateForClaude[]
): Promise<Recommendation[] | 'AI_PARSE_FAILURE'> {
  const userPrompt = `Play history (top 15 by playtime):
${JSON.stringify(playHistory)}

Candidate games:
${JSON.stringify(candidates)}

Rules:
- Select exactly 5 games with highest tag overlap to user history
- Write recommendation reason in 1 short Korean sentence
- Reference specific games from user history in the reason
- Never mention popularity or trending
- Never recommend games the user already owns

Response format:
{"recommendations": [{"appid": "", "reason": ""}]}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return 'AI_PARSE_FAILURE'
    const parsed = JSON.parse(jsonMatch[0]) as { recommendations: Recommendation[] }
    if (!Array.isArray(parsed.recommendations)) return 'AI_PARSE_FAILURE'
    return parsed.recommendations
  } catch (e) {
    console.error('[claude] AI_PARSE_FAILURE:', e)
    return 'AI_PARSE_FAILURE'
  }
}

/**
 * Squad용 Claude 추천 — 5개, 멀티플레이 컨텍스트 포함
 * 기존 getRecommendations와 동일한 모델/max_tokens 사용
 */
export async function getSquadRecommendations(
  candidates: SquadCandidateForClaude[],
  ctx: SquadContext
): Promise<SquadResult | 'AI_PARSE_FAILURE'> {
  const budgetNote = ctx.freeOnly
    ? '무료 게임만 추천'
    : ctx.budget
    ? `예산 ${ctx.budget.toLocaleString()}원 이하`
    : '예산 제한 없음'

  // 멤버픽 후보 문자열 (steamId 노출 없이 인덱스로 표기)
  const memberEntries = Object.entries(ctx.memberCandidates)
  const memberPickSection = memberEntries.length > 0
    ? `\n각 멤버의 개인 추천 후보 (시스템이 사전 선택 — 이유만 생성):
${memberEntries.map(([sid, picks], i) =>
  `멤버${i + 1}(id:${sid}): ${JSON.stringify(picks.map(p => ({ appid: p.appid, name: p.name, top_tags: p.top_tags })))}`
).join('\n')}`
    : ''

  const userPrompt = `${ctx.memberCount}명이 함께 플레이할 게임을 추천해야 합니다.
평균 취향 일치율: ${ctx.avgMatchScore}%
공통 관심 태그: ${ctx.topSharedTags.join(', ')}
${ctx.conflictTags.length > 0 ? `취향이 갈리는 태그: ${ctx.conflictTags.join(', ')}` : ''}
조건: ${budgetNote}

후보 게임 목록:
${JSON.stringify(candidates)}
${memberPickSection}

규칙:
- recommendations: 후보에서 정확히 5개 선택, 태그 공통점 높은 게임 우선, 멤버픽과 중복 금지
- 추천 이유는 짧은 한국어 한 문장, ${ctx.memberCount}명이 함께 즐길 수 있는 이유 포함
- memberPicks: 각 멤버의 개인 후보에 짧은 한국어 이유 한 문장 추가 (해당 멤버 취향에 맞는 이유)
- analysisReason: 그룹 전체 취향 분석 요약 1~2문장 (공통 태그와 갈등 태그 기반, 한국어)
- 인기나 트렌드 언급 금지

응답 형식:
{"recommendations":[{"appid":"","reason":""}],"memberPicks":{"<id>":[{"appid":"","reason":""}]},"analysisReason":""}`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = message.content[0]?.type === 'text' ? message.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[claude] Squad JSON not found, raw:', raw.slice(0, 300))
      return 'AI_PARSE_FAILURE'
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      recommendations: Recommendation[]
      memberPicks?: Record<string, Recommendation[]>
      analysisReason?: string
    }
    if (!Array.isArray(parsed.recommendations)) return 'AI_PARSE_FAILURE'

    // 그룹 추천 — 가격/태그 메타데이터 병합
    const groupRecs: SquadRecommendationCard[] = []
    for (const rec of parsed.recommendations) {
      const candidate = candidates.find(c => String(c.appid) === String(rec.appid))
      if (!candidate) continue
      groupRecs.push({
        appid: candidate.appid,
        name: candidate.name,
        reason: rec.reason,
        price_krw: candidate.price_krw,
        is_free: candidate.is_free,
        metacritic_score: candidate.metacritic_score,
        store_url: `https://store.steampowered.com/app/${candidate.appid}`,
        tag_snapshot: candidate.top_tags.slice(0, 5),
      })
    }

    // 멤버픽 — 코드에서 사전 선택된 후보에 Claude reason 병합
    const memberPicks: Record<string, SquadRecommendationCard[]> = {}
    for (const [steamId, picks] of memberEntries) {
      const claudePicks = parsed.memberPicks?.[steamId] ?? []
      memberPicks[steamId] = picks.map(candidate => {
        const claudeRec = claudePicks.find(r => String(r.appid) === String(candidate.appid))
        return {
          appid: candidate.appid,
          name: candidate.name,
          reason: claudeRec?.reason ?? '',
          price_krw: candidate.price_krw,
          is_free: candidate.is_free,
          metacritic_score: candidate.metacritic_score,
          store_url: `https://store.steampowered.com/app/${candidate.appid}`,
          tag_snapshot: candidate.top_tags.slice(0, 5),
        }
      })
    }

    return { groupRecs, memberPicks, analysisReason: parsed.analysisReason ?? '' }
  } catch (e) {
    console.error('[claude] Squad AI_PARSE_FAILURE:', e)
    return 'AI_PARSE_FAILURE'
  }
}
