// Guildeline mark + wordmark — used in auth modals and reset-password page

import Image from 'next/image'
import styles from './GuildelineMark.module.css'

interface GuildelineMarkProps {
  size?: number
}

export default function GuildelineMark({ size = 48 }: GuildelineMarkProps) {
  return (
    <div className={styles.wrap}>
      <Image
        src="/guildeline-logo.png"
        alt=""
        width={size}
        height={Math.round(size * 0.875)}
        unoptimized
        aria-hidden="true"
      />
      <span className={styles.wordmark} style={{ fontSize: Math.round(size * 0.5) }}>
        <span className={styles.accent}>GUILD</span>ELINE
      </span>
    </div>
  )
}
