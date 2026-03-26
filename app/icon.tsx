import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

// All geometry constants at module level — stable across renders
const CX = 16, CY = 16, R = 13
const hexPath = Array.from({ length: 6 }, (_, i) => {
  const rad = ((-90 + 60 * i) * Math.PI) / 180
  return [CX + R * Math.cos(rad), CY + R * Math.sin(rad)] as [number, number]
}).map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z'

const CH = 6.5, CW = 5, CG = 3
const X0 = CX - (CW * 2 + CG) / 2

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: 32, height: 32, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg viewBox="0 0 32 32" width={32} height={32} fill="none">
          <path d={hexPath} fill="rgba(197,241,53,0.08)" stroke="#C5F135" strokeWidth="1.4" strokeLinejoin="round"/>
          <polyline points={`${X0},${CY-CH} ${X0+CW},${CY} ${X0},${CY+CH}`} stroke="#C5F135" strokeWidth="2.0" strokeLinecap="butt" strokeLinejoin="miter" fill="none"/>
          <polyline points={`${X0+CW+CG},${CY-CH} ${X0+CW*2+CG},${CY} ${X0+CW+CG},${CY+CH}`} stroke="#C5F135" strokeWidth="2.0" strokeLinecap="butt" strokeLinejoin="miter" fill="none" opacity={0.48}/>
        </svg>
      </div>
    ),
    { ...size }
  )
}
