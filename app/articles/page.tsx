import Link from 'next/link'
import type { Metadata } from 'next'
import Breadcrumb from '@/app/components/Breadcrumb'
import AdUnit from '@/app/components/AdUnit'
import JsonLd from '@/app/components/JsonLd'
import { allArticles } from '@/lib/articles'
import styles from './page.module.css'

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://guildeline.com'

export const metadata: Metadata = {
  title: '게임 추천 아티클 | Guildeline',
  description:
    '장르별 게임 추천, 스팀 공략, 취향 분석 가이드 — Guildeline 아티클에서 내 다음 게임을 찾아보세요.',
  alternates: { canonical: '/articles' },
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(iso))
}

const articlesJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Blog',
      name: 'Guildeline 게임 추천 아티클',
      description: '장르별 게임 추천, 스팀 공략, 취향 분석 가이드',
      url: `${baseUrl}/articles`,
      publisher: { '@type': 'Organization', name: 'Guildeline', url: baseUrl },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: baseUrl },
        { '@type': 'ListItem', position: 2, name: '아티클' },
      ],
    },
  ],
}

export default function ArticlesPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <JsonLd data={articlesJsonLd} />
        <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '아티클' }]} />
        <h1 className={styles.title}>게임 추천 아티클</h1>
        <p className={styles.desc}>
          장르별 추천, 스팀 공략, 취향 분석 — 다음 게임을 고르는 데 도움이 되는 글들입니다.
        </p>
        <ul className={styles.articleList} aria-label="아티클 목록">
          {allArticles.map(article => (
            <li key={article.slug}>
              <Link href={`/articles/${article.slug}`} className={styles.articleCard}>
                <span className={styles.cardMeta}>
                  <time dateTime={article.date}>{formatDate(article.date)}</time>
                  {article.tags.slice(0, 3).map(tag => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </span>
                <span className={styles.articleTitle}>{article.title}</span>
                <span className={styles.articleDesc}>{article.description}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Ad — below article list */}
        <AdUnit slot="0000000000" format="auto" minHeight={90} className={styles.adUnit} />
      </div>
    </main>
  )
}
