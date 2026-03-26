// Guildeline hexagon mark — mirrors app/icon.tsx design
// Used in auth modals and reset-password page

// All values are constants — computed once at module level, never on render
const cx = 16, cy = 16, r = 13
const HEX_PATH = Array.from({ length: 6 }, (_, i) => {
  const rad = ((-90 + 60 * i) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as [number, number]
}).map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z'

const ch = 6.5, cw = 5, cg = 4
const x0 = cx - (cw * 2 + cg) / 2
const CHEV1 = `${x0},${cy - ch} ${x0 + cw},${cy} ${x0},${cy + ch}`
const CHEV2 = `${x0 + cw + cg},${cy - ch} ${x0 + cw * 2 + cg},${cy} ${x0 + cw + cg},${cy + ch}`

interface GuildelineMarkProps {
  size?: number
}

export default function GuildelineMark({ size = 48 }: GuildelineMarkProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <path d={HEX_PATH} fill="rgba(197,241,53,0.08)" stroke="#C5F135" strokeWidth={1.4} strokeLinejoin="round" />
      <polyline
        points={CHEV1}
        stroke="#C5F135" strokeWidth={2.5}
        strokeLinecap="butt" strokeLinejoin="miter"
      />
      <polyline
        points={CHEV2}
        stroke="#C5F135" strokeWidth={2.5}
        strokeLinecap="butt" strokeLinejoin="miter"
        opacity={0.48}
      />
    </svg>
  )
}
