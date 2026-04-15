export const runtime = 'edge'
export const dynamic = 'force-dynamic'

import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { serviceSupabase } from '@/lib/supabase'
import resultStyles from '@/app/result/[id]/page.module.css'
import shareStyles from '@/app/squad/[token]/page.module.css'
import styles from './page.module.css'

interface Props {
  params: Promise<{ userId: string }>
}

interface ProfileRow {
  display_name: string | null
  bio: string | null
  is_public: boolean
}

interface TagRow {
  tag: string
  weight: number
}

interface SquadHistoryRow {
  share_token: string
  member_count: number
  avg_match_score: number
  top_shared_tags: string[]
  created_at: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// React cache() dedupes within a single request — generateMetadata + page won't double-fetch
const loadProfile = cache(async (userId: string) => {
  if (!UUID_RE.test(userId)) return null

  const nowIso = new Date().toISOString()

  const profilePromise = serviceSupabase
    .from('user_profiles')
    .select('display_name, bio, is_public')
    .eq('id', userId)
    .maybeSingle()

  const tagsPromise = serviceSupabase
    .from('user_tag_weights')
    .select('tag, weight')
    .eq('user_id', userId)
    .order('weight', { ascending: false })
    .limit(10)

  const savedCountPromise = serviceSupabase
    .from('saved_games')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  const squadHistoryPromise = serviceSupabase
    .from('squad_sessions')
    .select('share_token, member_count, avg_match_score, top_shared_tags, created_at')
    .eq('host_user_id', userId)
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: false })
    .limit(5)

  // count uses the same expires_at filter as history list — UI consistency
  const squadCountPromise = serviceSupabase
    .from('squad_sessions')
    .select('id', { count: 'exact', head: true })
    .eq('host_user_id', userId)
    .gt('expires_at', nowIso)

  const [profileRes, tagsRes, savedCountRes, squadHistoryRes, squadCountRes] = await Promise.all([
    profilePromise,
    tagsPromise,
    savedCountPromise,
    squadHistoryPromise,
    squadCountPromise,
  ])

  const profile = profileRes.data as ProfileRow | null
  if (!profile || !profile.is_public) return null

  return {
    profile,
    tags: (tagsRes.data ?? []) as TagRow[],
    savedCount: savedCountRes.count ?? 0,
    squadHistory: (squadHistoryRes.data ?? []) as SquadHistoryRow[],
    squadCount: squadCountRes.count ?? 0,
  }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params
  const data = await loadProfile(userId)
  if (!data) {
    return { title: '프로필을 찾을 수 없어요 — Guildeline', robots: { index: false, follow: false } }
  }
  const name = data.profile.display_name?.trim() || '익명 게이머'
  const topTagsLine = data.tags.slice(0, 3).map(t => t.tag).join(', ')
  return {
    title: `${name}의 게임 취향 — Guildeline`,
    description: topTagsLine
      ? `${name}님이 좋아하는 태그: ${topTagsLine}. 저장한 게임 ${data.savedCount}개 · 스쿼드 ${data.squadCount}회`
      : `${name}님의 공개 프로필 — 저장한 게임 ${data.savedCount}개 · 스쿼드 ${data.squadCount}회`,
  }
}

function getScoreClass(score: number): string {
  if (score >= 80) return resultStyles.scoreHigh
  if (score >= 60) return resultStyles.scoreMid
  return resultStyles.scoreLow
}

export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params
  const data = await loadProfile(userId)
  if (!data) notFound()

  const { profile, tags, savedCount, squadHistory, squadCount } = data
  const displayName = profile.display_name?.trim() || '익명 게이머'
  const maxWeight = tags[0]?.weight ?? 1

  return (
    <main className={resultStyles.main}>
      <header className={resultStyles.header}>
        <Link href="/" className={resultStyles.backLink}>
          ← 홈으로
        </Link>
      </header>

      <section className={resultStyles.summarySection}>
        <h1 className={styles.profileName}>{displayName}</h1>
        {profile.bio && <p className={styles.profileBio}>{profile.bio}</p>}

        <div className={styles.statsRow} aria-label="활동 통계">
          <div className={styles.statBlock}>
            <div className={styles.statNumber}>{savedCount}</div>
            <div className={styles.statLabel}>저장한 게임</div>
          </div>
          <div className={styles.statBlock}>
            <div className={styles.statNumber}>{squadCount}</div>
            <div className={styles.statLabel}>스쿼드 기록</div>
          </div>
        </div>
      </section>

      {/* Top tags */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>좋아하는 태그</h2>
        {tags.length === 0 ? (
          <p className={styles.emptyMsg}>아직 추천 피드백 기록이 없어요.</p>
        ) : (
          <ul className={styles.tagList}>
            {tags.map(t => {
              const pct = Math.max(8, Math.round((t.weight / maxWeight) * 100))
              return (
                <li key={t.tag} className={styles.tagRow}>
                  <span className={styles.tagName}>{t.tag}</span>
                  <div className={styles.tagBarTrack} aria-hidden="true">
                    <div className={styles.tagBarFill} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={styles.tagWeight} aria-label={`가중치 ${t.weight.toFixed(1)}`}>
                    {t.weight.toFixed(1)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {/* Squad history (SQ-14 inline) */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>최근 스쿼드</h2>
        {squadHistory.length === 0 ? (
          <p className={styles.emptyMsg}>아직 만든 스쿼드가 없어요.</p>
        ) : (
          <ul className={styles.historyList}>
            {squadHistory.map(s => {
              const dateFormatted = new Intl.DateTimeFormat('ko-KR', {
                year: 'numeric', month: 'long', day: 'numeric',
              }).format(new Date(s.created_at))
              return (
                <li key={s.share_token} className={styles.historyItem}>
                  <Link href={`/squad/${s.share_token}`} className={styles.historyLink}>
                    <div className={styles.historyMain}>
                      <span className={`${styles.historyScore} ${getScoreClass(s.avg_match_score)}`}>
                        {s.avg_match_score}%
                      </span>
                      <div className={styles.historyMeta}>
                        <div className={styles.historyTitle}>
                          {s.member_count}명 스쿼드
                        </div>
                        <time className={styles.historyDate} dateTime={s.created_at}>{dateFormatted}</time>
                      </div>
                    </div>
                    {s.top_shared_tags?.length > 0 && (
                      <div className={styles.historyTags}>
                        {s.top_shared_tags.slice(0, 3).map(tag => (
                          <span key={tag} className={resultStyles.tagPill}>{tag}</span>
                        ))}
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <footer className={shareStyles.squadFooter}>
        <Link href="/squad" className={shareStyles.ctaLink}>
          나도 내 스쿼드 만들기 →
        </Link>
      </footer>
    </main>
  )
}
