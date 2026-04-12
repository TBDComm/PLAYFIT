import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/app/components/Breadcrumb'
import AdUnit from '@/app/components/AdUnit'
import JsonLd from '@/app/components/JsonLd'
import { getArticle, getAllArticleSlugs } from '@/lib/articles'
import styles from './page.module.css'

// ── Static params ─────────────────────────────────────────────────────────────

export function generateStaticParams() {
  return getAllArticleSlugs().map(slug => ({ slug }))
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = getArticle(slug)

  if (!entry) {
    return { title: '아티클을 찾을 수 없습니다 | Guildeline', robots: { index: false } }
  }

  const { meta } = entry
  return {
    title: `${meta.title} | Guildeline`,
    description: meta.description,
    alternates: { canonical: `/articles/${slug}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'article',
      publishedTime: meta.date,
    },
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const entry = getArticle(slug)

  if (!entry) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.notFound}>아티클을 찾을 수 없습니다.</p>
          <Link href="/articles" className={styles.backLink}>← 아티클 목록으로</Link>
        </div>
      </main>
    )
  }

  const { meta, Content } = entry
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://guildeline.com'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: meta.title,
        description: meta.description,
        datePublished: meta.date,
        dateModified: meta.date,
        author: { '@type': 'Person', name: 'Guildeline 에디터' },
        image: { '@type': 'ImageObject', url: `${baseUrl}/opengraph-image` },
        publisher: { '@type': 'Organization', name: 'Guildeline', url: baseUrl },
        url: `${baseUrl}/articles/${slug}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: '아티클', item: `${baseUrl}/articles` },
          { '@type': 'ListItem', position: 3, name: meta.title },
        ],
      },
    ],
  }

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <JsonLd data={jsonLd} />

        <Breadcrumb
          items={[
            { label: '홈', href: '/' },
            { label: '아티클', href: '/articles' },
            { label: meta.title },
          ]}
        />

        <header className={styles.postHeader}>
          <div className={styles.headerMeta}>
            <time dateTime={meta.date} className={styles.date}>
              {formatDate(meta.date)}
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

        {/* Ad — end of article, before footer */}
        <AdUnit slot="0000000000" format="auto" minHeight={250} className={styles.adUnit} />

        <div className={styles.footer}>
          <Link href="/articles" className={styles.backLink}>← 아티클 목록으로</Link>
          <Link href="/" className={styles.ctaLink}>내 취향 게임 찾기 →</Link>
        </div>
      </div>
    </main>
  )
}
