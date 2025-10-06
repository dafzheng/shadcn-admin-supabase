import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createClient, type Session, type SupabaseClient, type User } from '@supabase/supabase-js'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'

type SupabaseAuthContextValue = {
  client: SupabaseClient
  session: Session | null
  user: User | null
  isLoading: boolean
  signInWithPassword: SupabaseClient['auth']['signInWithPassword']
  signUpWithPassword: SupabaseClient['auth']['signUp']
  signOut: SupabaseClient['auth']['signOut']
}

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(null)

type SupabaseAuthProviderProps = {
  url: string
  anonKey: string
  children: ReactNode
}

const authOptions = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
} satisfies Parameters<typeof createClient>[2]

export function SupabaseAuthProvider({ url, anonKey, children }: SupabaseAuthProviderProps) {
  const client = useMemo(() => createClient(url, anonKey, authOptions), [anonKey, url])
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { setUser: setStoreUser, setSession: setStoreSession, setAccessToken: setStoreAccessToken } =
    useAuthStore((state) => state.auth)

  // Sync the Supabase session into our zustand store so the rest of the UI stays in sync.
  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    client.auth
      .getSession()
      .then(({ data }) => {
        if (!isMounted) return
        setSession(data.session ?? null)
        setIsLoading(false)
      })
      .catch(() => {
        if (!isMounted) return
        setSession(null)
        setIsLoading(false)
      })

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null)
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [client])

  useEffect(() => {
    setStoreSession(session)
    setStoreAccessToken(session?.access_token ?? null)
    setStoreUser((previous) => mapSupabaseUser(session?.user ?? null, previous))
  }, [session, setStoreAccessToken, setStoreSession, setStoreUser])

  const signInWithPassword = useCallback<
    SupabaseClient['auth']['signInWithPassword']
  >(
    async (credentials) => {
      const result = await client.auth.signInWithPassword(credentials)
      if (result.data.session) {
        setSession(result.data.session)
      }
      return result
    },
    [client]
  )

  const signUpWithPassword = useCallback<SupabaseClient['auth']['signUp']>(
    async (credentials) => {
      const result = await client.auth.signUp(credentials)
      if (result.data.session) {
        setSession(result.data.session)
      }
      return result
    },
    [client]
  )

  const signOut = useCallback<SupabaseClient['auth']['signOut']>(async (options) => {
    const response = await client.auth.signOut(options)
    setSession(null)
    sessionStorage.removeItem('skipLoader')
    return response
  }, [client])

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('skipLoader')
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  const value = useMemo<SupabaseAuthContextValue>(
    () => ({
      client,
      session,
      user: session?.user ?? null,
      isLoading,
      signInWithPassword,
      signUpWithPassword,
      signOut,
    }),
    [client, isLoading, session, signInWithPassword, signOut, signUpWithPassword]
  )

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  )
}

function mapSupabaseUser(user: User | null, previous: AuthUser | null): AuthUser | null {
  if (!user) return null

  const metadata = user.user_metadata ?? {}
  const fullName =
    metadata.full_name ??
    metadata.name ??
    metadata.display_name ??
    metadata.user_name ??
    metadata.preferred_username ??
    null
  const avatarUrl =
    metadata.avatar_url ?? metadata.picture ?? metadata.avatar ?? metadata.image_url ?? null

  const shouldPreserveOrgData = previous?.id === user.id

  return {
    id: user.id,
    email: user.email ?? null,
    fullName,
    avatarUrl,
    orgs: shouldPreserveOrgData ? previous?.orgs ?? null : null,
    activeOrg: shouldPreserveOrgData ? previous?.activeOrg ?? null : null,
  }
}

export function useSupabaseAuth() {
  const context = useContext(SupabaseAuthContext)
  if (!context) {
    throw new Error('useSupabaseAuth must be used within SupabaseAuthProvider')
  }
  return context
}

export function SupabaseSignedIn({ children }: { children: ReactNode }) {
  const { user, isLoading } = useSupabaseAuth()
  if (isLoading || !user) return null
  return <>{children}</>
}
