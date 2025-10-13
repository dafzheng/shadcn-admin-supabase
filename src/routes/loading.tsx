import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { HexagonLoader } from '@/components/hexagon-loader'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'
import { getAccountProfile } from '@/features/users/api/users'
import {
  useAuthStore,
  type AuthAccountProfile,
  type AuthActiveOrganization,
  type AuthOrganization,
} from '@/stores/auth-store'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

const accountProfileSchema = z
  .object({
    id: z.string(),
    full_name: z.string(),
    avatar_url: z.string().nullish(),
    email: z.string().nullish(),
    created_at: z.string(),
    updated_at: z.string(),
    status: z.string(),
  })
  .transform<AuthAccountProfile>((profile) => ({
    id: profile.id,
    fullName: profile.full_name.trim(),
    avatarUrl:
      typeof profile.avatar_url === 'string' && profile.avatar_url.trim().length > 0
        ? profile.avatar_url
        : null,
    email:
      typeof profile.email === 'string' && profile.email.trim().length > 0
        ? profile.email
        : null,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    status: profile.status,
  }))

function parseAccountProfile(raw: unknown): AuthAccountProfile | null {
  if (raw === null || raw === undefined) return null

  const candidates: unknown[] = []

  if (Array.isArray(raw)) {
    candidates.push(...raw)
  }

  if (typeof raw === 'object' && raw !== null) {
    candidates.push(raw)
    const record = raw as Record<string, unknown>
    if ('data' in record) {
      const data = record.data
      if (Array.isArray(data)) {
        candidates.push(...data)
      } else if (data !== null && data !== undefined) {
        candidates.push(data)
      }
    }
  } else {
    candidates.push(raw)
  }

  for (const candidate of candidates) {
    const result = accountProfileSchema.safeParse(candidate)
    if (result.success) {
      return result.data
    }
  }

  return null
}

export const Route = createFileRoute('/loading')({
  component: LoadingRoute,
  validateSearch: searchSchema,
})

function LoadingRoute() {
  const navigate = Route.useNavigate()
  const { redirect } = Route.useSearch()
  const { client: supabase } = useSupabaseAuth()
  const setUser = useAuthStore((state) => state.auth.setUser)

  useEffect(() => {
    sessionStorage.setItem('skipLoader', 'true')
    console.log('loading route', { redirect })
    const target = redirect ?? '/'
    let isCancelled = false

    // Resolve initial organization context before letting the user through.
    void (async () => {
      try {
        const [{ data: orgs, error: orgsError }, { data: active, error: activeError }] = await Promise.all([
          supabase.rpc('my_orgs'),
          supabase.rpc('get_active_org'),
        ])

        if (orgsError) {
          console.error('Failed to fetch organizations', orgsError)
        }
        if (activeError) {
          console.error('Failed to fetch active organization', activeError)
        }
        console.log('organization bootstrap', { orgs, active })

        const orgList = (orgs ?? null) as AuthOrganization[] | null
        const activeOrg = (Array.isArray(active) ? active[0] ?? null : active ?? null) as AuthActiveOrganization
        let accountProfile: AuthAccountProfile | null = null

        try {
          const profileResponse = await getAccountProfile()
          const parsedProfile = parseAccountProfile(profileResponse)
          if (parsedProfile) {
            accountProfile = parsedProfile
          } else {
            console.error('Account profile response missing expected fields')
          }
        } catch (profileError) {
          console.error('Failed to fetch account profile', profileError)
        }

        setUser((prev) => {
          if (!prev) return prev
          const profile = accountProfile ?? prev.profile ?? null
          const profileFullName = profile?.fullName?.trim()
          const profileAvatarUrl = profile?.avatarUrl ?? null

          return {
            ...prev,
            orgs: orgList,
            activeOrg,
            profile,
            fullName: profileFullName ? profileFullName : prev.fullName,
            avatarUrl: profileAvatarUrl ?? prev.avatarUrl ?? null,
          }
        })
      } catch (error) {
        console.error('Unexpected organization bootstrap failure', error)
      }

      if (!isCancelled) {
        navigate({ to: target, replace: true })
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [navigate, redirect, setUser, supabase])

  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-4'>
      <HexagonLoader message='Preparing your dashboard…' />
      <p className='text-muted-foreground text-sm sm:text-base'>
        We are syncing the latest data. This will only take a moment.
      </p>
    </div>
  )
}
