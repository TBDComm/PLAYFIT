'use client'

import { useEffect, useState } from 'react'
import styles from './LoadingOverlay.module.css'

const LINES = [
  '플레이 기록 분석 중…',
  '취향 태그 가중치 계산 중…',
  '82,816개 게임에서 매칭 중…',
] as const

interface Props {
  message: string
}

// Progress mapped to real stage completions — never goes backward
const STAGE_PROGRESS = ['0%', '28%', '60%', '85%'] as const

export default function LoadingOverlay({ message }: Props) {
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setRevealed(1), 400)
    const t2 = setTimeout(() => setRevealed(2), 1300)
    const t3 = setTimeout(() => setRevealed(3), 2200)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  return (
    <div className={styles.overlay} role="status" aria-live="polite" aria-label={message}>
      <div className={styles.content}>

        {/* Glitch entrance wordmark */}
        <p className={styles.wordmark} aria-hidden="true">
          <span className={styles.accent}>GUILD</span>ELINE
        </p>

        {/* Icon — outline glow orbits via drop-shadow offset rotation */}
        <div className={styles.iconWrap} aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/guildeline-logo.png" alt="" className={styles.iconImg} />
        </div>

        {/* Stage-driven progress gauge */}
        <div className={styles.progressTrack} aria-hidden="true">
          <div
            className={styles.progressFill}
            style={{ width: STAGE_PROGRESS[revealed] }}
          />
        </div>

        {/* Terminal log */}
        <div className={styles.terminal} aria-hidden="true">
          {LINES.map((line, i) =>
            revealed > i ? (
              <div key={i} className={styles.termLine}>
                <span className={styles.termPrompt}>›</span>
                <span className={styles.termText}>{line}</span>
                {revealed > i + 1 ? (
                  <span className={styles.termDone}>✓</span>
                ) : (
                  <span className={styles.termBar}>
                    <span className={styles.termBarFill} />
                  </span>
                )}
              </div>
            ) : null
          )}
        </div>

      </div>
    </div>
  )
}
