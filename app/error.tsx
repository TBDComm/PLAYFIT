'use client'

import styles from './error.module.css'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main id="main-content" className={styles.main}>
      <p className={styles.label}>오류</p>
      <h1 className={styles.title}>문제가 발생했어요</h1>
      <button type="button" onClick={reset} className={styles.button}>
        다시 시도
      </button>
    </main>
  )
}
