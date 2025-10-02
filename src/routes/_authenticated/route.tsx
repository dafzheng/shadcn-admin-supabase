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

  const redirect = router.state.location.href

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      navigate({
        to: '/sign-in',
        search: redirect ? { redirect } : undefined,
        replace: true,
      })
    }
  }, [isLoading, navigate, redirect, user])

  if (isLoading || !user) {
    return (
      <div className='flex h-svh items-center justify-center'>
        <Loader2 className='size-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  return <AuthenticatedLayout />
}
