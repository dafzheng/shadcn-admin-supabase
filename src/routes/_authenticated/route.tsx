import { useEffect } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'

export const Route = createFileRoute('/_authenticated')({
  component: SupabaseProtectedLayout,
})

function SupabaseProtectedLayout() {
  const navigate = Route.useNavigate()
  const router = useRouter()
  const { user, isLoading } = useSupabaseAuth()

  const { pathname, search, hash } = router.state.location
  const hasSkipLoaderFlag =
    typeof window !== 'undefined' && sessionStorage.getItem('skipLoader') === 'true'
  const searchString =
    typeof search === 'string'
      ? search
      : (() => {
          if (!search) return ''
          try {
            const params = new URLSearchParams()
            Object.entries(search as Record<string, unknown>).forEach(([key, value]) => {
              if (value == null) return
              params.set(key, String(value))
            })
            const serialized = params.toString()
            return serialized ? `?${serialized}` : ''
          } catch (error) {
            console.warn('Failed to serialize search params', error)
            return ''
          }
        })()
  const redirect = `${pathname}${searchString}${hash ?? ''}`

  useEffect(() => {
    console.log('auth route effect', { isLoading, user, redirect })
    if (isLoading) return

    if (!user) {
      // Honor the sign-out flag so we do not carry a stale redirect back onto the sign-in URL.
      const shouldSkipRedirect = sessionStorage.getItem('skipAuthRedirect') === 'true'
      if (shouldSkipRedirect) {
        sessionStorage.removeItem('skipAuthRedirect')
        navigate({ to: '/sign-in', replace: true })
        return
      }
      if (redirect) {
        navigate({ to: '/sign-in', search: () => ({ redirect }), replace: true })
      } else {
        navigate({ to: '/sign-in', replace: true })
      }
      return
    }

    if (!hasSkipLoaderFlag) {
      const target = redirect || '/'
      console.log('redirecting to loader', target)
      if (!target.startsWith('/loading')) {
        navigate({
          to: '/loading',
          search: () => ({ redirect: target }),
          replace: true,
        })
      }
    }
  }, [hasSkipLoaderFlag, isLoading, navigate, redirect, user])

  if (isLoading || !user || !hasSkipLoaderFlag) {
    return (
      <div className='bg-background text-muted-foreground flex min-h-svh items-center justify-center'>
        <Loader2 className='size-6 animate-spin' aria-hidden='true' />
      </div>
    )
  }

  return <AuthenticatedLayout />
}
