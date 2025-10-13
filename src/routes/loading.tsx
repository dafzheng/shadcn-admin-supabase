import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { HexagonLoader } from '@/components/hexagon-loader'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'
import { getAccountProfile } from '@/features/users/api/users'
import { parseAccountProfile } from '@/features/users/utils/account-profile'
import {
  useAuthStore,
  type AuthAccountProfile,
  type AuthActiveOrganization,
  type AuthOrganization,
  type AuthUser,
} from '@/stores/auth-store'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/loading')({
  component: LoadingRoute,
  validateSearch: searchSchema,
})

function LoadingRoute() {
  const navigate = Route.useNavigate()
  const { redirect } = Route.useSearch()
  const { client: supabase, user: supabaseUser } = useSupabaseAuth()
  const setUser = useAuthStore((state) => state.auth.setUser)

  useEffect(() => {
    if (!supabaseUser) return

    sessionStorage.setItem('skipLoader', 'true')
    console.log('loading route', { redirect })
    const target = redirect ?? '/'
    let isCancelled = false

    // Resolve initial organization context before letting the user through.
    void (async () => {
      let accountProfile: AuthAccountProfile | null = null
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
          const baseUser: AuthUser | null =
            prev ??
            (supabaseUser
              ? {
                  id: supabaseUser.id,
                  email: supabaseUser.email ?? null,
                  fullName:
                    typeof supabaseUser.user_metadata?.full_name === 'string'
                      ? supabaseUser.user_metadata.full_name
                      : prev?.fullName ?? null,
                  avatarUrl:
                    typeof supabaseUser.user_metadata?.avatar_url === 'string'
                      ? supabaseUser.user_metadata.avatar_url
                      : prev?.avatarUrl ?? null,
                  orgs: null,
                  activeOrg: null,
                  profile: null,
                }
              : null)

          if (!baseUser) return baseUser

          const profile = accountProfile ?? baseUser.profile ?? null
          const profileFullName = profile?.fullName?.trim()
          const profileAvatarUrl = profile?.avatarUrl ?? null

          return {
            ...baseUser,
            orgs: orgList ?? baseUser.orgs ?? null,
            activeOrg: activeOrg ?? baseUser.activeOrg ?? null,
            profile,
            fullName: profileFullName ? profileFullName : baseUser.fullName ?? null,
            avatarUrl: profileAvatarUrl ?? baseUser.avatarUrl ?? null,
          }
        })

      } catch (error) {
        console.error('Unexpected organization bootstrap failure', error)
      }

      if (!isCancelled) {
        if (!accountProfile || accountProfile.fullName.length === 0) {
          navigate({
            to: '/complete-profile',
            search: () => (target && target !== '/' ? { redirect: target } : {}),
            replace: true,
          })
        } else {
          navigate({ to: target, replace: true })
        }
      }
    })()

    return () => {
      isCancelled = true
    }
  }, [navigate, redirect, setUser, supabase, supabaseUser])

  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-4'>
      <HexagonLoader message='Preparing your dashboard…' />
      <p className='text-muted-foreground text-sm sm:text-base'>
        We are syncing the latest data. This will only take a moment.
      </p>
    </div>
  )
}
