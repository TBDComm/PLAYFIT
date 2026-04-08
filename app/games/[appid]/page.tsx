import { cache } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import type { Metadata } from 'next'
import Breadcrumb from '@/app/components/Breadcrumb'
import AdUnit from '@/app/components/AdUnit'
import JsonLd from '@/app/components/JsonLd'
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

function createSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// ── Steam CDN ────────────────────────────────────────────────────────────────

function steamHero(appid: string) {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_hero.jpg`
}
function steamPortrait(appid: string) {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/library_600x900.jpg`
}
function steamHeader(appid: string) {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${appid}/header.jpg`
}

// ── Types ────────────────────────────────────────────────────────────────────

interface GameRow {
  appid: string
  name: string
  tags: Record<string, number> | null
  genres: string[] | null
}

interface SimilarGame {
  appid: string
  name: string
  tags: Record<string, number> | null
  score: number
}

// ── Data fetching (React.cache deduplicates between generateMetadata + page) ─

const getGame = cache(async (appid: string): Promise<GameRow | null> => {
  const supabase = createSupabase()
  const { data } = await supabase
    .from('games_cache')
    .select('appid, name, tags, genres')
    .eq('appid', appid)
    .single()
  return data as GameRow | null
})

async function getSimilarGames(
  appid: string,
  tags: Record<string, number>
): Promise<SimilarGame[]> {
  const maxVal = Math.max(...Object.values(tags))
  if (maxVal <= 0) return []

  const tagProfile: Record<string, number> = {}
  for (const [tag, val] of Object.entries(tags)) {
    tagProfile[tag] = val / maxVal
  }

  const supabase = createSupabase()
  const { data } = await supabase.rpc('score_candidates', {
    p_tag_profile: tagProfile,
    p_user_tag_weights: {},
    p_owned_appids: [appid],
    p_limit: 10,
  })
  return (data as SimilarGame[]) ?? []
}

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ appid: string }>
}): Promise<Metadata> {
  const { appid } = await params
  const game = await getGame(appid)

  if (!game) {
    return { title: '게임을 찾을 수 없습니다 | Guildeline', robots: { index: false } }
  }

  const hasTags = game.tags && Object.keys(game.tags).length > 0
  const headerUrl = steamHeader(appid)

  const topTags = hasTags ? getTopTags(game.tags!, 3) : []
  const tagPart = topTags.length > 0 ? ` ${topTags.join(', ')} 태그 기반으로 TOP 10을 선정했습니다.` : ''

  return {
    title: `${game.name} 비슷한 게임 추천 | Guildeline`,
    description: `${game.name}과 비슷한 게임 추천.${tagPart} Guildeline에서 취향 맞는 게임을 찾아보세요.`,
    alternates: { canonical: `/games/${appid}` },
    openGraph: { images: [{ url: headerUrl, width: 460, height: 215 }] },
    ...(!hasTags ? { robots: { index: false } } : {}),
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function GamePage({
  params,
}: {
  params: Promise<{ appid: string }>
}) {
  const { appid } = await params
  const game = await getGame(appid)

  // 404 fallback
  if (!game) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.notFound}>게임을 찾을 수 없습니다.</p>
          <Link href="/" className={styles.ctaLink}>← 홈으로</Link>
        </div>
      </main>
    )
  }

  const hasTags = game.tags && Object.keys(game.tags).length > 0

  // Thin content guard — noindex rendered without data
  if (!hasTags) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <Breadcrumb
            items={[{ label: '홈', href: '/' }, { label: '게임', href: '/genre' }, { label: game.name }]}
          />
          <h1 className={styles.title}>{game.name}</h1>
          <p className={styles.emptyMsg}>이 게임은 아직 태그 데이터가 없어 추천을 제공하기 어렵습니다.</p>
          <Link href="/" className={styles.ctaLink}>내 플레이 기록으로 추천받기 →</Link>
        </div>
      </main>
    )
  }

  const tags = game.tags!
  const topTags = getTopTags(tags, 10)
  const similarGames = await getSimilarGames(appid, tags)
  const storeUrl = `https://store.steampowered.com/app/${appid}`
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://guildeline.com'
  const dateModified = new Date().toISOString()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'VideoGame',
        name: game.name,
        applicationCategory: 'Game',
        url: storeUrl,
        image: steamHeader(appid),
        dateModified,
        ...(game.genres?.length ? { genre: game.genres } : {}),
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `${game.name}과 비슷한 게임은?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: similarGames.length > 0
                ? `${game.name}과 태그가 유사한 게임으로 ${similarGames.slice(0, 3).map(g => g.name).join(', ')}을 추천합니다. Guildeline에서 태그 기반으로 선정한 TOP 10 목록을 확인하세요.`
                : `${game.name}의 태그 데이터를 분석해 비슷한 게임을 찾아보세요.`,
            },
          },
          {
            '@type': 'Question',
            name: `${game.name}은 어떤 태그를 가지고 있나요?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${game.name}의 주요 태그는 ${topTags.slice(0, 5).join(', ')}입니다.`,
            },
          },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '홈', item: baseUrl },
          { '@type': 'ListItem', position: 2, name: '게임', item: `${baseUrl}/genre` },
          { '@type': 'ListItem', position: 3, name: game.name },
        ],
      },
    ],
  }

  return (
    <main className={styles.page}>
      <JsonLd data={jsonLd} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className={styles.hero}>
        {/* Blurred background art */}
        <div className={styles.heroBgWrap} aria-hidden="true">
          <img
            src={steamHero(appid)}
            alt=""
            className={styles.heroBg}
          />
        </div>

        <div className={styles.heroInner}>
          <Breadcrumb
            items={[
              { label: '홈', href: '/' },
              { label: '게임', href: '/genre' },
              { label: game.name },
            ]}
          />

          <div className={styles.heroLayout}>
            {/* Portrait cover card */}
            <div className={styles.heroCoverWrap}>
              <img
                src={steamPortrait(appid)}
                alt={`${game.name} cover`}
                className={styles.heroCover}
                width={180}
                height={270}
              />
            </div>

            {/* Game info */}
            <div className={styles.heroInfo}>
              <h1 className={styles.heroTitle}>{game.name} — 비슷한 게임 추천</h1>

              {game.genres && game.genres.length > 0 && (
                <div className={styles.genreRow} aria-label="장르">
                  {game.genres.map((g) => (
                    <Link key={g} href={`/genre/${toSlug(g)}`} className={styles.genreChip}>
                      {g}
                    </Link>
                  ))}
                </div>
              )}

              <div className={styles.heroTagRow} aria-label="태그">
                {topTags.slice(0, 5).map((tag) => (
                  <span key={tag} className={styles.heroTag}>{tag}</span>
                ))}
              </div>

              <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.steamBtn}
              >
                Steam에서 보기 →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className={styles.inner}>

        {/* Tags */}
        <section className={styles.section} aria-labelledby="tags-heading">
          <h2 id="tags-heading" className={styles.sectionTitle}>태그</h2>
          <ul className={styles.tagList}>
            {topTags.map((tag) => (
              <li key={tag} className={styles.tagChip}>{tag}</li>
            ))}
          </ul>
        </section>

        {/* Similar games */}
        <section className={styles.section} aria-labelledby="similar-heading">
          <h2 id="similar-heading" className={styles.sectionTitle}>이 게임과 비슷한 게임 TOP 10</h2>
          {similarGames.length === 0 ? (
            <p className={styles.emptyMsg}>비슷한 게임을 찾지 못했습니다.</p>
          ) : (
            <ul className={styles.gameGrid}>
              {similarGames.map((sg) => {
                const sgTopTags = sg.tags ? getTopTags(sg.tags, 3) : []
                return (
                  <li key={sg.appid}>
                    <Link href={`/games/${sg.appid}`} className={styles.gameCard}>
                      <div className={styles.gameCardImg}>
                        <img
                          src={steamHeader(sg.appid)}
                          alt={sg.name}
                          className={styles.gameThumb}
                          width={460}
                          height={215}
                          loading="lazy"
                        />
                      </div>
                      <div className={styles.gameCardBody}>
                        <span className={styles.gameName}>{sg.name}</span>
                        {sgTopTags.length > 0 && (
                          <span className={styles.gameTags}>{sgTopTags.join(' · ')}</span>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* FAQ block — AI SEO (C12) */}
        {similarGames.length > 0 && (
          <section className={styles.faqSection} aria-labelledby="faq-heading">
            <h2 id="faq-heading" className={styles.sectionTitle}>자주 묻는 질문</h2>
            <dl className={styles.faqList}>
              <div className={styles.faqItem}>
                <dt className={styles.faqQ}>{game.name}과 비슷한 게임은?</dt>
                <dd className={styles.faqA}>
                  태그 기반으로 {similarGames.slice(0, 3).map(g => g.name).join(', ')}을 추천합니다. 아래 목록에서 더 많은 추천을 확인하세요.
                </dd>
              </div>
              <div className={styles.faqItem}>
                <dt className={styles.faqQ}>{game.name}은 어떤 태그를 가지고 있나요?</dt>
                <dd className={styles.faqA}>
                  {game.name}의 주요 태그는 {topTags.slice(0, 5).join(', ')}입니다.
                </dd>
              </div>
            </dl>
          </section>
        )}

        {/* Ad — after similar games list */}
        <AdUnit slot="0000000000" format="auto" minHeight={250} className={styles.adUnit} />

        {/* CTA */}
        <div className={styles.ctaSection}>
          <Link href="/" className={styles.ctaLink}>
            내 플레이 기록으로 추천받기 →
          </Link>
        </div>
      </div>
    </main>
  )
}
