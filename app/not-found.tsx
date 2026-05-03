import Link from 'next/link'

export default function NotFound() {
  return (
    <main id="main-content" style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-primary)' }}>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', letterSpacing: '0.08em', marginBottom: '1rem' }}>
        404
      </p>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        페이지를 찾을 수 없어요
      </h1>
      <Link
        href="/"
        style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: '0.95rem' }}
      >
        홈으로 →
      </Link>
    </main>
  )
}
