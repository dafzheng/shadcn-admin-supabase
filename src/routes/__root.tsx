import { type QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'
import { SupabaseAuthProvider } from '@/features/auth/supabase/provider'
import { MissingSupabaseConfig } from '@/features/auth/supabase/missing-config'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: () => {
    const devTools =
      import.meta.env.MODE === 'development' ? (
        <>
          <ReactQueryDevtools buttonPosition='bottom-left' />
          <TanStackRouterDevtools position='bottom-right' />
        </>
      ) : null

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return (
        <>
          <NavigationProgress />
          <MissingSupabaseConfig />
          <Toaster duration={5000} />
          {devTools}
        </>
      )
    }

    return (
      <SupabaseAuthProvider url={SUPABASE_URL} anonKey={SUPABASE_ANON_KEY}>
        <NavigationProgress />
        <Outlet />
        <Toaster duration={5000} />
        {devTools}
      </SupabaseAuthProvider>
    )
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
