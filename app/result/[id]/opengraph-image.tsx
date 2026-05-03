// app/result/[id]/opengraph-image.tsx
// 추천 결과 OG 카드 — 상위 태그 + 추천 게임 수

import { ImageResponse } from 'next/og'
import { createServerClient } from '@supabase/ssr'
import type { RecommendationCard } from '@/types'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function ResultOgImage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
  const { data: rec } = await supabase
    .from('recommendation_sets')
    .select('tags, cards')
    .eq('id', id)
    .single()

  const tags: string[] = Array.isArray(rec?.tags) ? (rec.tags as string[]) : []
  const cards: RecommendationCard[] = Array.isArray(rec?.cards) ? (rec.cards as RecommendationCard[]) : []
  const topTags = tags.slice(0, 3)
  const gameCount = cards.length

  const brandCard = (
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
        스팀 취향 게임 추천
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: '#C5F135' }} />
    </div>
  )

  if (!rec || topTags.length === 0) {
    return new ImageResponse(brandCard, { ...size })
  }

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
        {/* 상단: 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${process.env.NEXT_PUBLIC_BASE_URL}/guildeline-logo.png`} width={54} height={47} alt="" />
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
            <span style={{ color: '#C5F135' }}>GUILD</span>
            <span style={{ color: '#F5F5F0' }}>ELINE</span>
          </div>
        </div>

        {/* 중앙: 게임 수 히어로 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center', gap: 12 }}>
          <div style={{ fontSize: 120, fontWeight: 800, color: '#C5F135', lineHeight: 1 }}>
            {gameCount}
          </div>
          <div style={{ fontSize: 32, color: '#F5F5F0', fontWeight: 600 }}>
            개 맞춤 게임 추천
          </div>

          {/* 태그 */}
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
            {topTags.map(tag => (
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
