'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'
import { trackEvent } from '@/lib/analytics'
import styles from './Header.module.css'
import GuildelineMark from './GuildelineMark'

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential: string }) => void
          }) => void
          renderButton: (parent: HTMLElement, options: {
            theme?: 'outline' | 'filled_blue' | 'filled_black'
            size?: 'large' | 'medium' | 'small'
            locale?: string
          }) => void
        }
      }
    }
  }
}

function SteamIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="#c6d4df">
      <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.455 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/>
    </svg>
  )
}

type LoginView = 'login' | 'signup' | 'verify' | 'forgot' | 'forgot-sent'

const modalTitles: Record<LoginView, string> = {
  login: 'guildeline에 로그인하기',
  signup: 'Guildeline 회원가입',
  verify: '이메일 인증',
  forgot: '비밀번호 재설정',
  'forgot-sent': '이메일을 확인하세요',
}

function Toast({ message }: { message: string }) {
  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.toastIcon} aria-hidden="true">✓</span>
      {message}
    </div>
  )
}

export default function Header() {
  const [session, setSession] = useState<Session | null>(null)
  const [steamId, setSteamId] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginView, setLoginView] = useState<LoginView>('login')
  const [emailInput, setEmailInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [otpInput, setOtpInput] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [showLinkPopup, setShowLinkPopup] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)
  const menuDropdownRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])
  const loginModalRef = useRef<HTMLDivElement>(null)
  const linkPopupRef = useRef<HTMLDivElement>(null)
  const googleBtnRef = useRef<HTMLDivElement>(null)

  // Derived — no state needed
  const isSteamUser = session?.user?.email?.endsWith('@steam.playfit') ?? false
  const showLinkBtn = session !== null && !isSteamUser && steamId === null
  const showOAuth = loginView === 'login' || loginView === 'signup'
  const userEmail = session?.user?.email ?? ''

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
          setLoginView('login')
          setEmailInput('')
          setPasswordInput('')
          setPasswordConfirm('')
          setOtpInput('')
          setAuthError(null)
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

  // Open login modal from custom event (dispatched by home page anon CTA)
  useEffect(() => {
    const handler = () => setShowLoginModal(true)
    window.addEventListener('guildeline:open-login', handler)
    return () => window.removeEventListener('guildeline:open-login', handler)
  }, [])

  // Close hamburger menu on Escape or outside click
  useEffect(() => {
    if (!menuOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuBtnRef.current?.contains(e.target as Node) ||
        menuDropdownRef.current?.contains(e.target as Node)
      ) return
      setMenuOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpen])

  // Render Google Sign-In button via GIS renderButton (avoids FedCM dependency)
  useEffect(() => {
    if (!showLoginModal || !googleBtnRef.current || !window.google?.accounts?.id) return
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: async ({ credential }: { credential: string }) => {
        trackEvent('google_login_started')
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credential,
        })
        if (error) setAuthError('Google 로그인에 실패했어요. 다시 시도해주세요')
      },
    })
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: 'outline',
      size: 'large',
      locale: 'ko',
    })
  }, [showLoginModal, showOAuth, supabase])

  // Close login modal on Escape; focus first input on open
  useEffect(() => {
    if (!showLoginModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowLoginModal(false)
        setLoginView('login')
        setEmailInput('')
        setPasswordInput('')
        setPasswordConfirm('')
        setOtpInput('')
        setAuthError(null)
        setAuthLoading(false)
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
    setLoginView('login')
    setEmailInput('')
    setPasswordInput('')
    setPasswordConfirm('')
    setOtpInput('')
    setAuthError(null)
    setAuthLoading(false)
  }

  function closeLinkPopup() {
    setShowLinkPopup(false)
    setLinkUrl('')
    setLinkError(null)
  }

  function switchView(view: LoginView) {
    setLoginView(view)
    setAuthError(null)
  }

  const handleLogout = async () => {
    setMenuOpen(false)
    setLogoutLoading(true)
    await fetch('/api/auth/signout', { method: 'POST' })
    window.location.href = '/'
  }

  const handleSteamLogin = () => {
    trackEvent('steam_login_started')
    window.location.href = '/api/auth/steam'
  }

  const handleSignIn = async () => {
    setAuthLoading(true)
    setAuthError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput.trim(),
      password: passwordInput,
    })
    setAuthLoading(false)
    if (error) setAuthError('이메일 또는 비밀번호가 올바르지 않아요')
    // On success, SIGNED_IN fires via onAuthStateChange
  }

  const handleSignUp = async () => {
    if (passwordInput !== passwordConfirm) {
      setAuthError('비밀번호가 일치하지 않아요')
      return
    }
    if (passwordInput.length < 6) {
      setAuthError('비밀번호는 6자 이상이어야 해요')
      return
    }
    setAuthLoading(true)
    setAuthError(null)
    const { data, error } = await supabase.auth.signUp({
      email: emailInput.trim(),
      password: passwordInput,
    })
    setAuthLoading(false)
    if (error) {
      setAuthError(
        error.message.toLowerCase().includes('already registered')
          ? '이미 가입된 이메일이에요'
          : '회원가입에 실패했어요. 다시 시도해주세요'
      )
    } else if (data.user?.identities?.length === 0) {
      setAuthError('이미 Google계정으로 가입된 이메일이에요. Google로 로그인해주세요')
    } else {
      setLoginView('verify')
    }
  }

  const handleVerifyOtp = async () => {
    setAuthLoading(true)
    setAuthError(null)
    const { error } = await supabase.auth.verifyOtp({
      email: emailInput.trim(),
      token: otpInput.trim(),
      type: 'signup',
    })
    setAuthLoading(false)
    if (error) setAuthError('인증 코드가 올바르지 않아요')
    // On success, SIGNED_IN fires via onAuthStateChange
  }

  const handleForgotPassword = async () => {
    setAuthLoading(true)
    setAuthError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(emailInput.trim(), {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password`,
    })
    setAuthLoading(false)
    if (error) {
      setAuthError('이메일 발송에 실패했어요. 다시 시도해주세요')
    } else {
      setLoginView('forgot-sent')
    }
  }

  const handleLinkSteam = async () => {
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
        closeLinkPopup()
        setToast('Steam 계정이 연동되었어요!')
        setTimeout(() => setToast(null), 3500)
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

  return (
    <>
      {toast && <Toast message={toast} />}
      <div className={styles.authFloat}>
        {session ? (
          <div className={styles.menuWrap}>
            <button
              ref={menuBtnRef}
              className={styles.menuBtn}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="메뉴 열기"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className={`${styles.menuBar} ${menuOpen ? styles.menuBarOpen1 : ''}`} />
              <span className={`${styles.menuBar} ${menuOpen ? styles.menuBarOpen2 : ''}`} />
              <span className={`${styles.menuBar} ${menuOpen ? styles.menuBarOpen3 : ''}`} />
            </button>

            {menuOpen && (
              <div
                ref={menuDropdownRef}
                className={styles.dropdown}
                role="menu"
              >
                {/* User info */}
                <div className={styles.dropdownUser}>
                  {isSteamUser ? (
                    <span className={styles.dropdownEmail}>Steam 로그인</span>
                  ) : (
                    <span className={styles.dropdownEmail}>{userEmail}</span>
                  )}
                  {steamId ? (
                    <span className={styles.dropdownSteamBadge}>Steam 연동됨</span>
                  ) : (
                    <button
                      className={styles.dropdownSteamLink}
                      onClick={() => { setMenuOpen(false); setShowLinkPopup(true) }}
                      role="menuitem"
                    >
                      Steam 연동하기
                    </button>
                  )}
                </div>

                <div className={styles.dropdownDivider} />

                <Link
                  href="/settings"
                  className={styles.dropdownItem}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  내 설정
                </Link>

                <div className={styles.dropdownDivider} />

                <button
                  className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  role="menuitem"
                >
                  {logoutLoading ? '로그아웃 중…' : '로그아웃'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => setShowLoginModal(true)} className={styles.loginBtn}>
            로그인
          </button>
        )}
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          onClick={(e) => { if (e.target === e.currentTarget) closeLoginModal() }}
        >
          <div className={styles.modalWrap} ref={loginModalRef}>
            {/* Title row — title centered, close button at right */}
            <div className={styles.modalTitleRow}>
              <h2 id="login-modal-title" className={styles.modalTitle}>
                {loginView === 'login' ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/guildeline-logo.png" alt="" aria-hidden="true" width={22} height={22} className={styles.modalTitleIcon} />
                    <span className={styles.modalTitleAccent}>guildeline</span>에 로그인하기
                  </>
                ) : modalTitles[loginView]}
              </h2>
              <button onClick={closeLoginModal} className={styles.closeBtn} aria-label="모달 닫기">✕</button>
            </div>

            {/* Bordered card */}
            <div className={styles.card}>
              {loginView === 'login' && (
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
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <div className={styles.fieldHeader}>
                      <label htmlFor="modal-password" className={styles.fieldLabel}>비밀번호</label>
                      <button
                        onClick={() => switchView('forgot')}
                        className={styles.inlineLink}
                        type="button"
                      >
                        비밀번호 찾기
                      </button>
                    </div>
                    <input
                      id="modal-password"
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      className={styles.modalInput}
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      spellCheck={false}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && emailInput.trim() && passwordInput)
                          void handleSignIn()
                      }}
                    />
                  </div>
                  {authError && (
                    <>
                      <p className={styles.modalError} role="alert">{authError}</p>
                      <p className={styles.modalDesc}>
                        처음이신가요?{' '}
                        <button onClick={() => switchView('signup')} className={styles.inlineLink}>
                          회원가입하기
                        </button>
                      </p>
                    </>
                  )}
                  <button
                    onClick={handleSignIn}
                    className={styles.primaryBtn}
                    disabled={authLoading || !emailInput.trim() || !passwordInput}
                  >
                    {authLoading ? '로그인 중…' : '로그인'}
                  </button>
                </>
              )}

              {loginView === 'signup' && (
                <>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="signup-email" className={styles.fieldLabel}>이메일 주소</label>
                    <input
                      id="signup-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      className={styles.modalInput}
                      placeholder="you@example.com"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      spellCheck={false}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="signup-password" className={styles.fieldLabel}>비밀번호</label>
                    <input
                      id="signup-password"
                      type="password"
                      name="new-password"
                      autoComplete="new-password"
                      className={styles.modalInput}
                      placeholder="6자 이상…"
                      value={passwordInput}
                      onChange={e => setPasswordInput(e.target.value)}
                      spellCheck={false}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="signup-confirm" className={styles.fieldLabel}>비밀번호 확인</label>
                    <input
                      id="signup-confirm"
                      type="password"
                      name="confirm-password"
                      autoComplete="new-password"
                      className={styles.modalInput}
                      value={passwordConfirm}
                      onChange={e => setPasswordConfirm(e.target.value)}
                      spellCheck={false}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && emailInput.trim() && passwordInput && passwordConfirm)
                          void handleSignUp()
                      }}
                    />
                  </div>
                  {authError && <p className={styles.modalError} role="alert">{authError}</p>}
                  <button
                    onClick={handleSignUp}
                    className={styles.primaryBtn}
                    disabled={authLoading || !emailInput.trim() || !passwordInput || !passwordConfirm}
                  >
                    {authLoading ? '처리 중…' : '회원가입'}
                  </button>
                </>
              )}

              {loginView === 'verify' && (
                <>
                  <p className={styles.modalDesc}>
                    <strong>{emailInput}</strong>으로 발송된 6자리 인증 코드를 입력해주세요
                  </p>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="modal-otp" className={styles.fieldLabel}>인증 코드</label>
                    <input
                      id="modal-otp"
                      type="text"
                      name="otp"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      className={styles.modalInput}
                      placeholder="XXXXXX"
                      value={otpInput}
                      onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      spellCheck={false}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && otpInput.length === 6) void handleVerifyOtp()
                      }}
                    />
                  </div>
                  {authError && <p className={styles.modalError} role="alert">{authError}</p>}
                  <button
                    onClick={handleVerifyOtp}
                    className={styles.primaryBtn}
                    disabled={authLoading || otpInput.length !== 6}
                  >
                    {authLoading ? '확인 중…' : '인증 완료'}
                  </button>
                </>
              )}

              {loginView === 'forgot' && (
                <>
                  <p className={styles.modalDesc}>
                    가입한 이메일 주소를 입력하면 비밀번호 재설정 링크를 보내드려요
                  </p>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="forgot-email" className={styles.fieldLabel}>이메일 주소</label>
                    <input
                      id="forgot-email"
                      type="email"
                      name="email"
                      autoComplete="email"
                      className={styles.modalInput}
                      placeholder="you@example.com"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      spellCheck={false}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && emailInput.trim()) void handleForgotPassword()
                      }}
                    />
                  </div>
                  {authError && <p className={styles.modalError} role="alert">{authError}</p>}
                  <button
                    onClick={handleForgotPassword}
                    className={styles.primaryBtn}
                    disabled={authLoading || !emailInput.trim()}
                  >
                    {authLoading ? '발송 중…' : '재설정 링크 발송'}
                  </button>
                </>
              )}

              {loginView === 'forgot-sent' && (
                <p className={styles.modalDesc}>
                  <strong>{emailInput}</strong>으로 비밀번호 재설정 링크를 발송했어요. 이메일을 확인해주세요.
                </p>
              )}
            </div>

            {/* OAuth buttons — outside card, only on login/signup */}
            {showOAuth && (
              <div className={styles.oauthSection}>
                <div className={styles.orDivider}><span>또는</span></div>
                <div ref={googleBtnRef} className={styles.googleBtnContainer} />
                <button onClick={handleSteamLogin} className={styles.steamBtn}>
                  <SteamIcon />
                  Steam으로 로그인하기
                </button>
              </div>
            )}

            {/* Footer link — outside card */}
            <div className={styles.authFooter}>
              {loginView === 'login' && (
                <span>
                  처음이신가요?{' '}
                  <button onClick={() => switchView('signup')} className={styles.footerLink}>
                    회원가입
                  </button>
                </span>
              )}
              {loginView === 'signup' && (
                <span>
                  이미 계정이 있으신가요?{' '}
                  <button onClick={() => switchView('login')} className={styles.footerLink}>
                    로그인
                  </button>
                </span>
              )}
              {(loginView === 'verify' || loginView === 'forgot' || loginView === 'forgot-sent') && (
                <button onClick={() => switchView('login')} className={styles.footerLink}>
                  ← 로그인으로
                </button>
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
          <div className={styles.modalWrap} ref={linkPopupRef}>
            {/* Logo — centered, above title and close button */}
            <div className={styles.modalLogoArea}>
              <GuildelineMark size={48} />
            </div>

            {/* Title row — title centered, close button at right */}
            <div className={styles.modalTitleRow}>
              <h2 id="link-popup-title" className={styles.modalTitle}>Steam 계정 연동</h2>
              <button onClick={closeLinkPopup} className={styles.closeBtn} aria-label="팝업 닫기">✕</button>
            </div>
            <div className={styles.card}>
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
            </div>
            <div className={styles.authFooter}>
              <button onClick={closeLinkPopup} className={styles.footerLink}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
