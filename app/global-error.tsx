'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ko">
      <head>
        <style>{`
          .ge-main { text-align: center; padding: 6rem 2rem; color: #F5F5F0; }
          .ge-label { font-size: 0.85rem; color: #71717A; letter-spacing: 0.08em; margin-bottom: 1rem; }
          .ge-title { font-size: 2rem; font-weight: 700; margin-bottom: 1.5rem; }
          .ge-btn {
            background: #1A1A1A; border: 1px solid rgba(197, 241, 53, 0.3);
            color: #C5F135; padding: 0.5rem 1.5rem; border-radius: 6px;
            font-family: system-ui, sans-serif; font-size: 0.9rem; font-weight: 600;
            cursor: pointer; transition: background 0.15s, border-color 0.15s;
            touch-action: manipulation;
          }
          .ge-btn:hover { background: #2A2A2A; border-color: #C5F135; }
          .ge-btn:focus-visible { outline: 2px solid #C5F135; outline-offset: 3px; }
        `}</style>
      </head>
      <body style={{ margin: 0, background: '#09090b', fontFamily: 'system-ui, sans-serif' }}>
        <main id="main-content" className="ge-main">
          <p className="ge-label">오류</p>
          <h1 className="ge-title">문제가 발생했어요</h1>
          <button type="button" onClick={reset} className="ge-btn">
            다시 시도
          </button>
        </main>
      </body>
    </html>
  )
}
