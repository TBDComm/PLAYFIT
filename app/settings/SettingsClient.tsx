'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import PageLoading from '@/app/components/PageLoading'
import { useAuth } from '@/app/context/AuthContext'
import styles from './page.module.css'

type TagWeight = { tag: string; weight: number }
type SteamState = 'loading' | 'linked' | 'unlinked'

const DISPLAY_NAME_MAX = 50
const BIO_MAX = 160

const MAX_WEIGHT = 3.0
const MIN_WEIGHT = 0.1

// ── Tag weight row — defined outside to prevent remount on every render ──
function WeightRow({
  item,
  maxWeight,
  onChange,
}: {
  item: TagWeight
  maxWeight: number
  onChange: (tag: string, value: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(item.weight))
  const inputRef = useRef<HTMLInputElement>(null)
  // Guards against double-commit when Enter fires commit() then blur also fires
  const didCommitRef = useRef(false)
  const barPct = Math.round((item.weight / Math.max(maxWeight, MAX_WEIGHT)) * 100)

  const commit = useCallback(() => {
    if (didCommitRef.current) return
    didCommitRef.current = true
    const parsed = parseFloat(draft)
    if (!isNaN(parsed)) {
      const clamped = Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, parsed))
      onChange(item.tag, Math.round(clamped * 100) / 100)
      setDraft(String(Math.round(clamped * 100) / 100))
    } else {
      setDraft(String(item.weight))
    }
    setEditing(false)
  }, [draft, item.tag, item.weight, onChange])

  useEffect(() => {
    if (editing) {
      didCommitRef.current = false
      inputRef.current?.focus()
    }
  }, [editing])

  return (
    <div className={styles.weightRow}>
      <span className={styles.tagChip}>{item.tag}</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${barPct}%` }} />
      </div>
      {editing ? (
        <input
          ref={inputRef}
          className={styles.weightInput}
          type="number"
          min={MIN_WEIGHT}
          max={MAX_WEIGHT}
          step={0.1}
          aria-label={`${item.tag} 가중치`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') { setDraft(String(item.weight)); setEditing(false) }
          }}
        />
      ) : (
        <button
          className={styles.weightValue}
          onClick={() => { setDraft(String(item.weight)); setEditing(true) }}
          aria-label={`${item.tag} 가중치 수정 (현재 ${item.weight.toFixed(1)})`}
        >
          {item.weight.toFixed(1)}
        </button>
      )}
    </div>
  )
}

// ── 공개 프로필 공유 링크 (외부 정의로 리렌더 시 input 포커스 유지) ──
function ProfileShareLink({ userId }: { userId: string }) {
  const [origin, setOrigin] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setOrigin(window.location.origin)
  }, [])

  const url = origin ? `${origin}/users/${userId}` : `/users/${userId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard 실패 시 조용히 무시
    }
  }

  return (
    <div className={styles.shareLinkBox}>
      <span className={styles.shareLinkLabel}>공개 프로필 링크</span>
      <div className={styles.shareLinkRow}>
        <input
          type="text"
          name="profile-share-url"
          className={styles.shareLinkInput}
          value={url}
          readOnly
          onFocus={(e) => e.currentTarget.select()}
          autoComplete="off"
          spellCheck={false}
          aria-label="공개 프로필 URL"
        />
        <button
          type="button"
          className={styles.shareCopyBtn}
          onClick={handleCopy}
          aria-label="공개 프로필 URL 복사"
        >
          {copied ? '복사됨 ✓' : '복사'}
        </button>
      </div>
      <a
        href={`/users/${userId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.shareLinkPreview}
      >
        새 탭에서 미리보기 →
      </a>
    </div>
  )
}

export default function SettingsClient() {
  const { setIsPublic: setAuthIsPublic } = useAuth()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)

  // Steam state
  const [steamState, setSteamState] = useState<SteamState>('loading')
  const [steamId, setSteamId] = useState<string | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [linkSuccess, setLinkSuccess] = useState(false)

  // Profile state
  const [profileDisplayName, setProfileDisplayName] = useState('')
  const [profileBio, setProfileBio] = useState('')
  const [profileIsPublic, setProfileIsPublic] = useState(false)
  const [profileReady, setProfileReady] = useState(false)
  const [profileDirty, setProfileDirty] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileSaveError, setProfileSaveError] = useState(false)

  // Tag weights state
  const [weights, setWeights] = useState<TagWeight[]>([])
  const [weightsReady, setWeightsReady] = useState(false)
  const [weightsLoading, setWeightsLoading] = useState(false)
  const [weightsDirty, setWeightsDirty] = useState(false)
  const [weightsSaving, setWeightsSaving] = useState(false)
  const [weightsSaved, setWeightsSaved] = useState(false)
  const [weightsSaveError, setWeightsSaveError] = useState(false)

  // Load session — onAuthStateChange is more reliable than getSession alone:
  // getSession can return null when the access token is expired mid-refresh.
  // INITIAL_SESSION fires after the refresh completes with the real session.
  useEffect(() => {
    // Fast path: grab immediately if token is fresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionToken(session.access_token)
        setUserId(session.user.id)
        setAuthReady(true)
      }
    }).catch(() => { /* ignore, onAuthStateChange below will handle it */ })

    // Reliable path: covers expired/refreshing tokens
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSessionToken(session?.access_token ?? null)
        setUserId(session?.user.id ?? null)
        setAuthReady(true)
      } else if (event === 'SIGNED_OUT') {
        setSessionToken(null)
        setUserId(null)
        setAuthReady(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Load steam_id, tag weights, and profile in parallel once we have userId/token
  useEffect(() => {
    if (!userId || !sessionToken) return

    const steamPromise = supabase
      .from('user_profiles')
      .select('steam_id')
      .eq('id', userId)
      .maybeSingle()

    const weightsPromise = fetch('/api/tag-weights', {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })

    const profilePromise = fetch('/api/profile', {
      headers: { Authorization: `Bearer ${sessionToken}` },
    })

    void Promise.all([steamPromise, weightsPromise, profilePromise]).then(async ([steamResult, weightsRes, profileRes]) => {
      const sid = steamResult.data?.steam_id ?? null
      setSteamId(sid)
      setSteamState(sid ? 'linked' : 'unlinked')

      if (weightsRes.ok) {
        const json = await weightsRes.json() as { weights: TagWeight[] }
        setWeights(json.weights)
      }
      setWeightsReady(true)

      if (profileRes.ok) {
        const pj = await profileRes.json() as { display_name: string | null; bio: string | null; is_public: boolean }
        setProfileDisplayName(pj.display_name ?? '')
        setProfileBio(pj.bio ?? '')
        setProfileIsPublic(pj.is_public)
      }
      setProfileReady(true)
    }).catch(() => {
      setSteamState('unlinked')
      setWeightsReady(true)
      setProfileReady(true)
    })
  }, [userId, sessionToken, supabase])

  const handleLinkSteam = async () => {
    if (!linkUrl.trim()) return
    setLinkLoading(true)
    setLinkError(null)
    try {
      const res = await fetch('/api/auth/link-steam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ steamUrl: linkUrl.trim() }),
      })
      const data = await res.json() as { ok?: boolean; error?: string; steam_id?: string }
      if (data.ok) {
        setSteamId(data.steam_id ?? null)
        setSteamState('linked')
        setLinkUrl('')
        setLinkSuccess(true)
        setTimeout(() => setLinkSuccess(false), 3500)
      } else {
        setLinkError(
          data.error === 'INVALID_URL' ? '올바른 Steam URL을 입력해주세요' :
          data.error === 'STEAM_ALREADY_LINKED' ? '이미 다른 계정에 연동된 Steam 계정이에요' :
          '연동에 실패했어요. 다시 시도해주세요'
        )
      }
    } catch {
      setLinkError('연동에 실패했어요. 다시 시도해주세요')
    } finally {
      setLinkLoading(false)
    }
  }

  // Warn before unload when there are unsaved changes (weights or profile)
  useEffect(() => {
    if (!weightsDirty && !profileDirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [weightsDirty, profileDirty])

  const handleWeightChange = useCallback((tag: string, value: number) => {
    setWeights(prev => prev.map(w => w.tag === tag ? { ...w, weight: value } : w))
    setWeightsDirty(true)
    setWeightsSaved(false)
  }, [])

  const handleSaveWeights = async () => {
    if (!sessionToken || !weightsDirty) return
    setWeightsSaving(true)
    setWeightsSaveError(false)
    try {
      const res = await fetch('/api/tag-weights', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ weights }),
      })
      if (res.ok) {
        setWeightsDirty(false)
        setWeightsSaved(true)
        setTimeout(() => setWeightsSaved(false), 2500)
      } else {
        setWeightsSaveError(true)
      }
    } catch {
      setWeightsSaveError(true)
    } finally {
      setWeightsSaving(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!sessionToken || !profileDirty) return
    setProfileSaving(true)
    setProfileSaveError(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          display_name: profileDisplayName.trim() || null,
          bio: profileBio.trim() || null,
          is_public: profileIsPublic,
        }),
      })
      if (res.ok) {
        setProfileDirty(false)
        setProfileSaved(true)
        setAuthIsPublic(profileIsPublic)  // Header 드롭다운에 즉시 반영
        setTimeout(() => setProfileSaved(false), 2500)
      } else {
        setProfileSaveError(true)
      }
    } catch {
      setProfileSaveError(true)
    } finally {
      setProfileSaving(false)
    }
  }

  const handleReloadWeights = async () => {
    if (!sessionToken) return
    setWeightsLoading(true)
    try {
      const res = await fetch('/api/tag-weights', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
      if (res.ok) {
        const json = await res.json() as { weights: TagWeight[] }
        setWeights(json.weights)
        setWeightsDirty(false)
        setWeightsSaveError(false)
      }
    } finally {
      setWeightsLoading(false)
    }
  }

  if (!authReady) {
    return <PageLoading />
  }

  if (!userId) {
    return (
      <main className={styles.page}>
        <div className={styles.inner}>
          <p className={styles.unauthMsg}>로그인 후 이용할 수 있어요.</p>
        </div>
      </main>
    )
  }

  return (
    <main id="main-content" className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.pageTitle}>내 설정</h1>

        {/* ── Profile section ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>프로필 설정</h2>
          <p className={styles.sectionDesc}>
            공개 프로필을 활성화하면 취향 태그, 저장한 게임, 스쿼드 기록을 링크로 공유할 수 있어요.
          </p>

          {!profileReady && <div className={styles.skeletonLine} />}

          {profileReady && (
            <>
              <div className={styles.profileField}>
                <div className={styles.profileLabelRow}>
                  <label htmlFor="profile-display-name" className={styles.linkLabel}>닉네임</label>
                  <span className={styles.charCount} aria-hidden="true">
                    {profileDisplayName.length}/{DISPLAY_NAME_MAX}
                  </span>
                </div>
                <span id="display-name-limit" className={styles.srOnly}>최대 {DISPLAY_NAME_MAX}자</span>
                <input
                  id="profile-display-name"
                  name="display-name"
                  type="text"
                  className={styles.urlInput}
                  placeholder="예: GamerPro123…"
                  maxLength={DISPLAY_NAME_MAX}
                  value={profileDisplayName}
                  onChange={(e) => { setProfileDisplayName(e.target.value); setProfileDirty(true); setProfileSaved(false) }}
                  disabled={profileSaving}
                  autoComplete="nickname"
                  spellCheck={false}
                  aria-describedby="display-name-limit"
                />
              </div>

              <div className={styles.profileField}>
                <div className={styles.profileLabelRow}>
                  <label htmlFor="profile-bio" className={styles.linkLabel}>자기소개</label>
                  <span className={styles.charCount} aria-hidden="true">
                    {profileBio.length}/{BIO_MAX}
                  </span>
                </div>
                <span id="bio-limit" className={styles.srOnly}>최대 {BIO_MAX}자</span>
                <textarea
                  id="profile-bio"
                  name="bio"
                  className={styles.profileTextarea}
                  placeholder="예: 공포 게임 전문가, RPG 수집가…"
                  maxLength={BIO_MAX}
                  rows={3}
                  value={profileBio}
                  onChange={(e) => { setProfileBio(e.target.value); setProfileDirty(true); setProfileSaved(false) }}
                  disabled={profileSaving}
                  autoComplete="off"
                  aria-describedby="bio-limit"
                />
              </div>

              <label className={styles.toggleRow}>
                <input
                  type="checkbox"
                  name="is-public"
                  className={styles.toggleCheck}
                  checked={profileIsPublic}
                  onChange={(e) => { setProfileIsPublic(e.target.checked); setProfileDirty(true); setProfileSaved(false) }}
                  disabled={profileSaving}
                />
                <span className={styles.toggleLabel}>프로필 공개</span>
              </label>

              <div aria-live="polite" aria-atomic="true">
                {profileSaveError && <p className={styles.errorMsg}>저장에 실패했어요. 다시 시도해주세요.</p>}
              </div>

              <div className={styles.saveRow}>
                <span aria-live="polite" aria-atomic="true" className={styles.savedNote}>
                  {profileSaved ? '저장되었어요 ✓' : ''}
                </span>
                <button
                  className={styles.saveBtn}
                  onClick={handleSaveProfile}
                  disabled={!profileDirty || profileSaving}
                >
                  {profileSaving ? '저장 중…' : '변경 사항 저장'}
                </button>
              </div>

              {profileIsPublic && !profileDirty && userId && (
                <ProfileShareLink userId={userId} />
              )}
            </>
          )}
        </section>

        {/* ── Steam section ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Steam 연동</h2>

          {steamState === 'loading' && <div className={styles.skeletonLine} />}

          {steamState === 'linked' && steamId && (
            <div className={styles.steamLinked}>
              <span className={styles.linkedBadge}>연동됨</span>
              <span className={styles.steamIdDisplay}>
                Steam ID: <code>{steamId}</code>
              </span>
            </div>
          )}

          {steamState !== 'loading' && (
          <div className={styles.linkForm}>
            <label htmlFor="steam-url-settings" className={styles.linkLabel}>
              {steamState === 'linked' ? 'Steam 계정 재연동' : 'Steam 프로필 URL 입력'}
            </label>
            <div className={styles.linkRow}>
              <input
                id="steam-url-settings"
                name="steam-url"
                type="url"
                className={styles.urlInput}
                placeholder="https://steamcommunity.com/id/…"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && linkUrl.trim()) void handleLinkSteam() }}
                disabled={linkLoading}
                spellCheck={false}
                autoComplete="off"
              />
              <button
                className={styles.linkBtn}
                onClick={handleLinkSteam}
                disabled={linkLoading || !linkUrl.trim()}
              >
                {linkLoading ? '연동 중…' : steamState === 'linked' ? '재연동' : '연동하기'}
              </button>
            </div>
            <div aria-live="polite" aria-atomic="true">
              {linkError && <p className={styles.errorMsg}>{linkError}</p>}
              {linkSuccess && <p className={styles.successMsg}>Steam 계정이 연동되었어요!</p>}
            </div>
          </div>
          )}
        </section>

        {/* ── Tag weights section ── */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>태그 취향 가중치</h2>
            <button
              className={styles.reloadBtn}
              onClick={handleReloadWeights}
              disabled={weightsLoading}
              aria-label={weightsLoading ? '새로고침 중' : '가중치 새로고침'}
            >
              {weightsLoading ? '…' : '↺'}
            </button>
          </div>
          <p className={styles.sectionDesc}>
            추천 결과에 영향을 주는 태그별 가중치입니다. 숫자를 클릭해 직접 수정하세요 (0.1 ~ 3.0).
          </p>

          {!weightsReady && (
            <div className={styles.weightsSkeletonList}>
              {[80, 65, 55, 45, 40].map((w) => (
                <div key={w} className={styles.weightsSkeletonRow} style={{ width: `${w}%` }} />
              ))}
            </div>
          )}

          {weightsReady && weights.length === 0 && !weightsLoading && (
            <p className={styles.emptyMsg}>
              아직 피드백 기록이 없어요. 추천 결과에서 👍/👎을 누르면 취향 가중치가 쌓여요.
            </p>
          )}

          {weightsReady && weights.length > 0 && (
            <>
              <div className={styles.weightList}>
                {weights.map((w) => (
                  <WeightRow
                    key={w.tag}
                    item={w}
                    maxWeight={weights[0]?.weight ?? MAX_WEIGHT}
                    onChange={handleWeightChange}
                  />
                ))}
              </div>
              <div aria-live="polite" aria-atomic="true">
                {weightsSaveError && (
                  <p className={styles.errorMsg}>저장에 실패했어요. 다시 시도해주세요.</p>
                )}
              </div>
              <div className={styles.saveRow}>
                <span aria-live="polite" aria-atomic="true" className={styles.savedNote}>
                  {weightsSaved ? '저장되었어요 ✓' : ''}
                </span>
                <button
                  className={styles.saveBtn}
                  onClick={handleSaveWeights}
                  disabled={!weightsDirty || weightsSaving}
                >
                  {weightsSaving ? '저장 중…' : '변경 사항 저장'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
