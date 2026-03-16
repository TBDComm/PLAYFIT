'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import styles from './Header.module.css'

export default function Header() {
  const [session, setSession] = useState<Session | null>(null)
  const [steamId, setSteamId] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [emailStep, setEmailStep] = useState<'input' | 'verify' | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [showLinkPopup, setShowLinkPopup] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const loginModalRef = useRef<HTMLDivElement>(null)
  const linkPopupRef = useRef<HTMLDivElement>(null)

  // Derived — no state needed
  const isSteamUser = session?.user?.email?.endsWith('@steam.playfit') ?? false
  const showLinkBtn = session !== null && !isSteamUser && steamId === null

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session) {
        const { data } = await supabase
          .from('user_profiles').select('steam_id').eq('id', session.user.id).maybeSingle()
        setSteamId(data?.steam_id ?? null)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session)
        if (event === 'SIGNED_IN' && session) {
          setShowLoginModal(false)
          setEmailStep(null)
          setEmailInput('')
          setOtpInput('')
          setOtpError(null)
          const { data } = await supabase
            .from('user_profiles').select('steam_id').eq('id', session.user.id).maybeSingle()
          const sid = data?.steam_id ?? null
          setSteamId(sid)
          const isSteam = session.user.email?.endsWith('@steam.playfit') ?? false
          if (!isSteam && sid === null) setShowLinkPopup(true)
        }
        if (event === 'SIGNED_OUT') {
          setSteamId(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  // Close login modal on Escape; focus first button on open
  useEffect(() => {
    if (!showLoginModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLoginModal(false)
        setEmailStep(null)
        setEmailInput('')
        setOtpInput('')
        setOtpError(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    loginModalRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showLoginModal])

  // Close link popup on Escape; focus input on open
  useEffect(() => {
    if (!showLinkPopup) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLinkPopup(false)
        setLinkUrl('')
        setLinkError(null)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    linkPopupRef.current?.querySelector<HTMLInputElement>('input')?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showLinkPopup])

  function closeLoginModal() {
    setShowLoginModal(false)
    setEmailStep(null)
    setEmailInput('')
    setOtpInput('')
    setOtpError(null)
  }

  function closeLinkPopup() {
    setShowLinkPopup(false)
    setLinkUrl('')
    setLinkError(null)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setSteamId(null)
    router.push('/')
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback` },
    })
  }

  const handleSteamLogin = () => {
    window.location.href = '/api/auth/steam'
  }

  const handleSendOtp = async () => {
    setOtpLoading(true)
    setOtpError(null)
    const { error } = await supabase.auth.signInWithOtp({ email: emailInput.trim() })
    setOtpLoading(false)
    if (error) {
      setOtpError('이메일 발송에 실패했어요. 다시 시도해주세요')
    } else {
      setEmailStep('verify')
    }
  }

  const handleVerifyOtp = async () => {
    setOtpLoading(true)
    setOtpError(null)
    const { error } = await supabase.auth.verifyOtp({
      email: emailInput.trim(),
      token: otpInput.trim(),
      type: 'email',
    })
    setOtpLoading(false)
    if (error) setOtpError('인증 코드가 올바르지 않아요')
    // On success, SIGNED_IN fires automatically via onAuthStateChange
  }

  const handleLinkSteam = async () => {
    setLinkLoading(true)
    setLinkError(null)
    const res = await fetch('/api/auth/link-steam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ steamUrl: linkUrl.trim() }),
    })
    const data = await res.json() as { ok?: boolean; error?: string; steam_id?: string }
    setLinkLoading(false)
    if (data.ok) {
      setSteamId(data.steam_id ?? null)
      closeLinkPopup()
    } else {
      setLinkError(
        data.error === 'INVALID_URL' ? '올바른 Steam URL을 입력해주세요' :
        data.error === 'STEAM_ALREADY_LINKED' ? '이미 다른 계정에 연동된 Steam 계정이에요' :
        '연동에 실패했어요. 다시 시도해주세요'
      )
    }
  }

  const modalTitle =
    emailStep === 'input' ? '이메일로 로그인' :
    emailStep === 'verify' ? '인증 코드 입력' :
    '로그인'

  return (
    <>
      <header className={styles.header}>
        <span className={styles.logo}>PLAYFIT</span>
        <div className={styles.headerActions}>
          {session ? (
            <>
              {showLinkBtn && (
                <button onClick={() => setShowLinkPopup(true)} className={styles.steamLinkBtn}>
                  Steam 연동
                </button>
              )}
              <button onClick={handleLogout} className={styles.logoutBtn}>
                로그아웃
              </button>
            </>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className={styles.loginBtn}>
              로그인
            </button>
          )}
        </div>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) closeLoginModal() }}
        >
          <div className={styles.modal} ref={loginModalRef}>
            <div className={styles.modalHeader}>
              <h2 id="login-modal-title" className={styles.modalTitle}>{modalTitle}</h2>
              <button onClick={closeLoginModal} className={styles.closeBtn} aria-label="모달 닫기">✕</button>
            </div>
            <div className={styles.modalBody}>
              {emailStep === null && (
                <>
                  <button onClick={() => setEmailStep('input')} className={styles.emailBtn}>
                    이메일로 로그인
                  </button>
                  <button onClick={handleGoogleLogin} className={styles.googleBtn}>
                    Google로 로그인
                  </button>
                  <button onClick={handleSteamLogin} className={styles.steamBtn}>
                    Steam으로 로그인
                  </button>
                </>
              )}
              {emailStep === 'input' && (
                <>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    className={styles.modalInput}
                    placeholder="이메일 주소…"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    spellCheck={false}
                    aria-label="이메일 주소"
                    onKeyDown={e => { if (e.key === 'Enter' && emailInput.trim()) void handleSendOtp() }}
                  />
                  {otpError && <p className={styles.modalError} role="alert">{otpError}</p>}
                  <button
                    onClick={handleSendOtp}
                    className={styles.primaryBtn}
                    disabled={otpLoading || !emailInput.trim()}
                  >
                    {otpLoading ? '발송 중…' : '인증 코드 발송'}
                  </button>
                  <button
                    onClick={() => { setEmailStep(null); setOtpError(null) }}
                    className={styles.backBtn}
                  >
                    ← 돌아가기
                  </button>
                </>
              )}
              {emailStep === 'verify' && (
                <>
                  <p className={styles.modalDesc}>{emailInput}으로 발송된 6자리 코드를 입력해주세요</p>
                  <input
                    type="text"
                    name="otp"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    className={styles.modalInput}
                    placeholder="000000…"
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    spellCheck={false}
                    aria-label="인증 코드"
                    onKeyDown={e => { if (e.key === 'Enter' && otpInput.length === 6) void handleVerifyOtp() }}
                  />
                  {otpError && <p className={styles.modalError} role="alert">{otpError}</p>}
                  <button
                    onClick={handleVerifyOtp}
                    className={styles.primaryBtn}
                    disabled={otpLoading || otpInput.length !== 6}
                  >
                    {otpLoading ? '확인 중…' : '확인'}
                  </button>
                  <button
                    onClick={() => { setEmailStep('input'); setOtpError(null); setOtpInput('') }}
                    className={styles.backBtn}
                  >
                    ← 이메일 재입력
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Steam Link Popup */}
      {showLinkPopup && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="link-popup-title"
          onClick={(e) => { if (e.target === e.currentTarget) closeLinkPopup() }}
        >
          <div className={styles.modal} ref={linkPopupRef}>
            <div className={styles.modalHeader}>
              <h2 id="link-popup-title" className={styles.modalTitle}>기존 Steam 데이터를 연동하세요</h2>
              <button onClick={closeLinkPopup} className={styles.closeBtn} aria-label="팝업 닫기">✕</button>
            </div>
            <div className={styles.modalBody}>
              <input
                type="url"
                name="steam-url"
                autoComplete="off"
                className={styles.modalInput}
                placeholder="Steam 프로필 URL…"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                spellCheck={false}
                aria-label="Steam 프로필 URL"
                onKeyDown={e => { if (e.key === 'Enter' && linkUrl.trim()) void handleLinkSteam() }}
              />
              {linkError && <p className={styles.modalError} role="alert">{linkError}</p>}
              <button
                onClick={handleLinkSteam}
                className={styles.primaryBtn}
                disabled={linkLoading || !linkUrl.trim()}
              >
                {linkLoading ? '연동 중…' : '연동하기'}
              </button>
              <button onClick={closeLinkPopup} className={styles.backBtn}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
