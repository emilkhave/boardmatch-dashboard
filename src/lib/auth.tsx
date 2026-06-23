import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Role, Session } from '../types'
import { supabase, supabaseConfigured } from './supabase'

export interface SignUpParams {
  email: string
  password: string
  role: Role
  name: string
  companyName?: string
  website?: string
  brandColor?: string
  logoUrl?: string
  role_title?: string
}

interface AuthContextValue {
  session: Session | null
  loading: boolean
  /** True when real Supabase Auth is active; false = legacy mock fallback. */
  configured: boolean
  accessToken: string | null
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (p: SignUpParams) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  /** Legacy mock login (only used when Supabase isn't configured yet). */
  loginMock: (session: Session) => void
  updateSession: (patch: Partial<Session>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const MOCK_KEY = 'boardmatch.session'

// Map a Supabase user → our app Session.
function toSession(user: any): Session {
  const m = user.user_metadata ?? {}
  const role: Role = m.role === 'admin' ? 'admin' : 'company'
  return {
    role,
    companyId: role === 'company' ? user.id : undefined,
    name: m.name || user.email || 'User',
    email: user.email || '',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      // Legacy mock fallback — restore any stored mock session.
      try {
        const raw = localStorage.getItem(MOCK_KEY)
        if (raw) setSession(JSON.parse(raw))
      } catch {
        /* ignore */
      }
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSession(toSession(data.session.user))
        setAccessToken(data.session.access_token)
      }
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s?.user ? toSession(s.user) : null)
      setAccessToken(s?.access_token ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { error: 'Auth is not configured yet.' }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message }
  }

  const signUp = async (p: SignUpParams) => {
    if (!supabase) return { error: 'Auth is not configured yet.' }
    const { error } = await supabase.auth.signUp({
      email: p.email,
      password: p.password,
      options: {
        data: {
          role: p.role,
          name: p.name,
          companyName: p.companyName,
          website: p.website,
          brandColor: p.brandColor,
          logoUrl: p.logoUrl,
          role_title: p.role_title,
        },
      },
    })
    return { error: error?.message }
  }

  const signOut = async () => {
    if (supabase) await supabase.auth.signOut()
    else {
      try {
        localStorage.removeItem(MOCK_KEY)
      } catch {
        /* ignore */
      }
    }
    setSession(null)
    setAccessToken(null)
  }

  const loginMock = (next: Session) => {
    setSession(next)
    try {
      localStorage.setItem(MOCK_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }

  const updateSession = (patch: Partial<Session>) => {
    setSession((prev) => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      if (!supabaseConfigured) {
        try {
          localStorage.setItem(MOCK_KEY, JSON.stringify(next))
        } catch {
          /* ignore */
        }
      }
      return next
    })
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        configured: supabaseConfigured,
        accessToken,
        signIn,
        signUp,
        signOut,
        loginMock,
        updateSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
