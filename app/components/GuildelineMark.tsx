// Guildeline hexagon mark — mirrors app/icon.tsx design
// Used in auth modals and reset-password page

// All values are constants — computed once at module level, never on render
const cx = 16, cy = 16, r = 14
const HEX_PATH = Array.from({ length: 6 }, (_, i) => {
  const rad = ((-90 + 60 * i) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as [number, number]
}).map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z'

const ch = 7, cw = 5.5, cg = 4.5
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
      <path d={HEX_PATH} fill="#0A0A0A" stroke="#C5F135" strokeWidth="0.8" strokeLinejoin="round" />
      <polyline
        points={CHEV1}
        stroke="#C5F135" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <polyline
        points={CHEV2}
        stroke="#C5F135" strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round"
        opacity={0.38}
      />
    </svg>
  )
}
