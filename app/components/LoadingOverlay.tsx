'use client'

import { useEffect, useState } from 'react'
import styles from './LoadingOverlay.module.css'

const LINES = [
  '플레이 기록 분석 중...',
  '취향 태그 가중치 계산 중...',
  '82,816개 게임에서 매칭 중...',
] as const

interface Props {
  message: string
}

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

        {/* Radar sweep */}
        <div className={styles.radar} aria-hidden="true">
          <svg className={styles.radarSvg} viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="33" className={styles.radarRing} />
            <circle cx="36" cy="36" r="18" className={styles.radarRingInner} />
            <line x1="3" y1="36" x2="69" y2="36" className={styles.radarCross} />
            <line x1="36" y1="3" x2="36" y2="69" className={styles.radarCross} />
            <circle cx="36" cy="36" r="2" className={styles.radarDot} />
          </svg>
          <div className={styles.radarTrail} />
          <div className={styles.radarLine} />
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
