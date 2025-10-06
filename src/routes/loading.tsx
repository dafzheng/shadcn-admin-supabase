import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { HexagonLoader } from '@/components/hexagon-loader'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'
import { useAuthStore, type AuthActiveOrganization, type AuthOrganization } from '@/stores/auth-store'

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

        setUser((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            orgs: orgList,
            activeOrg,
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
  }, [navigate, redirect, supabase])

  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-4'>
      <HexagonLoader message='Preparing your dashboard…' />
      <p className='text-muted-foreground text-sm sm:text-base'>
        We are syncing the latest data. This will only take a moment.
      </p>
    </div>
  )
}
