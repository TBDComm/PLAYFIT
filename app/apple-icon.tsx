// app/apple-icon.tsx
// iOS home screen icon — 180×180, dark hex + lime chevrons
// Next.js App Router generates /apple-touch-icon.png automatically

import { ImageResponse } from 'next/og'

export const size        = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  const cx = 90, cy = 90, r = 73
  const hex = Array.from({ length: 6 }, (_, i) => {
    const rad = ((-90 + 60 * i) * Math.PI) / 180
    return `${(cx + r * Math.cos(rad)).toFixed(1)},${(cy + r * Math.sin(rad)).toFixed(1)}`
  }).join(' ')

  const ch = 37, cw = 28, cg = 23
  const x0 = cx - (cw * 2 + cg) / 2

  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 180 180" width={180} height={180} fill="none">
          <polygon points={hex} fill="rgba(197,241,53,0.08)" stroke="#C5F135" strokeWidth="8" strokeLinejoin="round"/>
          <polyline points={`${x0},${cy-ch} ${x0+cw},${cy} ${x0},${cy+ch}`} stroke="#C5F135" strokeWidth="14" strokeLinecap="butt" strokeLinejoin="miter" fill="none"/>
          <polyline points={`${x0+cw+cg},${cy-ch} ${x0+cw*2+cg},${cy} ${x0+cw+cg},${cy+ch}`} stroke="#C5F135" strokeWidth="14" strokeLinecap="butt" strokeLinejoin="miter" fill="none" opacity={0.48}/>
        </svg>
      </div>
    ),
    { ...size }
  )
}
