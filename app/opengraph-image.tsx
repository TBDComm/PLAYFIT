// app/opengraph-image.tsx
// Next.js App Router — generates /opengraph-image via ImageResponse

import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'


export default function OgImage() {
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
          padding: '80px 100px',
          position: 'relative',
        }}
      >
        {/* Logo row: icon + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28, marginBottom: 48 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${process.env.NEXT_PUBLIC_BASE_URL}/guildeline-logo.png`} width={108} height={95} alt="" />
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
            <span style={{ color: '#C5F135' }}>GUILD</span>
            <span style={{ color: '#F5F5F0' }}>ELINE</span>
          </div>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 44, color: '#F5F5F0', fontWeight: 600, marginBottom: 20, lineHeight: 1.25 }}>
          Steam 플레이 기록 기반 게임 추천
        </div>

        {/* Description */}
        <div style={{ fontSize: 28, color: '#71717A', lineHeight: 1.5 }}>
          82,816개 게임 분석 · AI 태그 취향 매칭 · 예산 맞춤 추천
        </div>

        {/* URL — bottom right */}
        <div style={{ position: 'absolute', bottom: 56, right: 100, fontSize: 22, color: '#3F3F46' }}>
          guildeline.com
        </div>

        {/* Lime accent line — bottom edge */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: '#C5F135' }} />
      </div>
    ),
    { ...size }
  )
}
