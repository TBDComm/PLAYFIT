// app/users/[userId]/opengraph-image.tsx
// 공개 프로필 OG 카드 — 닉네임 + 상위 태그 + 활동 통계

import { ImageResponse } from 'next/og'
import { serviceSupabase } from '@/lib/supabase'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function UserOgImage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const { userId } = await params

  if (!UUID_RE.test(userId)) {
    return fallbackImage()
  }

  const [profileRes, tagsRes, savedCountRes, squadCountRes] = await Promise.all([
    serviceSupabase
      .from('user_profiles')
      .select('display_name, bio, is_public')
      .eq('id', userId)
      .maybeSingle(),
    serviceSupabase
      .from('user_tag_weights')
      .select('tag, weight')
      .eq('user_id', userId)
      .order('weight', { ascending: false })
      .limit(5),
    serviceSupabase
      .from('saved_games')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    serviceSupabase
      .from('squad_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('host_user_id', userId)
      .gt('expires_at', new Date().toISOString()),
  ])

  const profile = profileRes.data as { display_name: string | null; bio: string | null; is_public: boolean } | null
  if (!profile || !profile.is_public) {
    return fallbackImage()
  }

  const displayName = profile.display_name?.trim() || '익명 게이머'
  const tags = (tagsRes.data ?? []) as { tag: string; weight: number }[]
  const savedCount = savedCountRes.count ?? 0
  const squadCount = squadCountRes.count ?? 0

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 100px 56px',
          position: 'relative',
        }}
      >
        {/* 상단: 로고 + PROFILE 뱃지 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${process.env.NEXT_PUBLIC_BASE_URL}/guildeline-logo.png`} width={54} height={47} alt="" />
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
            <span style={{ color: '#C5F135' }}>GUILD</span>
            <span style={{ color: '#F5F5F0' }}>ELINE</span>
          </div>
          <div
            style={{
              marginLeft: 16,
              padding: '4px 12px',
              border: '1px solid #3F3F46',
              borderRadius: 4,
              fontSize: 20,
              color: '#71717A',
              letterSpacing: '0.08em',
            }}
          >
            PROFILE
          </div>
        </div>

        {/* 중앙: 닉네임 + bio + 태그 */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 64, fontWeight: 700, color: '#F5F5F0', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
            {displayName}
          </div>

          {profile.bio && (
            <div style={{ fontSize: 26, color: '#71717A', lineHeight: 1.4, maxWidth: 880 }}>
              {profile.bio}
            </div>
          )}

          {/* 태그 + 통계 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
            {tags.map(t => (
              <div
                key={t.tag}
                style={{
                  padding: '6px 18px',
                  background: '#1A1A1A',
                  border: '1px solid #3F3F46',
                  borderRadius: 20,
                  fontSize: 22,
                  color: '#A1A1AA',
                }}
              >
                {t.tag}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 32, marginTop: 8, fontSize: 24, color: '#71717A' }}>
            <span>저장한 게임 {savedCount}개</span>
            <span>스쿼드 {squadCount}회</span>
          </div>
        </div>

        {/* 하단: URL */}
        <div style={{ position: 'absolute', bottom: 56, right: 100, fontSize: 22, color: '#3F3F46' }}>
          guildeline.com
        </div>

        {/* 라임 악센트 */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: '#C5F135' }} />
      </div>
    ),
    { ...size },
  )
}

function fallbackImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#0A0A0A',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', fontSize: 64, fontWeight: 700 }}>
          <span style={{ color: '#C5F135' }}>GUILD</span>
          <span style={{ color: '#F5F5F0' }}>ELINE</span>
        </div>
        <div style={{ fontSize: 32, color: '#71717A', marginTop: 20 }}>
          프로필을 찾을 수 없어요
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: '#C5F135' }} />
      </div>
    ),
    { width: 1200, height: 630 },
  )
}
