// app/squad/[token]/opengraph-image.tsx
// 스쿼드 공유 페이지 OG 카드 — 평균 일치율 + 멤버수 + 공통 태그

import { ImageResponse } from 'next/og'
import { getSquadSession } from '@/lib/supabase'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function SquadOgImage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const session = await getSquadSession(token)

  // 세션 없으면 기본 브랜드 이미지
  if (!session) {
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
            스쿼드를 찾을 수 없어요
          </div>
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: '#C5F135' }} />
        </div>
      ),
      { ...size },
    )
  }

  const sharedTags = session.top_shared_tags.slice(0, 5)

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
        {/* 상단: 로고 + SQUAD 뱃지 */}
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
              border: '1px solid #C5F135',
              borderRadius: 4,
              fontSize: 20,
              color: '#C5F135',
              letterSpacing: '0.08em',
            }}
          >
            SQUAD
          </div>
        </div>

        {/* 중앙: 매치 스코어 히어로 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: 120, fontWeight: 800, color: '#C5F135', lineHeight: 1 }}>
            {session.avg_match_score}%
          </div>
          <div style={{ fontSize: 32, color: '#F5F5F0', fontWeight: 600 }}>
            {session.member_count}명 스쿼드 취향 일치율
          </div>

          {/* 공통 태그 */}
          {sharedTags.length > 0 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
              {sharedTags.map(tag => (
                <div
                  key={tag}
                  style={{
                    padding: '6px 18px',
                    background: '#1A1A1A',
                    border: '1px solid #3F3F46',
                    borderRadius: 20,
                    fontSize: 22,
                    color: '#A1A1AA',
                  }}
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단: URL */}
        <div style={{ position: 'absolute', bottom: 56, right: 100, fontSize: 22, color: '#3F3F46' }}>
          guildeline.com/squad
        </div>

        {/* 라임 악센트 */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: '#C5F135' }} />
      </div>
    ),
    { ...size },
  )
}
