'use client'

import styles from './page.module.css'

export default function ScrollToTopButton() {
  return (
    <button
      className={styles.scrollToTop}
      onClick={() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
      }}
    >
      맨 위로 올라가기
    </button>
  )
}
