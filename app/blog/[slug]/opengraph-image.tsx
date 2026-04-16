// app/blog/[slug]/opengraph-image.tsx
// Per-post OG image — same brand style as /opengraph-image

import { ImageResponse } from 'next/og'
import { getPost } from '@/lib/blog'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const runtime = 'edge'


export default async function BlogPostOgImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = getPost(slug)
  const title = entry?.meta.title ?? 'Guildeline 블로그'
  const description = entry?.meta.description ?? 'Steam 게임 추천 블로그'

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
            BLOG
          </div>
        </div>

        {/* Middle: post title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, justifyContent: 'center' }}>
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
          <div style={{ fontSize: 26, color: '#71717A', lineHeight: 1.5, maxWidth: 880 }}>
            {description}
          </div>
        </div>

        {/* Bottom: URL */}
        <div style={{ position: 'absolute', bottom: 56, right: 100, fontSize: 22, color: '#3F3F46' }}>
          guildeline.com/blog
        </div>

        {/* Lime accent line */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: '#C5F135' }} />
      </div>
    ),
    { ...size }
  )
}
