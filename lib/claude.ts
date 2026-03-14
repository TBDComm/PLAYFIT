import type { PlayHistory, GameCandidate, Recommendation } from '@/types'

const SYSTEM_PROMPT =
  'You are a Steam game recommendation engine. Analyze the user\'s play history to identify their taste pattern and select 5 matching games from the candidates. Respond ONLY in valid JSON with no explanation outside the JSON.'

export async function getRecommendations(
  playHistory: PlayHistory[],
  candidates: GameCandidate[]
): Promise<Recommendation[] | 'AI_PARSE_FAILURE'> {
  const userPrompt = `Play history (top 15 by playtime):
${JSON.stringify(playHistory.map(g => ({ name: g.name, playtime_hours: g.playtime_hours, appid: g.appid })))}

Candidate games (not owned, within budget):
${JSON.stringify(candidates.map(g => ({ appid: g.appid, name: g.name, price_krw: g.price_krw, genres: g.genres })))}

Rules:
- Select exactly 5 games
- Reason: reference the user's actual play history, 20 Korean characters max
- Never use popularity or trending as criteria

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
    const text = data.content[0]?.type === 'text' ? data.content[0].text : ''
    const parsed = JSON.parse(text) as { recommendations: Recommendation[] }
    if (!Array.isArray(parsed.recommendations)) return 'AI_PARSE_FAILURE'
    return parsed.recommendations
  } catch {
    return 'AI_PARSE_FAILURE'
  }
}
