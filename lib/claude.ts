import type { Recommendation } from '@/types'

export interface PlayHistoryForClaude {
  name: string
  playtime_hours: number
  top_tags: string[]
}

export interface CandidateForClaude {
  appid: number
  name: string
  top_tags: string[]
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
- Write recommendation reason in 1-2 Korean sentences
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
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const parsed = JSON.parse(text) as { recommendations: Recommendation[] }
    if (!Array.isArray(parsed.recommendations)) return 'AI_PARSE_FAILURE'
    return parsed.recommendations
  } catch {
    return 'AI_PARSE_FAILURE'
  }
}
