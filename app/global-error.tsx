'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, background: '#09090b', fontFamily: 'system-ui, sans-serif' }}>
        <main
          id="main-content"
          style={{ textAlign: 'center', padding: '6rem 2rem', color: '#F5F5F0' }}
        >
          <p style={{ fontSize: '0.85rem', color: '#71717A', letterSpacing: '0.08em', marginBottom: '1rem' }}>
            오류
          </p>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            문제가 발생했어요
          </h1>
          <button
            type="button"
            onClick={reset}
            style={{
              background: '#1A1A1A',
              border: '1px solid rgba(197, 241, 53, 0.3)',
              color: '#C5F135',
              padding: '0.5rem 1.5rem',
              borderRadius: '6px',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </main>
      </body>
    </html>
  )
}
