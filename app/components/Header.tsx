'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import styles from './Header.module.css'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function SteamIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="#c6d4df">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.455 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/>
    </svg>
  )
}

export default function Header() {
  const [session, setSession] = useState<Session | null>(null)
  const [steamId, setSteamId] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [emailStep, setEmailStep] = useState<'verify' | null>(null)
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

  // Close login modal on Escape; focus first input on open
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
    loginModalRef.current?.querySelector<HTMLInputElement>('input')?.focus()
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
            <button onClick={closeLoginModal} className={styles.closeBtn} aria-label="모달 닫기">✕</button>
            <div className={styles.modalLogoArea}>
              <div className={styles.modalLogo} aria-hidden="true">P</div>
              <h2 id="login-modal-title" className={styles.modalTitle}>
                {emailStep === 'verify' ? '인증 코드 입력' : 'PlayFit 로그인'}
              </h2>
            </div>
            <div className={styles.modalBody}>
              {emailStep === null && (
                <>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="modal-email" className={styles.fieldLabel}>이메일 주소</label>
                    <input
                      id="modal-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      className={styles.modalInput}
                      placeholder="you@example.com"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      spellCheck={false}
                      onKeyDown={e => { if (e.key === 'Enter' && emailInput.trim()) void handleSendOtp() }}
                    />
                  </div>
                  {otpError && <p className={styles.modalError} role="alert">{otpError}</p>}
                  <button
                    onClick={handleSendOtp}
                    className={styles.primaryBtn}
                    disabled={otpLoading || !emailInput.trim()}
                  >
                    {otpLoading ? '발송 중…' : '인증 코드 발송'}
                  </button>
                  <div className={styles.orDivider}><span>또는</span></div>
                  <button onClick={handleGoogleLogin} className={styles.googleBtn}>
                    <GoogleIcon />
                    Google로 계속하기
                  </button>
                  <button onClick={handleSteamLogin} className={styles.steamBtn}>
                    <SteamIcon />
                    Steam으로 계속하기
                  </button>
                </>
              )}
              {emailStep === 'verify' && (
                <>
                  <p className={styles.modalDesc}>{emailInput}으로 발송된 6자리 코드를 입력해주세요</p>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="modal-otp" className={styles.fieldLabel}>인증 코드</label>
                    <input
                      id="modal-otp"
                      type="text"
                      name="otp"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      className={styles.modalInput}
                      placeholder="000000…"
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      spellCheck={false}
                      onKeyDown={e => { if (e.key === 'Enter' && otpInput.length === 6) void handleVerifyOtp() }}
                    />
                  </div>
                  {otpError && <p className={styles.modalError} role="alert">{otpError}</p>}
                  <button
                    onClick={handleVerifyOtp}
                    className={styles.primaryBtn}
                    disabled={otpLoading || otpInput.length !== 6}
                  >
                    {otpLoading ? '확인 중…' : '확인'}
                  </button>
                  <button
                    onClick={() => { setEmailStep(null); setOtpError(null); setOtpInput('') }}
                    className={styles.backLink}
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
            <button onClick={closeLinkPopup} className={styles.closeBtn} aria-label="팝업 닫기">✕</button>
            <div className={styles.modalLogoArea}>
              <div className={styles.modalLogo} aria-hidden="true">P</div>
              <h2 id="link-popup-title" className={styles.modalTitle}>Steam 계정 연동</h2>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.fieldGroup}>
                <label htmlFor="steam-url-input" className={styles.fieldLabel}>Steam 프로필 URL</label>
                <input
                  id="steam-url-input"
                  type="url"
                  name="steam-url"
                  autoComplete="off"
                  className={styles.modalInput}
                  placeholder="https://steamcommunity.com/id/…"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                  spellCheck={false}
                  onKeyDown={e => { if (e.key === 'Enter' && linkUrl.trim()) void handleLinkSteam() }}
                />
              </div>
              {linkError && <p className={styles.modalError} role="alert">{linkError}</p>}
              <button
                onClick={handleLinkSteam}
                className={styles.primaryBtn}
                disabled={linkLoading || !linkUrl.trim()}
              >
                {linkLoading ? '연동 중…' : '연동하기'}
              </button>
              <button onClick={closeLinkPopup} className={styles.backLink}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
