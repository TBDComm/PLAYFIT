// app/opengraph-image.tsx
// Next.js App Router — generates /opengraph-image via ImageResponse
// Design: Guildeline brand (Logo.tsx spec) — #0A0A0A bg, #C5F135 lime, hex+chevron icon

import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  // Hexagon: flat-top, center (80,80), radius 65 — within 160×160 viewBox
  const cx = 80, cy = 80, r = 65
  const hex = Array.from({ length: 6 }, (_, i) => {
    const rad = ((-90 + 60 * i) * Math.PI) / 180
    return `${(cx + r * Math.cos(rad)).toFixed(1)},${(cy + r * Math.sin(rad)).toFixed(1)}`
  }).join(' ')

  // Arrowhead chevrons — horizontal cuts, pointed tip, cg 20→15 (closer)
  const ch = 32, cw = 25, cg = 15
  const x0 = cx - (cw * 2 + cg) / 2
  const a = Math.sqrt(cw * cw + ch * ch) / ch * 5.0  // hw=5.0 (proportional to 160/32 scale)

  const pts = (xi: number) => [
    `${(xi - a).toFixed(2)},${cy - ch}`,
    `${(xi + a).toFixed(2)},${cy - ch}`,
    `${xi + cw},${cy}`,
    `${(xi + a).toFixed(2)},${cy + ch}`,
    `${(xi - a).toFixed(2)},${cy + ch}`,
  ].join(' ')

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
          <svg viewBox="0 0 160 160" width={108} height={108} fill="none">
            <polygon
              points={hex}
              fill="rgba(197,241,53,0.08)"
              stroke="#C5F135"
              strokeWidth="7"
              strokeLinejoin="round"
            />
            <polygon points={pts(x0)} fill="#C5F135" />
            <polygon points={pts(x0 + cw + cg)} fill="#C5F135" opacity={0.48} />
          </svg>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
            <span style={{ color: '#C5F135' }}>GUILD</span>
            <span style={{ color: '#F5F5F0' }}>ELINE</span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 44,
            color: '#F5F5F0',
            fontWeight: 600,
            marginBottom: 20,
            lineHeight: 1.25,
          }}
        >
          Steam 플레이 기록 기반 게임 추천
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: 28,
            color: '#71717A',
            lineHeight: 1.5,
          }}
        >
          82,816개 게임 분석 · AI 태그 취향 매칭 · 예산 맞춤 추천
        </div>

        {/* URL — bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            right: 100,
            fontSize: 22,
            color: '#3F3F46',
          }}
        >
          guildeline.com
        </div>

        {/* Lime accent line — bottom edge */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 5,
            background: '#C5F135',
          }}
        />
      </div>
    ),
    { ...size }
  )
}
