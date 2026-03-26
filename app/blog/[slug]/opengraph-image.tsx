// app/blog/[slug]/opengraph-image.tsx
// Per-post OG image — same brand style as /opengraph-image
// Next.js automatically uses this as the OG image for /blog/[slug]

import { ImageResponse } from 'next/og'
import { getPost } from '@/lib/blog'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const runtime = 'edge'

export default function BlogPostOgImage({
  params,
}: {
  params: { slug: string }
}) {
  const entry = getPost(params.slug)
  const title = entry?.meta.title ?? 'Guildeline 블로그'
  const description = entry?.meta.description ?? 'Steam 게임 추천 블로그'

  // Hexagon icon — same as root OG image
  const cx = 40, cy = 40, r = 33
  const hex = Array.from({ length: 6 }, (_, i) => {
    const rad = ((-90 + 60 * i) * Math.PI) / 180
    return `${(cx + r * Math.cos(rad)).toFixed(1)},${(cy + r * Math.sin(rad)).toFixed(1)}`
  }).join(' ')

  // Arrowhead chevrons — horizontal cuts, pointed tip, cg 10→8 (closer)
  const ch = 16, cw = 13, cg = 8
  const x0 = cx - (cw * 2 + cg) / 2
  const a = Math.sqrt(cw * cw + ch * ch) / ch * 2.5  // hw=2.5 (proportional to 80/32 scale)

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
          justifyContent: 'space-between',
          padding: '72px 100px 60px',
          position: 'relative',
        }}
      >
        {/* Top: logo wordmark + BLOG label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <svg viewBox="0 0 80 80" width={54} height={54} fill="none">
            <polygon
              points={hex}
              fill="rgba(197,241,53,0.08)"
              stroke="#C5F135"
              strokeWidth="3.5"
              strokeLinejoin="round"
            />
            <polygon points={pts(x0)} fill="#C5F135" />
            <polygon points={pts(x0 + cw + cg)} fill="#C5F135" opacity={0.48} />
          </svg>
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
            BLOG
          </div>
        </div>

        {/* Middle: post title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 58,
              fontWeight: 700,
              color: '#F5F5F0',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              maxWidth: 960,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 26,
              color: '#71717A',
              lineHeight: 1.5,
              maxWidth: 880,
            }}
          >
            {description}
          </div>
        </div>

        {/* Bottom: URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 56,
            right: 100,
            fontSize: 22,
            color: '#3F3F46',
          }}
        >
          guildeline.com/blog
        </div>

        {/* Lime accent line */}
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
