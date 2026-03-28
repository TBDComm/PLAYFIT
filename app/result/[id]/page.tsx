export const runtime = 'edge'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import ScrollToTopButton from './ScrollToTopButton'
import FeedbackButtons from './FeedbackButtons'
import styles from './page.module.css'
import type { RecommendationCard } from '@/types'

interface ResultPageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: '내 취향 게임 추천 결과 — Guildeline',
  description: '스팀 플레이 기록을 기반으로 찾아낸 맞춤 게임 추천 목록입니다.',
}

async function getRecommendationSet(id: string) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )

  const { data, error } = await supabase
    .from('recommendation_sets')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params
  const result = await getRecommendationSet(id)
  if (!result) notFound()

  const { created_at, budget_krw, steam_id } = result
  const typedCards: RecommendationCard[] = Array.isArray(result.cards) ? (result.cards as RecommendationCard[]) : []
  const typedTags: string[] = Array.isArray(result.tags) ? (result.tags as string[]) : []
  const dateFormatted = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(created_at))

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>
          ← 다시 추천받기
        </Link>
        <time className={styles.headerDate} dateTime={created_at}>{dateFormatted}</time>
      </header>

      <section className={styles.summarySection}>
        <h1 className={styles.heroTitle}>
          취향에 맞는 게임을 찾았어요
        </h1>
        <p className={styles.heroSubtitle}>
          총 <strong>{typedCards.length}개</strong>의 게임을 추천받았어요.
          핵심 취향 태그:{' '}
          {typedTags.slice(0, 3).map((tag: string) => (
            <span key={tag} className={styles.tagPill}>{tag}</span>
          ))}
        </p>
        {budget_krw !== null && budget_krw > 0 && (
          <p className={styles.budgetNotice}>
            설정된 예산{' '}
            <strong>{new Intl.NumberFormat('ko-KR').format(budget_krw as number)}원</strong>에
            맞춰 추천되었어요.
          </p>
        )}
      </section>

      <div className={styles.resultsContainer}>
        {typedCards.map((card, index) => (
          <div
            key={card.appid}
            className={styles.card}
            style={{ '--animation-order': index } as React.CSSProperties}
          >
            <div className={styles.cardImageContainer}>
              <Image
                src={`https://cdn.akamai.steamstatic.com/steam/apps/${card.appid}/header.jpg`}
                alt={`${card.name} 게임 표지`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{ objectFit: 'cover' }}
                priority={index < 3}
                unoptimized
              />
              <div className={styles.cardImageOverlay} />
            </div>
            <div className={styles.cardContent}>
              <h2 className={styles.cardTitle}>{card.name}</h2>
              <div className={styles.cardMeta}>
                {card.is_free ? (
                  <span className={`${styles.price} ${styles.free}`}>무료</span>
                ) : (
                  <span className={styles.price}>
                    {card.price_krw != null
                      ? `₩${new Intl.NumberFormat('ko-KR').format(card.price_krw)}`
                      : '가격 정보 없음'}
                  </span>
                )}
                {card.metacritic_score != null && (
                  <span className={styles.metacritic}>{card.metacritic_score}</span>
                )}
              </div>
              <p className={styles.cardReason}>{card.reason}</p>
              <div className={styles.cardTags}>
                {(card.tag_snapshot ?? []).map((tag: string) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
              <div className={styles.cardActions}>
                <a
                  href={card.store_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.storeLink}
                >
                  스토어에서 보기
                </a>
                <FeedbackButtons
                  appId={card.appid}
                  gameName={card.name}
                  steamId={steam_id as string | null}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <footer className={styles.footer}>
        <p>추천 결과가 마음에 드시나요?</p>
        <p className={styles.footerNotice}>
          각 게임에 대한 <strong>좋아요/싫어요</strong> 피드백을 남겨주시면
          다음 추천이 더 정확해집니다.
        </p>
        <ScrollToTopButton />
      </footer>
    </main>
  )
}
