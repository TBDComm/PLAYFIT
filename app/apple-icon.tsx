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

  // Arrowhead chevrons — horizontal cuts, pointed tip, cg 23→17 (closer)
  const ch = 37, cw = 28, cg = 17
  const x0 = cx - (cw * 2 + cg) / 2
  const a = Math.sqrt(cw * cw + ch * ch) / ch * 5.625  // hw=5.625 (proportional to 180/32 scale)

  const pts = (xi: number) => [
    `${(xi - a).toFixed(2)},${cy - ch}`,
    `${(xi + a).toFixed(2)},${cy - ch}`,
    `${xi + cw},${cy}`,
    `${(xi + a).toFixed(2)},${cy + ch}`,
    `${(xi - a).toFixed(2)},${cy + ch}`,
  ].join(' ')

  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 180 180" width={180} height={180} fill="none">
          <polygon points={hex} fill="rgba(197,241,53,0.08)" stroke="#C5F135" strokeWidth="8" strokeLinejoin="round"/>
          <polygon points={pts(x0)} fill="#C5F135" />
          <polygon points={pts(x0 + cw + cg)} fill="#C5F135" opacity={0.48} />
        </svg>
      </div>
    ),
    { ...size }
  )
}
