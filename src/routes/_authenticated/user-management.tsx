import { useEffect, useMemo, useState } from 'react'
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { Loader2, LogOut, User2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { LearnMore } from '@/components/learn-more'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersDialogs } from '@/features/users/components/users-dialogs'
import { UsersPrimaryButtons } from '@/features/users/components/users-primary-buttons'
import { UsersProvider } from '@/features/users/components/users-provider'
import { UsersTable } from '@/features/users/components/users-table'
import { users } from '@/features/users/data/users'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'

export const Route = createFileRoute('/_authenticated/user-management')({
  component: UserManagement,
})

function UserManagement() {
  // Mirror the existing user-management showcase, but guard it with Supabase auth.
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { user, isLoading } = useSupabaseAuth()
  const [opened, setOpened] = useState(true)

  if (isLoading) {
    return (
      <div className='flex h-svh items-center justify-center'>
        <Loader2 className='size-8 animate-spin' />
      </div>
    )
  }

  if (!user) {
    return <Unauthorized />
  }

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <AccountDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>User List</h2>
            <div className='flex gap-1'>
              <p className='text-muted-foreground'>
                Manage your users and their roles here.
              </p>
              <LearnMore
                open={opened}
                onOpenChange={setOpened}
                contentProps={{ side: 'right' }}
              >
                <p>
                  This is the same as{' '}
                  <Link
                    to='/users'
                    className='text-blue-500 underline decoration-dashed underline-offset-2'
                  >
                    '/users'
                  </Link>
                </p>

                <p className='mt-4'>
                  You can sign out via the user menu in the top-right corner of
                  the page.
                </p>
              </LearnMore>
            </div>
          </div>
          <UsersPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <UsersTable data={users} navigate={navigate} search={search} />
        </div>
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}

const COUNTDOWN = 5 // Countdown seconds

function Unauthorized() {
  const navigate = useNavigate()
  const { history } = useRouter()

  const [opened, setOpened] = useState(true)
  const [cancelled, setCancelled] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN)

  // Set and run the countdown conditionally
  useEffect(() => {
    if (cancelled || opened) return
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [cancelled, opened])

  // Navigate to sign-in page when countdown hits 0
  useEffect(() => {
    if (countdown > 0) return
    navigate({ to: '/sign-in' })
  }, [countdown, navigate])

  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>401</h1>
        <span className='font-medium'>Unauthorized Access</span>
        <p className='text-muted-foreground text-center'>
          You must be authenticated with Supabase to access this resource.
          <sup>
            <LearnMore open={opened} onOpenChange={setOpened}>
              <p>
                This is the same as{' '}
                <Link
                  to='/users'
                  className='text-blue-500 underline decoration-dashed underline-offset-2'
                >
                  '/users'
                </Link>
                .{' '}
              </p>
              <p>
                Sign in using the Supabase authentication pages before visiting
                this route.
              </p>
            </LearnMore>
          </sup>
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate({ to: '/sign-in' })}>
            Sign in
          </Button>
        </div>
        <div className='mt-4 h-8 text-center'>
          {!cancelled && !opened && (
            <>
              <p>
                {countdown > 0
                  ? `Redirecting to Sign In page in ${countdown}s`
                  : `Redirecting...`}
              </p>
              <Button variant='link' onClick={() => setCancelled(true)}>
                Cancel Redirect
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AccountDropdown() {
  const { user, signOut } = useSupabaseAuth()
  const navigate = Route.useNavigate()

  const email = user?.email ?? 'Unknown user'
  const initials = useMemo(() => email.charAt(0).toUpperCase(), [email])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='icon' className='rounded-full'>
          <Avatar className='size-8'>
            <AvatarFallback className='text-xs'>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuLabel>
          <div className='flex items-center gap-2'>
            <User2 className='size-4' />
            <div className='flex flex-col'>
              <span className='text-sm font-medium'>Signed in</span>
              <span className='text-xs text-muted-foreground'>{email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='text-destructive focus:text-destructive'
          onSelect={async () => {
            const { error } = await signOut()
            if (error) {
              toast.error(error.message)
              return
            }
            toast.success('Signed out successfully')
            navigate({ to: '/sign-in' })
          }}
        >
          <LogOut className='mr-2 size-4' /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
