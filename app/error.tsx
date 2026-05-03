'use client'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main id="main-content" style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-primary)' }}>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: '1rem' }}>
        오류
      </p>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        문제가 발생했어요
      </h1>
      <button
        type="button"
        onClick={reset}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--accent-low)',
          color: 'var(--accent)',
          padding: '0.5rem 1.5rem',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-sans)',
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        다시 시도
      </button>
    </main>
  )
}
