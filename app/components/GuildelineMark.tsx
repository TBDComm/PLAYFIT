// Guildeline hexagon mark — mirrors app/icon.tsx design
// Used in auth modals and reset-password page

// All values are constants — computed once at module level, never on render
const cx = 16, cy = 16, r = 13
const HEX_PATH = Array.from({ length: 6 }, (_, i) => {
  const rad = ((-90 + 60 * i) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as [number, number]
}).map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z'

// Arrowhead chevrons — horizontal top/bottom cuts, pointed tip
// a = arm base half-width (hw=1.0 → L/ch); cg reduced 4→3 (closer together)
const ch = 6.5, cw = 5, cg = 3
const a = Math.sqrt(cw * cw + ch * ch) / ch
const x0 = cx - (cw * 2 + cg) / 2

function chevPts(xi: number): string {
  return [
    `${(xi - a).toFixed(2)},${cy - ch}`,
    `${(xi + a).toFixed(2)},${cy - ch}`,
    `${xi + cw},${cy}`,
    `${(xi + a).toFixed(2)},${cy + ch}`,
    `${(xi - a).toFixed(2)},${cy + ch}`,
  ].join(' ')
}

const CHEV1_PTS = chevPts(x0)
const CHEV2_PTS = chevPts(x0 + cw + cg)

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
      <polygon points={CHEV1_PTS} fill="#C5F135" />
      <polygon points={CHEV2_PTS} fill="#C5F135" opacity={0.48} />
    </svg>
  )
}
