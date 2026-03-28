import styles from './PageLoading.module.css'

export default function PageLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <p className={styles.wordmark} aria-hidden="true">
          <span className={styles.accent}>GUILD</span>ELINE
        </p>
        <div className={styles.radar} role="status" aria-label="페이지 로딩 중">
          <svg className={styles.radarSvg} viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="33" className={styles.radarRing} />
            <circle cx="36" cy="36" r="18" className={styles.radarRingInner} />
            <line x1="3" y1="36" x2="69" y2="36" className={styles.radarCross} />
            <line x1="36" y1="3" x2="36" y2="69" className={styles.radarCross} />
            <circle cx="36" cy="36" r="2" className={styles.radarDot} />
          </svg>
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressFill} />
        </div>
      </div>
    </div>
  )
}
