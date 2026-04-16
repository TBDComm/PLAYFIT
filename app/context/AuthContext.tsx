'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Session } from '@supabase/supabase-js'

export type AuthState = 'loading' | 'steam' | 'linked' | 'unlinked_auth' | 'anon'

type AuthContextValue = {
  session: Session | null
  steamId: string | null
  isPublic: boolean
  authState: AuthState
  setSteamId: (id: string | null) => void
  setIsPublic: (v: boolean) => void
  supabase: ReturnType<typeof createBrowserClient>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Module-level singleton — same pattern as RecommendationForm/SavedGames
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [steamId, setSteamId] = useState<string | null>(null)
  const [isPublic, setIsPublic] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const initializedRef = useRef(false)

  // Derive authState inline — no state needed (rerender-optimization rule 5.1)
  const isSteam = session?.user?.email?.endsWith('@steam.playfit') ?? false
  let authState: AuthState
  if (isLoading) authState = 'loading'
  else if (!session) authState = 'anon'
  else if (isSteam && steamId) authState = 'steam'
  else if (!isSteam && steamId) authState = 'linked'
  else authState = 'unlinked_auth'

  useEffect(() => {
    // Reset flag so strict-mode double-invoke works correctly
    initializedRef.current = false

    // is_public 도 같은 row에서 가져옴 — 추가 round-trip 없음
    async function fetchSteamId(userId: string): Promise<void> {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('steam_id, is_public')
        .eq('id', userId)
        .maybeSingle()
      if (error) {
        // RLS 문제나 네트워크 오류 시 Steam 연동이 없는 것처럼 보이는 버그 방지를 위해 로깅
        console.error('[auth] user_profiles 조회 실패 (userId:', userId, '):', error)
      } else if (!data) {
        // RLS가 조용히 막거나 row 자체가 없는 경우 (에러 없이 null 반환)
        console.warn('[auth] user_profiles row 없음 (userId:', userId, ') — Steam 미연동 또는 RLS 문제')
      }
      setSteamId(data?.steam_id ?? null)
      setIsPublic(Boolean(data?.is_public))
      setIsLoading(false)
    }

    // Fast path: use getSession() if token is already fresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (initializedRef.current) return
      if (session) {
        // Token is valid — safe to use immediately; don't wait for INITIAL_SESSION
        initializedRef.current = true
        setSession(session)
        void fetchSteamId(session.user.id)
      }
      // If null: token may be expired (refresh in progress); let INITIAL_SESSION handle it
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        if (initializedRef.current) return   // getSession() already handled
        initializedRef.current = true
        setSession(session)
        if (session) void fetchSteamId(session.user.id)
        else setIsLoading(false)
      } else if (event === 'SIGNED_IN') {
        // Previously missing in RecommendationForm — the root cause of the persistence bug
        // setIsLoading(true) ensures authState stays 'loading' until steamId is fetched,
        // preventing a premature 'unlinked_auth' flash for users who have linked steam
        setIsLoading(true)
        setSession(session)
        if (session) void fetchSteamId(session.user.id)
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(session)                  // steamId is permanent — no re-fetch needed
      } else if (event === 'SIGNED_OUT') {
        setSession(null)
        setSteamId(null)
        setIsPublic(false)
        setIsLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, steamId, isPublic, authState, setSteamId, setIsPublic, supabase }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
