import { useEffect, useMemo, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ShieldCheck, MailCheck, AlertCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'
import { updateAccountProfile } from '@/features/users/api/users'

// Schema used when Supabase sends a recovery link (e.g. password reset) that
// requires the visitor to choose a new password before continuing.
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        path: ['confirmPassword'],
        code: 'custom',
        message: 'Passwords do not match',
      })
    }
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

type EmailLinkSearch = {
  redirect?: string
}

type EmailLinkParams = {
  type: string
  code: string | null
  accessToken: string | null
  refreshToken: string | null
  token: string | null
  email: string | null
}

type HandlerState =
  | { status: 'checking' }
  | { status: 'password' }
  | { status: 'redirecting'; message: string }
  | { status: 'error'; message: string }
  | { status: 'invite'; email: string | null; fullName: string | null }

const inviteSchema = z
  .object({
    fullName: z.string().min(1, 'Please enter your full name'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(128, 'Password is too long'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        path: ['confirmPassword'],
        code: 'custom',
        message: 'Passwords do not match',
      })
    }
  })

type InviteFormValues = z.infer<typeof inviteSchema>

export const Route = createFileRoute('/(auth)/links-callback')({
  validateSearch: (search): EmailLinkSearch => ({
    redirect: typeof search?.redirect === 'string' ? search.redirect : undefined,
  }),
  component: EmailLinkHandler,
})

function EmailLinkHandler() {
  const navigate = Route.useNavigate()
  const search = Route.useSearch()
  const { client } = useSupabaseAuth()
  const [state, setState] = useState<HandlerState>({ status: 'checking' })
  const paramsRef = useRef<EmailLinkParams | null>(null)

  // Once the link is processed we redirect to the requested destination (defaults to dashboard).
  const redirectTarget = useMemo(() => search.redirect ?? '/', [search.redirect])

  useEffect(() => {
    // Supabase may append credentials in either the hash fragment or the query string.
    const parseParams = (): EmailLinkParams => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const queryParams = new URLSearchParams(window.location.search)

      const getParam = (key: string) => hashParams.get(key) ?? queryParams.get(key)

      return {
        type: (getParam('type') ?? '').toLowerCase(),
        code: getParam('code'),
        accessToken: getParam('access_token'),
        refreshToken: getParam('refresh_token'),
        token: getParam('token') ?? getParam('token_hash'),
        email: getParam('email'),
      }
    }

    const getParams = () => {
      if (paramsRef.current) {
        return paramsRef.current
      }

      const parsed = parseParams()
      paramsRef.current = parsed

      if (window.location.hash) {
        window.history.replaceState(
          {},
          '',
          `${window.location.pathname}${window.location.search}`
        )
      }

      return parsed
    }

    const handle = async () => {
      const { type, code, accessToken, refreshToken, token, email } = getParams()

      if (!type) {
        setState({ status: 'error', message: 'Missing link type. Please request a new email.' })
        return
      }

      // Links can include either an exchange code or direct access/refresh tokens; support both styles.
      const ensureSession = async () => {
        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (accessToken && refreshToken) {
          const { error } = await client.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) throw error
        } else {
          throw new Error('Missing credentials in the redirect URL.')
        }
      }

      try {
        switch (type) {
          case 'recovery':
            await ensureSession()
            setState({ status: 'password' })
            break
          case 'magiclink':
          case 'signup':
          case 'email_change':
          case 'email_change_current':
          case 'email_change_new':
          case 'verification':
            await ensureSession()
            toast.success('Email verified successfully. Redirecting...')
            setState({ status: 'redirecting', message: 'Email verified. Redirecting...' })
            setTimeout(() => {
              navigate({ to: redirectTarget, replace: true })
            }, 1200)
            break
          case 'invite': {
            if (code || (accessToken && refreshToken)) {
              await ensureSession()
            } else if (token) {
              const { error } = await client.auth.verifyOtp({
                token,
                type: 'invite',
                email: email ?? undefined,
              })
              if (error) throw error
            } else {
              throw new Error('Invite link is missing credentials. Please request a new invite.')
            }
            const { data, error } = await client.auth.getUser()
            if (error) throw error
            setState({
              status: 'invite',
              email: data.user?.email ?? null,
              fullName: (data.user?.user_metadata?.full_name as string | null) ?? null,
            })
            break
          }
          default:
            setState({
              status: 'error',
              message: `Unsupported link type: ${type}. Please request a fresh link.`,
            })
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
        const message =
          error instanceof Error ? error.message : 'We could not process this link. Try again.'
        setState({ status: 'error', message })
      }
    }

    void handle()
  }, [client, navigate, redirectTarget])

  if (state.status === 'checking') {
    return (
      <CenteredCard
        icon={<Loader2 className='mx-auto mb-4 size-8 animate-spin text-primary' />}
        title='Verifying link…'
        description='Please wait while we confirm the action associated with your email.'
      />
    )
  }

  if (state.status === 'password') {
    return <ResetPasswordView onSuccess={() => handleResetSuccess(navigate, redirectTarget, client)} />
  }

  if (state.status === 'invite') {
    return (
      <InviteCompletionView
        email={state.email}
        initialFullName={state.fullName}
        onCompleted={() => {
          toast.success('Account details saved. Redirecting you now…')
          navigate({ to: redirectTarget, replace: true })
        }}
      />
    )
  }

  if (state.status === 'redirecting') {
    return (
      <CenteredCard
        icon={<MailCheck className='mx-auto mb-4 size-8 text-primary' />}
        title={state.message}
        description='You will be redirected automatically.'
        footer={
          <Button onClick={() => navigate({ to: redirectTarget, replace: true })}>
            Continue now
          </Button>
        }
      />
    )
  }

  return (
    <CenteredCard
      icon={<AlertCircle className='mx-auto mb-4 size-8 text-destructive' />}
      title='Link error'
      description={state.message}
      footer={
        <div className='flex justify-center gap-2'>
          <Button variant='outline' onClick={() => navigate({ to: '/sign-in' })}>
            Go to sign in
          </Button>
          <Button onClick={() => navigate({ to: '/sign-up' })}>Create account</Button>
        </div>
      }
    />
  )
}

function InviteCompletionView({
  email,
  initialFullName,
  onCompleted,
}: {
  email: string | null
  initialFullName: string | null
  onCompleted: () => void
}) {
  const { client } = useSupabaseAuth()
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      fullName: initialFullName ?? '',
      password: '',
      confirmPassword: '',
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    form.reset({
      fullName: initialFullName ?? '',
      password: '',
      confirmPassword: '',
    })
  }, [form, initialFullName])

  const submit = async (values: InviteFormValues) => {
    setIsSubmitting(true)
    const { error } = await client.auth.updateUser({
      password: values.password,
      // data: { full_name: values.fullName },
    })

    const { data, updateError } = await updateAccountProfile(values.fullName)
    setIsSubmitting(false)

    if (error) {
      toast.error(error.message)
      return
    }

    if (updateError) {
      toast.error(updateError.message)
      return
    }

    onCompleted()
  }

  return (
    <div className='flex min-h-svh items-center justify-center px-4 py-10'>
      <Card className='w-full max-w-lg shadow-lg'>
        <CardHeader className='space-y-3 text-center'>
          <Sparkles className='mx-auto size-10 text-primary' />
          <CardTitle className='text-2xl font-semibold'>Finish setting up your account</CardTitle>
          <CardDescription>
            {email ? (
              <span>
                You are joining as <span className='font-medium'>{email}</span>. Choose a password
                and tell us who you are.
              </span>
            ) : (
              'Choose a password and tell us who you are.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className='space-y-4' onSubmit={form.handleSubmit(submit)}>
              <FormField
                control={form.control}
                name='fullName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input autoComplete='name' placeholder='Jane Doe' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete='new-password' placeholder='********' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm password</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete='new-password' placeholder='********' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className='w-full' type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className='flex items-center justify-center gap-2'>
                    <Loader2 className='size-4 animate-spin' />
                    Saving…
                  </span>
                ) : (
                  'Save and continue'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className='flex flex-col gap-2 text-center text-sm text-muted-foreground'>
          <p>
            Passwords must be at least 8 characters. You can update these details later from your
            profile settings.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}

function handleResetSuccess(
  navigate: ReturnType<typeof Route.useNavigate>,
  redirectTarget: string,
  client: ReturnType<typeof useSupabaseAuth>['client']
) {
  void (async () => {
    toast.success('Password updated. Please sign in with your new credentials.')
    const { error } = await client.auth.signOut()
    if (error) {
      toast.error(error.message)
      return
    }
    navigate({ to: '/sign-in', replace: true, search: { redirect: redirectTarget } })
  })()
}

function ResetPasswordView({
  onSuccess,
}: {
  onSuccess: () => void
}) {
  const { client } = useSupabaseAuth()
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submit = async (values: PasswordFormValues) => {
    // At this point a valid session exists, so updating the password is safe.
    setIsSubmitting(true)
    const { error } = await client.auth.updateUser({ password: values.password })
    setIsSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    form.reset()
    onSuccess()
  }

  return (
    <Card className='mx-auto mt-10 w-full max-w-md'>
      <CardHeader className='space-y-2 text-center'>
        <ShieldCheck className='mx-auto size-10 text-primary' />
        <CardTitle className='text-2xl font-semibold'>Set a new password</CardTitle>
        <CardDescription>
          Choose a strong password to secure your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(submit)}>
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input type='password' autoComplete='new-password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input type='password' autoComplete='new-password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className='w-full' type='submit' disabled={isSubmitting}>
              {isSubmitting ? (
                <span className='flex items-center justify-center gap-2'>
                  <Loader2 className='size-4 animate-spin' />
                  Saving…
                </span>
              ) : (
                'Save password'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function CenteredCard({
  title,
  description,
  icon,
  footer,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  icon?: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className='flex min-h-svh items-center justify-center px-4 py-10'>
      <Card className='w-full max-w-md text-center'>
        <CardHeader className='space-y-2'>
          {icon}
          <CardTitle>{title}</CardTitle>
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
        {footer ? <CardFooter className='justify-center'>{footer}</CardFooter> : null}
      </Card>
    </div>
  )
}
