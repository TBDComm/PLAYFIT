import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import type { Metadata } from 'next'
import Breadcrumb from '@/app/components/Breadcrumb'
import AdUnit from '@/app/components/AdUnit'
import styles from './page.module.css'

export const runtime = 'edge'
export const dynamicParams = true
export const revalidate = 86400

// ── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(genre: string): string {
  return genre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function getTopTags(tags: Record<string, number>, n: number): string[] {
  return Object.entries(tags)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([tag]) => tag)
}

function tagSum(tags: Record<string, number> | null): number {
  if (!tags) return 0
  return Object.values(tags).reduce((s, v) => s + v, 0)
}

function createSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── Types ────────────────────────────────────────────────────────────────────

interface GameRow {
  appid: string
  name: string
  tags: Record<string, number> | null
  genres: string[] | null
}

interface GenreData {
  genreName: string
  games: GameRow[]
}

// ── Data fetching (React.cache deduplicates between generateMetadata + page) ─

const getGenreData = cache(async (slug: string): Promise<GenreData | null> => {
  const supabase = createSupabase()
  const { data } = await supabase
    .from('games_cache')
    .select('appid, name, tags, genres')
    .not('genres', 'is', null)
    .limit(5000)

  if (!data) return null

  // Find the canonical genre name that matches this slug
  let genreName: string | null = null
  for (const row of data) {
    if (Array.isArray(row.genres)) {
      for (const g of row.genres as unknown[]) {
        if (typeof g === 'string' && toSlug(g.trim()) === slug) {
          genreName = g.trim()
          break
        }
      }
    }
    if (genreName) break
  }

  if (!genreName) return null

  const name = genreName
  const games = (data as GameRow[])
    .filter(row => Array.isArray(row.genres) && row.genres.includes(name))
    .sort((a, b) => tagSum(b.tags) - tagSum(a.tags))
    .slice(0, 20)

  return { genreName: name, games }
})

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getGenreData(slug)

  if (!data) {
    return { title: '장르를 찾을 수 없습니다 | Guildeline', robots: { index: false } }
  }

  return {
    title: `최고의 ${data.genreName} 게임 20선 | Guildeline`,
    description: `Guildeline이 추천하는 최고의 ${data.genreName} 게임 20선. 내 플레이 기록 기반으로 딱 맞는 게임을 찾아보세요.`,
    alternates: { canonical: `/genre/${slug}` },
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function GenreSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getGenreData(slug)

  if (!data) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.notFound}>장르를 찾을 수 없습니다.</p>
          <Link href="/genre" className={styles.ctaLink}>← 장르 목록으로</Link>
        </div>
      </main>
    )
  }

  const { genreName, games } = data

  // Safe JSON-LD: replace </ to prevent script injection
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://playfit.app'
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `최고의 ${genreName} 게임 20선`,
    itemListElement: games.map((game, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: game.name,
      url: `${baseUrl}/games/${game.appid}`,
    })),
  }).replace(/<\//g, '<\\/')

  return (
    <main className={styles.page}>
      <div className={styles.inner}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

        <Breadcrumb
          items={[
            { label: '홈', href: '/' },
            { label: '장르', href: '/genre' },
            { label: genreName },
          ]}
        />

        <h1 className={styles.title}>최고의 {genreName} 게임 추천</h1>

        {games.length === 0 ? (
          <p className={styles.emptyMsg}>이 장르에 해당하는 게임 데이터가 없습니다.</p>
        ) : (
          <>
            <ol className={styles.gameGrid} aria-label={`${genreName} 게임 목록`}>
              {games.slice(0, 10).map((game, i) => {
                const topTags = game.tags ? getTopTags(game.tags, 3) : []
                return (
                  <li key={game.appid}>
                    <Link href={`/games/${game.appid}`} className={styles.gameCard}>
                      <span className={styles.rank}>{i + 1}</span>
                      <span className={styles.cardBody}>
                        <span className={styles.gameName}>{game.name}</span>
                        {topTags.length > 0 && (
                          <span className={styles.gameTags}>{topTags.join(' · ')}</span>
                        )}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>

            {/* Ad — between game list rows, after item 10 */}
            {games.length > 10 && (
              <AdUnit slot="0000000000" format="auto" minHeight={90} className={styles.adUnit} />
            )}

            {games.length > 10 && (
              <ol className={styles.gameGrid} start={11} aria-label={`${genreName} 게임 목록 (계속)`}>
                {games.slice(10).map((game, i) => {
                  const topTags = game.tags ? getTopTags(game.tags, 3) : []
                  return (
                    <li key={game.appid}>
                      <Link href={`/games/${game.appid}`} className={styles.gameCard}>
                        <span className={styles.rank}>{i + 11}</span>
                        <span className={styles.cardBody}>
                          <span className={styles.gameName}>{game.name}</span>
                          {topTags.length > 0 && (
                            <span className={styles.gameTags}>{topTags.join(' · ')}</span>
                          )}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ol>
            )}
          </>
        )}

        {/* Community placeholder — D-series hook */}
        <section className={styles.communitySection} aria-labelledby="community-heading">
          <h2 id="community-heading" className={styles.sectionTitle}>
            {genreName} 게임을 좋아하는 유저들
          </h2>
          <p className={styles.communityPlaceholder}>
            커뮤니티 기능은 곧 출시됩니다. 비슷한 취향을 가진 유저들과 함께할 수 있어요.
          </p>
        </section>

        {/* CTA */}
        <div className={styles.ctaSection}>
          <Link href="/" className={styles.ctaLink}>
            내 취향에 맞는 {genreName} 게임 찾기 →
          </Link>
        </div>
      </div>
    </main>
  )
}
