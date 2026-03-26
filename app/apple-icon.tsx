// app/apple-icon.tsx
// iOS home screen icon — 180×180, dark bg + guildeline-logo.png mark
// Next.js App Router generates /apple-touch-icon.png automatically

import { ImageResponse } from 'next/og'

export const size        = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://guildeline.com'
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${base}/guildeline-logo.png`} width={136} height={136} alt="" style={{ objectFit: 'contain' }} />
      </div>
    ),
    { ...size }
  )
}
