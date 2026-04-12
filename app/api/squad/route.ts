import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { parseSteamUrl, resolveVanityUrl, getOwnedGames, getGameDetails, sleep } from '@/lib/steam'
import { getSquadRecommendations } from '@/lib/claude'
import {
  isDbReady,
  getTagsForGames,
  getUserTagWeights,
  scoreCandidates,
  serviceSupabase,
  getGamePriceCache,
  upsertGamePriceCache,
  saveSquadSession,
} from '@/lib/supabase'
import { buildTagProfile, analyzeSquad } from '@/lib/squad'
import type { ErrorCode, SquadMember, GameDetails } from '@/types'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// URL에서 steamId 추출 — vanity면 API 조회
async function resolveSteamId(url: string): Promise<string | null> {
  const parsed = parseSteamUrl(url.trim())
  if (parsed.type === 'invalid') return null
  if (parsed.type === 'steamid') return parsed.steamId
  return resolveVanityUrl(parsed.vanity)
}

// share_token 생성 — crypto.randomUUID() hex 앞 10자
function generateShareToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 10)
}

export async function POST(request: NextRequest) {
  const [cookieStore, body] = await Promise.all([
    cookies(),
    request.json() as Promise<{ memberUrls?: unknown; budget?: unknown; freeOnly?: unknown }>,
  ])

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  try {
    // 1. 입력 검증
    const memberUrls = Array.isArray(body.memberUrls) ? body.memberUrls as string[] : []
    if (memberUrls.length < 2 || memberUrls.length > 4) {
      return NextResponse.json(
        { error: 'INVALID_URL' satisfies ErrorCode, message: 'Squad requires 2–4 members' },
        { status: 400 }
      )
    }
    const freeOnly = body.freeOnly === true
    const budget = !freeOnly && typeof body.budget === 'number' ? body.budget : null

    // 2. 호스트 세션 + DB 준비 병렬 체크
    const [{ data: { session } }, dbReady] = await Promise.all([
      supabase.auth.getSession(),
      isDbReady(),
    ])
    if (!dbReady) {
      return NextResponse.json({ error: 'DB_NOT_READY' satisfies ErrorCode }, { status: 503 })
    }
    const hostUserId = session?.user?.id ?? null

    // 3. URL → steamId 변환 (병렬 가능 — API rate limit 낮음)
    const steamIdResults = await Promise.all(memberUrls.map(resolveSteamId))
    const steamIds = steamIdResults.filter((id): id is string => id !== null)
    if (steamIds.length < 2) {
      return NextResponse.json(
        { error: 'INVALID_URL' satisfies ErrorCode, message: 'Could not resolve Steam URLs' },
        { status: 400 }
      )
    }

    // 4. 각 멤버 Steam 게임 목록 순차 조회 (200ms 딜레이 — Steam rate limit 방어)
    type OwnedResult = { steamId: string; playHistory: import('@/types').PlayHistory[]; ownedAppIds: number[] }
    const validMembers: OwnedResult[] = []
    const skippedReasons: string[] = []

    for (const steamId of steamIds) {
      const result = await getOwnedGames(steamId)
      if (result === 'PRIVATE_PROFILE' || result === 'INSUFFICIENT_HISTORY') {
        skippedReasons.push(`${steamId}: ${result}`)
      } else {
        validMembers.push({ steamId, ...result })
      }
      if (steamId !== steamIds[steamIds.length - 1]) await sleep(200)
    }

    // 유효 멤버 2명 미만이면 에러
    if (validMembers.length === 0) {
      return NextResponse.json({ error: 'ALL_PRIVATE' satisfies ErrorCode }, { status: 400 })
    }
    if (validMembers.length < 2) {
      return NextResponse.json({ error: 'NOT_ENOUGH_MEMBERS' satisfies ErrorCode }, { status: 400 })
    }

    // 5. 모든 멤버 appId 합집합으로 태그 한 번에 조회
    const allAppIds = [...new Set(validMembers.flatMap(m => m.ownedAppIds))]
    const allPlayedAppIds = [...new Set(validMembers.flatMap(m => m.playHistory.map(g => g.appid)))]

    const [gameTags, hostWeights] = await Promise.all([
      getTagsForGames(allPlayedAppIds),
      // 호스트 weights: 로그인 유저 ID 우선, 없으면 첫 멤버 steamId
      hostUserId
        ? getUserTagWeights(hostUserId, 'user_id')
        : getUserTagWeights(validMembers[0].steamId, 'steam_id'),
    ])

    // 6. 각 멤버 TagProfile 생성 → Squad 분석
    const squadMembers: SquadMember[] = validMembers.map(m => ({
      steamId: m.steamId,
      tagProfile: buildTagProfile(m.playHistory, gameTags),
      ownedAppIds: m.ownedAppIds,
    }))

    const analysis = analyzeSquad(squadMembers)

    if (Object.keys(analysis.mergedProfile).length === 0) {
      return NextResponse.json({ error: 'TAG_EXTRACTION_FAILED' satisfies ErrorCode }, { status: 400 })
    }

    // 7. 후보 게임 스코어링 — 기존 RPC 그대로 재사용
    const excludeAppIds = analysis.allExcludedAppIds.map(String)
    const scored = await scoreCandidates(analysis.mergedProfile, hostWeights, excludeAppIds, 50)
    if (scored.length === 0) {
      return NextResponse.json({ error: 'GENERAL_ERROR' satisfies ErrorCode }, { status: 500 })
    }

    // 8. 가격 캐시 조회 → 미스만 Steam 조회 (최대 10개 cap)
    const scoredAppids = scored.map(s => s.appid)
    const priceCache = await getGamePriceCache(scoredAppids)

    const PRICE_TTL_MS = 24 * 60 * 60 * 1000
    const now = Date.now()

    const needsFetch = scored
      .filter(s => {
        const cached = priceCache.get(s.appid)
        if (!cached) return true
        if (cached.price_updated_at === null) return true
        return now - new Date(cached.price_updated_at).getTime() > PRICE_TTL_MS
      })
      .map(s => s.appid)
      .slice(0, 10)  // subrequest 예산 상한

    const fetchedDetails = needsFetch.length > 0
      ? await Promise.all(needsFetch.map(id => getGameDetails(Number(id))))
      : []

    // 캐시 업데이트 fire-and-forget
    void Promise.all(
      needsFetch.map((id, i) => {
        const d = fetchedDetails[i]
        if (!d) return Promise.resolve()
        return upsertGamePriceCache(d.appid, d.price_krw ?? 0, d.is_free, d.metacritic_score)
      })
    )

    // 9. 가격 정보 통합 맵
    const detailMap = new Map<string, GameDetails>()
    for (let i = 0; i < needsFetch.length; i++) {
      const d = fetchedDetails[i]
      if (d) detailMap.set(String(d.appid), d)
    }
    for (const [id, cached] of priceCache) {
      if (!detailMap.has(id)) {
        const name = scored.find(s => s.appid === id)?.name ?? ''
        detailMap.set(id, {
          appid: Number(id),
          name,
          price_krw: cached.price_krw,
          is_free: cached.is_free,
          metacritic_score: cached.metacritic_score ?? undefined,
        })
      }
    }

    // 10. 예산/무료 필터 적용 → 상위 20개
    const candidates = scored
      .map(s => {
        const details = detailMap.get(s.appid)
        if (!details) return null
        if (freeOnly && !details.is_free) return null
        if (!freeOnly && budget !== null && !details.is_free && details.price_krw !== null && details.price_krw > budget) return null
        return {
          ...details,
          top_tags: Object.entries(s.tags ?? {})
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([tag]) => tag),
        }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .slice(0, 20)

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: 'NO_GAMES_IN_BUDGET' satisfies ErrorCode, filters: { freeOnly, budget } },
        { status: 400 }
      )
    }

    // 11. Claude Squad 추천
    const claudeResult = await getSquadRecommendations(candidates, {
      memberCount: validMembers.length,
      avgMatchScore: analysis.avgMatchScore,
      topSharedTags: analysis.topSharedTags,
      conflictTags: analysis.conflictTags,
      budget,
      freeOnly,
    })

    if (claudeResult === 'AI_PARSE_FAILURE') {
      return NextResponse.json({ error: 'AI_PARSE_FAILURE' satisfies ErrorCode }, { status: 500 })
    }

    // 12. share_token 생성 + DB 저장
    const shareToken = generateShareToken()
    await saveSquadSession({
      share_token: shareToken,
      host_user_id: hostUserId,
      member_steam_ids: validMembers.map(m => m.steamId),
      member_count: validMembers.length,
      merged_profile: analysis.mergedProfile,
      result_cards: claudeResult,
      match_scores: analysis.matchScores,
      avg_match_score: analysis.avgMatchScore,
      top_shared_tags: analysis.topSharedTags,
      conflict_tags: analysis.conflictTags,
      budget_krw: budget,
      free_only: freeOnly,
    })

    return NextResponse.json({
      shareToken,
      shareUrl: `/squad/${shareToken}`,
      avgMatchScore: analysis.avgMatchScore,
      matchScores: analysis.matchScores,
      topSharedTags: analysis.topSharedTags,
      conflictTags: analysis.conflictTags,
      recommendations: claudeResult,
      skipped: skippedReasons,
    })

  } catch (e: unknown) {
    const err = e as Error
    console.error('[squad] GENERAL_ERROR:', err.message, err.stack)
    return NextResponse.json({ error: 'GENERAL_ERROR' satisfies ErrorCode }, { status: 500 })
  }
}
