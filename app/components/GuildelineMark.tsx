// Guildeline mark — uses guildeline-logo.png (transparent bg)
// Used in auth modals and reset-password page

import Image from 'next/image'

interface GuildelineMarkProps {
  size?: number
}

export default function GuildelineMark({ size = 48 }: GuildelineMarkProps) {
  return (
    <Image
      src="/guildeline-logo.png"
      alt=""
      width={size}
      height={size}
      unoptimized
      aria-hidden="true"
    />
  )
}
