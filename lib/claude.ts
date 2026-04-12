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
}

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
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) return 'AI_PARSE_FAILURE'

    const data = await res.json() as { content: { type: string; text: string }[] }
    const raw = data.content[0]?.type === 'text' ? data.content[0].text : ''
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
): Promise<SquadRecommendationCard[] | 'AI_PARSE_FAILURE'> {
  const budgetNote = ctx.freeOnly
    ? '무료 게임만 추천'
    : ctx.budget
    ? `예산 ${ctx.budget.toLocaleString()}원 이하`
    : '예산 제한 없음'

  const userPrompt = `${ctx.memberCount}명이 함께 플레이할 게임을 추천해야 합니다.
평균 취향 일치율: ${ctx.avgMatchScore}%
공통 관심 태그: ${ctx.topSharedTags.join(', ')}
${ctx.conflictTags.length > 0 ? `취향이 갈리는 태그: ${ctx.conflictTags.join(', ')}` : ''}
조건: ${budgetNote}

후보 게임 목록:
${JSON.stringify(candidates)}

규칙:
- 정확히 5개 선택, 태그 공통점이 가장 높은 게임 우선
- 추천 이유는 짧은 한국어 한 문장, ${ctx.memberCount}명이 함께 즐길 수 있는 이유 포함
- 인기나 트렌드 언급 금지
- freeOnly가 true인 경우 is_free=true 게임만 선택

응답 형식:
{"recommendations": [{"appid": "", "reason": ""}]}`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    })

    if (!res.ok) return 'AI_PARSE_FAILURE'

    const data = await res.json() as { content: { type: string; text: string }[] }
    const raw = data.content[0]?.type === 'text' ? data.content[0].text : ''
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return 'AI_PARSE_FAILURE'

    const parsed = JSON.parse(jsonMatch[0]) as { recommendations: Recommendation[] }
    if (!Array.isArray(parsed.recommendations)) return 'AI_PARSE_FAILURE'

    // Claude 응답에 가격/태그 등 메타데이터 병합
    const result: SquadRecommendationCard[] = []
    for (const rec of parsed.recommendations) {
      const candidate = candidates.find(c => String(c.appid) === String(rec.appid))
      if (!candidate) continue
      result.push({
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
    return result
  } catch (e) {
    console.error('[claude] Squad AI_PARSE_FAILURE:', e)
    return 'AI_PARSE_FAILURE'
  }
}
