export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getSquadSession, getPublicProfileLite } from '@/lib/supabase'
import { getPlayerSummaries } from '@/lib/steam'

// React cache() — generateMetadata + page 간 DB 중복 조회 방지
const loadSquadSession = cache((token: string) => getSquadSession(token))
import ThumbnailImage from '@/app/result/[id]/ThumbnailImage'
import CopyUrlButton from './CopyUrlButton'
import resultStyles from '@/app/result/[id]/page.module.css'
import styles from './page.module.css'
import type { SquadRecommendationCard } from '@/types'

interface Props {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const session = await loadSquadSession(token)
  if (!session) {
    return { title: 'Squad를 찾을 수 없어요 — Guildeline' }
  }
  return {
    title: `스쿼드 평균 ${session.avg_match_score}% 일치 — Guildeline`,
    description: `${session.member_count}명의 취향 분석 결과. 공통 태그: ${session.top_shared_tags.slice(0, 3).join(', ')}`,
  }
}

function getScoreClass(score: number): string {
  if (score >= 80) return resultStyles.scoreHigh
  if (score >= 60) return resultStyles.scoreMid
  return resultStyles.scoreLow
}

export default async function SquadTokenPage({ params }: Props) {
  const { token } = await params
  const session = await loadSquadSession(token)
  if (!session) notFound()

  // 멤버 이름 + host 프로필 병렬 조회
  const [nameMap, hostProfile] = await Promise.all([
    getPlayerSummaries(session.member_steam_ids),
    session.host_user_id ? getPublicProfileLite(session.host_user_id) : Promise.resolve(null),
  ])

  const cards: SquadRecommendationCard[] = Array.isArray(session.result_cards)
    ? (session.result_cards as SquadRecommendationCard[])
    : []

  const dateFormatted = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date(session.created_at))

  return (
    <main className={resultStyles.main}>
      {/* Header */}
      <header className={resultStyles.header}>
        <Link href="/" className={resultStyles.backLink}>
          ← 홈으로
        </Link>
        <div className={styles.headerRight}>
          <time className={resultStyles.headerDate} dateTime={session.created_at}>
            {dateFormatted}
          </time>
          <CopyUrlButton />
        </div>
      </header>

      {/* Summary */}
      <section className={resultStyles.summarySection}>
        <div className={styles.scoreHero}>
          <p className={styles.scoreHeroNumber} aria-label={`평균 취향 일치율 ${session.avg_match_score}퍼센트`}>
            {session.avg_match_score}%
          </p>
          <h1 className={styles.scoreHeroLabel}>평균 취향 일치율</h1>
        </div>

        <p className={resultStyles.heroSubtitle}>
          {session.member_count}명 스쿼드
          {session.budget_krw ? ` · ${new Intl.NumberFormat('ko-KR').format(session.budget_krw)}원 이하` : ''}
          {session.free_only ? ' · 무료 게임만' : ''}
        </p>

        {hostProfile && session.host_user_id && (
          <p className={styles.hostLine}>
            <Link href={`/users/${session.host_user_id}`} className={styles.hostLink}>
              {hostProfile.display_name?.trim() || '익명 게이머'}님의 취향 보기 →
            </Link>
          </p>
        )}

        {/* 멤버별 매치 스코어 pill */}
        <div className={styles.memberScores} aria-label="멤버별 취향 일치율">
          {Object.entries(session.match_scores).map(([steamId, score]) => {
            const name = nameMap.get(steamId) ?? `#${steamId.slice(-4)}`
            return (
              <span
                key={steamId}
                className={`${styles.memberPill} ${getScoreClass(score as number)}`}
                title={steamId}
              >
                {name} · {score as number}%
              </span>
            )
          })}
        </div>

        {/* 공통 태그 */}
        <div className={styles.tagSection}>
          <p className={styles.tagSectionTitle}>모두가 좋아하는 태그</p>
          <div>
            {session.top_shared_tags.map(tag => (
              <span key={tag} className={resultStyles.tagPill}>{tag}</span>
            ))}
          </div>
        </div>

        {/* 취향 갈림 태그 */}
        {session.conflict_tags.length > 0 && (
          <div className={styles.tagSection}>
            <p className={styles.tagSectionTitle}>취향이 갈리는 태그</p>
            <div>
              {session.conflict_tags.map(tag => (
                <span key={tag} className={`${resultStyles.tagPill} ${styles.conflictPill}`}>{tag}</span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 추천 카드 목록 */}
      <ul className={resultStyles.resultsContainer}>
        {cards.map((card, index) => (
          <li
            key={card.appid}
            className={resultStyles.card}
            style={{ '--animation-order': index } as React.CSSProperties}
          >
            <div className={resultStyles.thumbnailWrap}>
              <ThumbnailImage appid={card.appid} name={card.name} priority={index < 3} />
            </div>
            <div className={resultStyles.cardBody}>
              <h2 className={resultStyles.cardName}>{card.name}</h2>
              <hr className={resultStyles.cardDivider} />
              <div className={resultStyles.meta}>
                {card.is_free ? (
                  <span className={`${resultStyles.price} ${resultStyles.free}`}>무료</span>
                ) : card.price_krw != null ? (
                  <span className={resultStyles.price}>
                    ₩{new Intl.NumberFormat('ko-KR').format(card.price_krw)}
                  </span>
                ) : (
                  <a
                    href={card.store_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={resultStyles.priceUnknown}
                  >
                    가격 정보 없음
                  </a>
                )}
                {card.metacritic_score != null && (
                  <span className={`${resultStyles.score} ${getScoreClass(card.metacritic_score)}`}>
                    <span className={resultStyles.scoreLabelFull}>Metacritic Score</span>
                    <span className={resultStyles.scoreLabelShort}>MC</span>
                    &nbsp;{card.metacritic_score}
                  </span>
                )}
              </div>
              <div className={resultStyles.cardMiddle}>
                <p className={resultStyles.reason}>{card.reason}</p>
                <div className={resultStyles.cardTags}>
                  {(card.tag_snapshot ?? []).map((tag: string) => (
                    <span key={tag} className={resultStyles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <a
                href={card.store_url}
                target="_blank"
                rel="noopener noreferrer"
                className={resultStyles.storeLink}
              >
                Steam에서 보기 →
              </a>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer — 바이럴 CTA */}
      <footer className={styles.squadFooter}>
        <Link href="/squad" className={styles.ctaLink}>
          나도 내 스쿼드 만들기 →
        </Link>
      </footer>
    </main>
  )
}
