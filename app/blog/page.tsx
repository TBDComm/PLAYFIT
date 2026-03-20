import Link from 'next/link'
import type { Metadata } from 'next'
import Breadcrumb from '@/app/components/Breadcrumb'
import { allPosts } from '@/lib/blog'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: '블로그 — PlayFit',
  description:
    '스팀 게임 추천, 취향 분석, 장르 가이드 — PlayFit 블로그에서 게임 선택에 도움이 되는 글을 읽어보세요.',
  alternates: { canonical: '/blog' },
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function BlogPage() {
  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '블로그' }]} />
        <h1 className={styles.title}>블로그</h1>
        <p className={styles.desc}>
          게임 취향 분석, 추천 가이드, 장르별 탐색 — PlayFit이 직접 씁니다.
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
      </div>
    </main>
  )
}
