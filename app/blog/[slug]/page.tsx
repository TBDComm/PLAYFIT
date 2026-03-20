import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/app/components/Breadcrumb'
import { getPost } from '@/lib/blog'
import styles from './page.module.css'

export const runtime = 'edge'

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = getPost(slug)

  if (!entry) {
    return { title: '포스트를 찾을 수 없습니다 | PlayFit', robots: { index: false } }
  }

  const { meta } = entry
  return {
    title: `${meta.title} | PlayFit 블로그`,
    description: meta.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'article',
      publishedTime: meta.publishedAt,
    },
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = getPost(slug)

  if (!entry) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.notFound}>포스트를 찾을 수 없습니다.</p>
          <Link href="/blog" className={styles.backLink}>← 블로그 목록으로</Link>
        </div>
      </main>
    )
  }

  const { meta, Content } = entry
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://playfit.app'

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: meta.title,
    description: meta.description,
    datePublished: meta.publishedAt,
    author: { '@type': 'Organization', name: 'PlayFit' },
    url: `${baseUrl}/blog/${slug}`,
  }).replace(/<\//g, '<\\/')

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

        <Breadcrumb
          items={[
            { label: '홈', href: '/' },
            { label: '블로그', href: '/blog' },
            { label: meta.title },
          ]}
        />

        <header className={styles.postHeader}>
          <div className={styles.headerMeta}>
            <time dateTime={meta.publishedAt} className={styles.date}>
              {formatDate(meta.publishedAt)}
            </time>
            {meta.tags.map(tag => (
              <span key={tag} className={styles.tag}>{tag}</span>
            ))}
          </div>
          <h1 className={styles.title}>{meta.title}</h1>
          <p className={styles.description}>{meta.description}</p>
        </header>

        <article className={styles.prose}>
          <Content />
        </article>

        <div className={styles.footer}>
          <Link href="/blog" className={styles.backLink}>← 블로그 목록으로</Link>
          <Link href="/" className={styles.ctaLink}>내 취향 게임 찾기 →</Link>
        </div>
      </div>
    </main>
  )
}
