export const runtime = 'edge'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import ScrollToTopButton from './ScrollToTopButton'
import FeedbackButtons from './FeedbackButtons'
import ThumbnailImage from './ThumbnailImage'
import SaveToggle from './SaveToggle'
import styles from './page.module.css'
import type { RecommendationCard } from '@/types'

function getScoreClass(score: number, styles: Record<string, string>): string {
  if (score >= 80) return styles.scoreHigh
  if (score >= 60) return styles.scoreMid
  return styles.scoreLow
}

interface ResultPageProps {
  params: Promise<{ id: string }>
}

export const metadata: Metadata = {
  title: '내 취향 게임 추천 결과 — Guildeline',
  description: '스팀 플레이 기록을 기반으로 찾아낸 맞춤 게임 추천 목록입니다.',
}

async function getPageData(id: string) {
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

  // rec 쿼리 즉시 시작
  const recPromise = supabase
    .from('recommendation_sets')
    .select('*')
    .eq('id', id)
    .single()

  // getSession(): 쿠키에서 JWT 파싱 — 네트워크 호출 없음, 즉시 resolve
  const { data: { session } } = await supabase.auth.getSession()

  // saved_games 쿼리 시작 — recPromise와 병렬 실행 (async-parallel §1.2)
  const savedPromise = session
    ? supabase.from('saved_games').select('appid').eq('user_id', session.user.id)
    : null

  const [{ data: rec, error }, savedResult] = await Promise.all([
    recPromise,
    savedPromise ?? Promise.resolve(null),
  ])

  if (error || !rec) return null

  const savedAppids = new Set<string>(
    (savedResult?.data ?? []).map((s: { appid: string }) => s.appid)
  )
  return { rec, savedAppids }
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { id } = await params
  const pageData = await getPageData(id)
  if (!pageData) notFound()

  const { rec: result, savedAppids } = pageData
  const { created_at, budget_krw, steam_id } = result
  const typedCards: RecommendationCard[] = Array.isArray(result.cards) ? (result.cards as RecommendationCard[]) : []
  const typedTags: string[] = Array.isArray(result.tags) ? (result.tags as string[]) : []
  const dateFormatted = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(created_at))

  return (
    <main id="main-content" className={styles.main}>
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

      <p className={styles.feedbackHint}>
        카드 오른쪽 버튼으로 피드백을 남기면 다음 추천이 더 정확해져요.
      </p>

      <ul className={styles.resultsContainer}>
        {typedCards.map((card, index) => (
          <li
            key={card.appid}
            className={styles.card}
            style={{ '--animation-order': index } as React.CSSProperties}
          >
            <div className={styles.thumbnailWrap}>
              <ThumbnailImage appid={card.appid} name={card.name} priority={index < 3} />
            </div>
            <div className={styles.cardBody}>
              <SaveToggle
                appid={String(card.appid)}
                name={card.name}
                reason={card.reason}
                price_krw={card.price_krw}
                metacritic_score={card.metacritic_score}
                initialSaved={savedAppids.has(String(card.appid))}
              />
              <h2 className={styles.cardName}>{card.name}</h2>
              <hr className={styles.cardDivider} />
              <div className={styles.meta}>
                {card.is_free ? (
                  <span className={`${styles.price} ${styles.free}`}>무료</span>
                ) : card.price_krw != null ? (
                  <span className={styles.price}>
                    ₩{new Intl.NumberFormat('ko-KR').format(card.price_krw)}
                  </span>
                ) : (
                  <span className={styles.priceUnknown}>가격 정보 없음</span>
                )}
                {card.metacritic_score != null && (
                  <span className={`${styles.score} ${getScoreClass(card.metacritic_score, styles)}`}>
                    <span className={styles.scoreLabelFull}>Metacritic Score</span>
                    <span className={styles.scoreLabelShort}>MC</span>
                    &nbsp;{card.metacritic_score}
                  </span>
                )}
              </div>
              <div className={styles.cardMiddle}>
                <p className={styles.reason}>{card.reason}</p>
                <div className={styles.cardTags}>
                  {(card.tag_snapshot ?? []).map((tag: string) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <a
                href={card.store_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.storeLink}
              >
                Steam에서 보기 →
              </a>
            </div>
            <FeedbackButtons
              appId={card.appid}
              gameName={card.name}
              steamId={steam_id as string | null}
            />
          </li>
        ))}
      </ul>

      <footer className={styles.footer}>
        <div className={styles.footerFeedbackBox}>
          <p className={styles.footerFeedbackTitle}>피드백이 추천을 바꿔요</p>
          <p className={styles.footerFeedbackDesc}>
            카드 오른쪽 <strong>+ / −</strong> 버튼으로 남긴 피드백은
            계정 가중치에 반영되어 다음 추천을 더 정확하게 만들어요.
          </p>
        </div>
        <ScrollToTopButton />
      </footer>
    </main>
  )
}
