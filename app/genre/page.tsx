import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import type { Metadata } from 'next'
import Breadcrumb from '@/app/components/Breadcrumb'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: '장르별 탐색 — Guildeline',
  description: 'Guildeline에서 게임 장르를 탐색하고 내 취향에 맞는 게임을 찾아보세요.',
  alternates: { canonical: '/genre' },
}

function toSlug(genre: string): string {
  return genre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

async function getGenres(): Promise<{ name: string; slug: string }[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('games_cache')
    .select('genres')
    .not('genres', 'is', null)
    .limit(5000)

  if (!data) return []

  // Deduplicate: slug → first-seen name
  const seen = new Map<string, string>()
  for (const row of data) {
    if (Array.isArray(row.genres)) {
      for (const g of row.genres as unknown[]) {
        if (typeof g === 'string' && g.trim()) {
          const slug = toSlug(g.trim())
          if (slug && !seen.has(slug)) seen.set(slug, g.trim())
        }
      }
    }
  }

  return Array.from(seen.entries())
    .map(([slug, name]) => ({ name, slug }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export default async function GenrePage() {
  const genres = await getGenres()

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <Breadcrumb items={[{ label: '홈', href: '/' }, { label: '장르별 탐색' }]} />
        <h1 className={styles.title}>장르별 탐색</h1>
        <p className={styles.desc}>관심 있는 장르를 선택해 게임을 탐색해 보세요.</p>
        {genres.length === 0 ? (
          <p className={styles.empty}>장르 데이터를 불러오는 중입니다.</p>
        ) : (
          <ul className={styles.grid} aria-label="게임 장르 목록">
            {genres.map(({ name, slug }) => (
              <li key={slug}>
                <Link href={`/genre/${slug}`} className={styles.genreCard}>
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
