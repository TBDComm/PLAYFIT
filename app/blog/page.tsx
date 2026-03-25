import Link from 'next/link'
import type { Metadata } from 'next'
import Breadcrumb from '@/app/components/Breadcrumb'
import AdUnit from '@/app/components/AdUnit'
import JsonLd from '@/app/components/JsonLd'
import { allPosts } from '@/lib/blog'
import styles from './page.module.css'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://guildeline.com'

export const metadata: Metadata = {
  title: 'Steam 게임 추천 블로그 | Guildeline',
  description:
    '스팀 게임 추천, 취향 분석, 장르 가이드 — Guildeline 블로그에서 게임 선택에 도움이 되는 글을 읽어보세요.',
  alternates: { canonical: '/blog' },
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso))
}

const blogJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Guildeline 블로그',
  description: '스팀 게임 추천, 취향 분석, 장르 가이드',
  url: `${baseUrl}/blog`,
  publisher: { '@type': 'Organization', name: 'Guildeline', url: baseUrl },
}

export default function BlogPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <JsonLd data={blogJsonLd} />
        <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '블로그' }]} />
        <h1 className={styles.title}>블로그</h1>
        <p className={styles.desc}>
          게임 취향 분석, 추천 가이드, 장르별 탐색 — Guildeline이 직접 씁니다.
        </p>
        <ul className={styles.postList} aria-label="블로그 포스트 목록">
          {allPosts.map(post => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className={styles.postCard}>
                <span className={styles.cardMeta}>
                  <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                  {post.tags.slice(0, 3).map(tag => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </span>
                <span className={styles.postTitle}>{post.title}</span>
                <span className={styles.postDesc}>{post.description}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Ad — below post list fold */}
        <AdUnit slot="0000000000" format="auto" minHeight={90} className={styles.adUnit} />
      </div>
    </main>
  )
}
