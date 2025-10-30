import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import type { Factor } from '@supabase/supabase-js'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { IconGoogle } from '@/assets/brand-icons'
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const formSchema = z.object({
  email: z.email({
    error: (issue) => (issue.input === '' ? 'Please enter your email' : undefined),
  }),
  password: z
    .string()
    .min(1, 'Please enter your password')
    .min(6, 'Password must be at least 6 characters long'),
})

type MfaState = {
  factor: Factor
  challengeId: string | null
}

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const navigate = useNavigate()
  const { client: supabase, signInWithPassword, signInWithOAuth, isLoading, session } =
    useSupabaseAuth()
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)
  const [mfaState, setMfaState] = useState<MfaState | null>(null)
  const [mfaOtp, setMfaOtp] = useState('')
  const [isMfaVerifying, setIsMfaVerifying] = useState(false)
  const [isMfaDialogOpen, setIsMfaDialogOpen] = useState(false)
  const [isRedirectBlocked, setIsRedirectBlocked] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const isSubmitting = form.formState.isSubmitting
  const isMfaStep = isMfaDialogOpen && Boolean(mfaState)
  const isSignInBusy = isSubmitting || isLoading
  const factorLabel = mfaState?.factor?.friendly_name?.trim() ?? null

  // If the user already has an active Supabase session, skip the form entirely.
  useEffect(() => {
    if (!session) return
    if (isRedirectBlocked || isMfaDialogOpen) return
    const target = redirectTo ?? '/'
    navigate({ to: '/loading', search: () => ({ redirect: target }), replace: true })
  }, [isMfaDialogOpen, isRedirectBlocked, navigate, redirectTo, session])

  const issueChallenge = useCallback(
    async (factor: Factor, options?: { showInfo?: boolean }): Promise<string | null> => {
      const { data, error } = await supabase.auth.mfa.challenge({ factorId: factor.id })
      if (error || !data) {
        const message =
          error?.message ?? 'Failed to start the verification challenge. Please try again.'
        toast.error(message)
        setMfaState(null)
        setMfaOtp('')
        setIsRedirectBlocked(false)
        return null
      }
      setMfaState({ factor, challengeId: data.id })
      setMfaOtp('')
      setIsMfaDialogOpen(true)
      if (options?.showInfo) {
        toast.info('Enter the 6-digit code from your authenticator app to continue.')
      }
      return data.id
    },
    [supabase]
  )

  const resetMfaFlow = useCallback(
    async ({ signOut, unblock = true }: { signOut?: boolean; unblock?: boolean } = {}) => {
      setIsMfaDialogOpen(false)
      setMfaOtp('')
      setMfaState(null)
      setIsMfaVerifying(false)
      if (signOut) {
        try {
          await supabase.auth.signOut({ scope: 'local' })
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[MFA] failed to sign out after cancellation', error)
        }
      }
      if (unblock) {
        setIsRedirectBlocked(false)
      }
    },
    [supabase]
  )

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsRedirectBlocked(true)
    setMfaState(null)
    setMfaOtp('')

    const result = await signInWithPassword({
      email: values.email,
      password: values.password,
    })

    const mfaPayload =
      (result.data as unknown as { mfa?: { factors?: Factor[] } } | null)?.mfa ?? null
    // eslint-disable-next-line no-console
    console.info('[MFA] signInWithPassword result', result)
    // eslint-disable-next-line no-console
    console.info('[MFA] result.data', result.data)
    // eslint-disable-next-line no-console
    console.info('[MFA] result.error', result.error)
    // eslint-disable-next-line no-console
    console.info('[MFA] result.error?.code', (result.error as { code?: unknown } | null)?.code)
    // eslint-disable-next-line no-console
    console.info('[MFA] result.error?.status', (result.error as { status?: unknown } | null)?.status)
    // eslint-disable-next-line no-console
    console.info('[MFA] result.error?.data', (result.error as { data?: unknown } | null)?.data)
    // eslint-disable-next-line no-console
    console.info('[MFA] extracted factors (payload)', mfaPayload?.factors)

    let availableFactors: Factor[] = mfaPayload?.factors ?? []

    if (!availableFactors.length) {
      const factorsFromUser =
        ((result.data?.user as { factors?: Factor[] } | null)?.factors ?? []) as Factor[]
      // eslint-disable-next-line no-console
      console.info('[MFA] factors from user object', factorsFromUser)
      availableFactors = factorsFromUser
    }

    if (!availableFactors.length) {
      const { data: listData, error: listError } = await supabase.auth.mfa.listFactors()
      // eslint-disable-next-line no-console
      console.info('[MFA] listFactors response', { data: listData, error: listError })
      if (!listError) {
        const totpFactors = listData?.totp ?? []
        availableFactors = totpFactors.length > 0 ? totpFactors : listData?.all ?? []
      }
    }

    const totpFactor =
      availableFactors.find((factor) => factor.factor_type === 'totp' && factor.status === 'verified') ??
      availableFactors.find((factor) => factor.factor_type === 'totp') ??
      null

    // eslint-disable-next-line no-console
    console.info('[MFA] resolved totpFactor', totpFactor)

    if (totpFactor) {
      // eslint-disable-next-line no-console
      console.info('[MFA] triggering challenge for factor', {
        factorId: totpFactor.id,
        type: totpFactor.factor_type,
        status: totpFactor.status,
      })
      await issueChallenge(totpFactor, { showInfo: true })
      return
    }

    if (availableFactors.length > 0) {
      setIsRedirectBlocked(false)
      toast.error('Two-factor authentication is required, but no valid factor was found.')
      return
    }

    if (result.error) {
      setIsRedirectBlocked(false)
      // eslint-disable-next-line no-console
      console.warn('[MFA] signInWithPassword error (no factors)', result.error)
      toast.error(result.error.message)
      return
    }

    setIsRedirectBlocked(false)
    toast.success('Signed in successfully')
    const target = redirectTo ?? '/'
    navigate({ to: '/loading', search: () => ({ redirect: target }) })
  }

  const handleGoogleSignIn = useCallback(async () => {
    if (isOAuthLoading || isMfaStep) return

    try {
      setIsOAuthLoading(true)
      const target = redirectTo ?? '/'
      let redirectUrl: string | undefined
      if (typeof window !== 'undefined') {
        const url = new URL('/loading', window.location.origin)
        if (target && target !== '/') {
          url.searchParams.set('redirect', target)
        }
        redirectUrl = url.toString()
        // redirectUrl = 'https://sb.leads.salesbay.ai/auth/v1/callback'
      }

      const { error } = await signInWithOAuth({
        provider: 'google',
        options: redirectUrl
          ? {
              redirectTo: redirectUrl,
            }
          : undefined,
      })

      if (error) {
        toast.error(error.message)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start Google sign in'
      toast.error(message)
    } finally {
      // Supabase will redirect on success, but reset the state in case we remain on the page.
      setIsOAuthLoading(false)
    }
  }, [isOAuthLoading, isMfaStep, redirectTo, signInWithOAuth])

  const handleCancelMfa = useCallback(() => {
    void resetMfaFlow({ signOut: true })
  }, [resetMfaFlow])

  const handleMfaVerify = useCallback(async () => {
    if (!mfaState) return
    const sanitized = mfaOtp.replace(/\s+/g, '')
    // eslint-disable-next-line no-console
    console.info('[MFA] verifying code', sanitized)
    if (!/^\d{6}$/.test(sanitized)) {
      toast.error('Please enter the 6-digit code from your authenticator app.')
      return
    }

    setIsMfaVerifying(true)
    try {
      let challengeId = mfaState.challengeId
      if (!challengeId) {
        challengeId = await issueChallenge(mfaState.factor)
        if (!challengeId) return
      }

      const { data, error } = await supabase.auth.mfa.verify({
        factorId: mfaState.factor.id,
        challengeId,
        code: sanitized,
      })

      if (error || !data) {
        const code = (error as { code?: string } | null)?.code
        const message =
          code === 'mfa_challenge_expired'
            ? 'The verification code expired. A new challenge has been issued.'
            : code === 'mfa_verification_failed'
              ? 'That code did not match. Please try again.'
              : error?.message ?? 'We could not verify that code. Please try again.'
        toast.error(message)
        await issueChallenge(mfaState.factor)
        return
      }

      toast.success('Signed in successfully')
      await resetMfaFlow({ unblock: false })
      const target = redirectTo ?? '/'
      navigate({ to: '/loading', search: () => ({ redirect: target }) })
      setIsRedirectBlocked(false)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify the code.'
      toast.error(message)
    } finally {
      setIsMfaVerifying(false)
    }
  }, [handleCancelMfa, issueChallenge, mfaOtp, mfaState, navigate, redirectTo, supabase])

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='name@example.com' {...field} disabled={isMfaStep} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} disabled={isMfaStep} />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='text-muted-foreground absolute end-0 -top-0.5 text-sm font-medium hover:opacity-75'
              >
                Forgot password?
              </Link>
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isSignInBusy || isMfaStep}>
          {isSignInBusy ? <Loader2 className='animate-spin' /> : <LogIn />}
          Sign in
        </Button>
        <Button
          type='button'
          variant='outline'
          className='mt-1 flex items-center justify-center gap-2'
          disabled={isSignInBusy || isOAuthLoading || isMfaStep}
          onClick={handleGoogleSignIn}
        >
          {isOAuthLoading ? <Loader2 className='size-4 animate-spin' /> : null}
          {!isOAuthLoading ? <IconGoogle className='size-4' /> : null}
          Continue with Google
        </Button>
      </form>
      <Dialog
        open={isMfaDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleCancelMfa()
          }
        }}
      >
        <DialogContent className='space-y-4'>
          <DialogHeader>
            <DialogTitle className='flex items-center gap-2'>
              <ShieldCheck className='size-4' />
              Confirm with your authenticator
            </DialogTitle>
            <DialogDescription>
              Enter the 6-digit code from{' '}
              {factorLabel ? (
                <span className='text-foreground font-medium'>{factorLabel}</span>
              ) : (
                'your authenticator app'
              )}{' '}
              to finish signing in.
            </DialogDescription>
          </DialogHeader>
          <InputOTP
            maxLength={6}
            value={mfaOtp}
            onChange={setMfaOtp}
            containerClassName='justify-center sm:[&>[data-slot="input-otp-group"]>div]:w-12'
            autoFocus
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={handleCancelMfa} disabled={isMfaVerifying}>
              Cancel
            </Button>
            <Button
              type='button'
              onClick={handleMfaVerify}
              disabled={isMfaVerifying || mfaOtp.replace(/\s+/g, '').length !== 6}
            >
              {isMfaVerifying ? <Loader2 className='mr-2 size-4 animate-spin' /> : null}
              Verify code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  )
}
