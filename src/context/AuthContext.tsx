import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { UserProfile } from '../types'
import { hasSupabase, supabase } from '../lib/supabase'

interface AuthValue {
  user: UserProfile | null
  loading: boolean
  demoMode: boolean
  loginDemo: (email: string, name?: string) => void
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (name: string, email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)
const DEMO_KEY = 'organiza_demo_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const demoMode = !hasSupabase || import.meta.env.VITE_DEMO_MODE === 'true'

  const getProfile = async (id: string, email: string) => {
    if (!supabase) return
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
    setUser(data ? {
      id: data.id,
      name: data.name || email.split('@')[0],
      email,
      access_status: data.access_status || 'pending',
      plan: data.plan || 'free',
      access_until: data.access_until
    } : null)
  }

  useEffect(() => {
    if (demoMode) {
      const saved = localStorage.getItem(DEMO_KEY)
      if (saved) setUser(JSON.parse(saved))
      setLoading(false)
      return
    }
    supabase!.auth.getSession().then(async ({ data }) => {
      const authUser = data.session?.user
      if (authUser?.email) await getProfile(authUser.id, authUser.email)
      setLoading(false)
    })
    const { data: listener } = supabase!.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user.email) await getProfile(session.user.id, session.user.email)
      else setUser(null)
    })
    return () => listener.subscription.unsubscribe()
  }, [demoMode])

  const loginDemo = (email: string, name = 'Cliente Demo') => {
    const profile: UserProfile = { id: 'demo-user', name, email, access_status: 'active', plan: 'premium' }
    localStorage.setItem(DEMO_KEY, JSON.stringify(profile))
    setUser(profile)
  }

  const signIn = async (email: string, password: string) => {
    if (demoMode) { loginDemo(email); return null }
    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    return error?.message || null
  }

  const signUp = async (name: string, email: string, password: string) => {
    if (demoMode) { loginDemo(email, name); return null }
    const { error } = await supabase!.auth.signUp({ email, password, options: { data: { name } } })
    return error?.message || null
  }

  const signOut = async () => {
    if (demoMode) localStorage.removeItem(DEMO_KEY)
    else await supabase!.auth.signOut()
    setUser(null)
  }

  const refreshProfile = async () => {
    if (!supabase) return
    const { data } = await supabase.auth.getUser()
    if (data.user?.email) await getProfile(data.user.id, data.user.email)
  }

  const value = useMemo(() => ({ user, loading, demoMode, loginDemo, signIn, signUp, signOut, refreshProfile }), [user, loading, demoMode])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
