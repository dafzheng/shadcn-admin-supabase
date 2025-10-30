import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import type { Factor } from '@supabase/supabase-js'
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import { toast } from 'sonner'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp'

type PendingEnrollment = {
  factorId: string
  qrCode: string
  secret: string
}

export function TwoFactorSection() {
  const { client: supabase } = useSupabaseAuth()
  const [totpFactor, setTotpFactor] = useState<Factor | null>(null)
  const [isStatusLoading, setIsStatusLoading] = useState(true)

  const [isEnableDialogOpen, setIsEnableDialogOpen] = useState(false)
  const [isPreparingEnrollment, setIsPreparingEnrollment] = useState(false)
  const [pendingEnrollment, setPendingEnrollment] = useState<PendingEnrollment | null>(null)
  const [enableOtpValue, setEnableOtpValue] = useState('')
  const [isEnableVerifying, setIsEnableVerifying] = useState(false)

  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false)
  const [disableOtp, setDisableOtp] = useState('')
  const [disableChallengeId, setDisableChallengeId] = useState<string | null>(null)
  const [isIssuingDisableChallenge, setIsIssuingDisableChallenge] = useState(false)
  const [isDisableVerifying, setIsDisableVerifying] = useState(false)

  const unverifiedFactorIdRef = useRef<string | null>(null)
  const disableFactorRef = useRef<Factor | null>(null)

  const refreshFactors = useCallback(async () => {
    setIsStatusLoading(true)
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) {
        toast.error(error.message ?? 'Failed to load two-factor status.')
        setTotpFactor(null)
        return
      }
      const nextTotp = data?.totp?.[0] ?? null
      setTotpFactor(nextTotp ?? null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load two-factor status.'
      toast.error(message)
      setTotpFactor(null)
    } finally {
      setIsStatusLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void refreshFactors()
  }, [refreshFactors])

  const isEnabled = Boolean(totpFactor)
  const isEnableBusy = isPreparingEnrollment || isEnableVerifying
  const isDisableBusy = isIssuingDisableChallenge || isDisableVerifying

  const startEnrollment = useCallback(async () => {
    if (isPreparingEnrollment || pendingEnrollment) return
    setIsPreparingEnrollment(true)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
      if (error || !data) {
        const message =
          error?.message ?? 'Unable to start two-factor enrollment. Please try again.'
        toast.error(message)
        setIsEnableDialogOpen(false)
        return
      }
      unverifiedFactorIdRef.current = data.id
      setPendingEnrollment({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      })
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to start two-factor enrollment. Please try again.'
      toast.error(message)
      setIsEnableDialogOpen(false)
    } finally {
      setIsPreparingEnrollment(false)
    }
  }, [isPreparingEnrollment, pendingEnrollment, supabase])

  useEffect(() => {
    if (!isEnableDialogOpen) return
    if (pendingEnrollment || isPreparingEnrollment) return
    void startEnrollment()
  }, [isEnableDialogOpen, isPreparingEnrollment, pendingEnrollment, startEnrollment])

  const handleEnableDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setIsEnableDialogOpen(false)
        setEnableOtpValue('')
        setPendingEnrollment(null)
        setIsPreparingEnrollment(false)
        setIsEnableVerifying(false)
        const factorId = unverifiedFactorIdRef.current
        unverifiedFactorIdRef.current = null
        if (factorId) {
          void (async () => {
            const { error } = await supabase.auth.mfa.unenroll({ factorId })
            if (error) {
              toast.error(error.message ?? 'Failed to discard pending 2FA setup.')
            }
          })()
        }
        return
      }

      if (isEnabled) {
        toast.info('Two-factor authentication is already enabled.')
        return
      }

      setEnableOtpValue('')
      setPendingEnrollment(null)
      unverifiedFactorIdRef.current = null
      setIsEnableDialogOpen(true)
    },
    [isEnabled, supabase]
  )

  const qrCodeSource = useMemo(() => {
    if (!pendingEnrollment) return null
    return pendingEnrollment.qrCode
  }, [pendingEnrollment])

  const formattedSecret = useMemo(() => {
    if (!pendingEnrollment) return null
    return pendingEnrollment.secret.replace(/(.{4})/g, '$1 ').trim()
  }, [pendingEnrollment])

  const handleEnableVerify = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!pendingEnrollment) return

      const sanitizedCode = enableOtpValue.replace(/\s+/g, '')
      if (!/^\d{6}$/.test(sanitizedCode)) {
        toast.error('Please enter the 6-digit code from your authenticator app.')
        return
      }

      setIsEnableVerifying(true)
      try {
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge(
          { factorId: pendingEnrollment.factorId }
        )
        if (challengeError || !challengeData) {
          const message =
            challengeError?.message ?? 'Could not verify the code. Please try again.'
          toast.error(message)
          return
        }

        const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
          factorId: pendingEnrollment.factorId,
          challengeId: challengeData.id,
          code: sanitizedCode,
        })
        if (verifyError || !verifyData) {
          const message =
            verifyError?.message ?? 'The code you entered is invalid. Please try again.'
          toast.error(message)
          return
        }

        unverifiedFactorIdRef.current = null
        setPendingEnrollment(null)
        setEnableOtpValue('')
        toast.success('Two-factor authentication enabled.')
        setIsEnableDialogOpen(false)
        await refreshFactors()
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to verify the provided code.'
        toast.error(message)
      } finally {
        setIsEnableVerifying(false)
      }
    },
    [enableOtpValue, pendingEnrollment, refreshFactors, supabase]
  )

  const resetDisableDialog = useCallback(() => {
    setIsDisableDialogOpen(false)
    setDisableChallengeId(null)
    setDisableOtp('')
    setIsDisableVerifying(false)
    setIsIssuingDisableChallenge(false)
    disableFactorRef.current = null
  }, [])

  const issueDisableChallenge = useCallback(
    async (options?: { showInfoToast?: boolean; resetOtp?: boolean }) => {
      const factor = disableFactorRef.current
      if (!factor) return null
      if (options?.resetOtp) {
        setDisableOtp('')
      }
      setIsIssuingDisableChallenge(true)
      try {
        const { data, error } = await supabase.auth.mfa.challenge({ factorId: factor.id })
        if (error || !data) {
          const message =
            error?.message ?? 'Failed to send a verification challenge. Please try again.'
          toast.error(message)
          setDisableChallengeId(null)
          return null
        }
        setDisableChallengeId(data.id)
        if (options?.showInfoToast) {
          toast.info('Enter the 6-digit code from your authenticator app to disable 2FA.')
        }
        return data.id
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to send a verification challenge.'
        toast.error(message)
        setDisableChallengeId(null)
        return null
      } finally {
        setIsIssuingDisableChallenge(false)
      }
    },
    [supabase]
  )

  const handleDisableClick = useCallback(async () => {
    if (!totpFactor) return
    disableFactorRef.current = totpFactor
    setDisableOtp('')
    setDisableChallengeId(null)
    setIsDisableDialogOpen(true)
    const challengeId = await issueDisableChallenge({ showInfoToast: true, resetOtp: true })
    if (!challengeId) {
      resetDisableDialog()
    }
  }, [issueDisableChallenge, resetDisableDialog, totpFactor])

  const handleDisableDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        resetDisableDialog()
      }
    },
    [resetDisableDialog]
  )

  const handleDisableVerify = useCallback(async () => {
    const factor = disableFactorRef.current
    if (!factor) {
      toast.info('Two-factor authentication is already disabled.')
      resetDisableDialog()
      return
    }
    const sanitized = disableOtp.replace(/\s+/g, '')
    if (!/^\d{6}$/.test(sanitized)) {
      toast.error('Please enter the 6-digit code from your authenticator app.')
      return
    }

    setIsDisableVerifying(true)
    try {
      let challengeId = disableChallengeId
      if (!challengeId) {
        challengeId = await issueDisableChallenge()
        if (!challengeId) return
      }

      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId,
        code: sanitized,
      })
      if (verifyError || !verifyData) {
        const code = (verifyError as { code?: string } | null)?.code
        const message =
          code === 'mfa_challenge_expired'
            ? 'The verification code expired. We sent a new challenge.'
            : code === 'mfa_verification_failed'
              ? 'That code did not match. Please try again.'
              : verifyError?.message ?? 'We could not verify that code. Please try again.'
        toast.error(message)
        if (code === 'mfa_challenge_expired') {
          await issueDisableChallenge({ resetOtp: true })
        } else if (code === 'mfa_verification_failed') {
          setDisableOtp('')
        }
        return
      }

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
      if (unenrollError) {
        toast.error(unenrollError.message ?? 'Failed to disable two-factor authentication.')
        return
      }

      toast.success('Two-factor authentication disabled.')
      resetDisableDialog()
      await refreshFactors()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to disable two-factor authentication.'
      toast.error(message)
    } finally {
      setIsDisableVerifying(false)
    }
  }, [
    disableChallengeId,
    disableOtp,
    issueDisableChallenge,
    refreshFactors,
    resetDisableDialog,
    supabase,
  ])

  return (
    <>
      <div className='space-y-4 rounded-lg border bg-card p-5 shadow-sm'>
        <div className='space-y-1'>
          <h3 className='text-sm font-semibold'>Two-factor authentication</h3>
          <p className='text-muted-foreground text-sm'>
            Protect your account with a one-time code from an authenticator app in addition to
            your password.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant={isEnabled ? 'default' : 'secondary'} className='flex items-center gap-1'>
            {isStatusLoading ? (
              <Loader2 className='size-3.5 animate-spin' />
            ) : isEnabled ? (
              <ShieldCheck className='size-3.5' />
            ) : (
              <ShieldOff className='size-3.5' />
            )}
            {isStatusLoading ? 'Checking status…' : isEnabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {isEnabled ? (
            <Button
              variant='outline'
              onClick={handleDisableClick}
              disabled={isStatusLoading || isDisableBusy || isDisableDialogOpen}
            >
              {isIssuingDisableChallenge ? (
                <>
                  <Loader2 className='mr-2 size-4 animate-spin' />
                  Preparing…
                </>
              ) : (
                'Disable 2FA'
              )}
            </Button>
          ) : (
            <Button
              onClick={() => handleEnableDialogOpenChange(true)}
              disabled={isStatusLoading || isEnableBusy}
            >
              {isEnableBusy ? (
                <>
                  <Loader2 className='mr-2 size-4 animate-spin' />
                  Preparing…
                </>
              ) : (
                'Enable 2FA'
              )}
            </Button>
          )}
        </div>
      </div>
      <Dialog open={isEnableDialogOpen} onOpenChange={handleEnableDialogOpenChange}>
        <DialogContent className='space-y-6'>
          <DialogHeader>
            <DialogTitle>Enable two-factor authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with Google Authenticator (or any TOTP app), then enter the
              6-digit code to finish enabling 2FA.
            </DialogDescription>
          </DialogHeader>
          {isPreparingEnrollment ? (
            <div className='flex justify-center py-8'>
              <Loader2 className='size-8 animate-spin text-muted-foreground' />
            </div>
          ) : null}
          {!isPreparingEnrollment && pendingEnrollment ? (
            <form className='space-y-6' onSubmit={handleEnableVerify}>
              {qrCodeSource ? (
                <div className='flex justify-center'>
                  <img
                    src={qrCodeSource}
                    alt='Authenticator QR code'
                    className='h-44 w-44 rounded-md border bg-white p-2'
                  />
                </div>
              ) : null}
              {formattedSecret ? (
                <div className='space-y-2 text-center text-sm'>
                  <p className='text-muted-foreground'>
                    Can&apos;t scan the QR code? Enter this code manually in your authenticator app.
                  </p>
                  <div className='mx-auto w-full max-w-xs rounded-md border bg-muted px-3 py-2 font-mono text-base tracking-wider'>
                    {formattedSecret}
                  </div>
                </div>
              ) : null}
              <div className='space-y-2'>
                <InputOTP
                  maxLength={6}
                  value={enableOtpValue}
                  onChange={(value) => setEnableOtpValue(value)}
                  containerClassName='justify-center sm:[&>[data-slot="input-otp-group"]>div]:w-12'
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
                <p className='text-muted-foreground text-xs text-center'>
                  Enter the 6-digit code generated by your authenticator app.
                </p>
              </div>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={() => handleEnableDialogOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isEnableVerifying || enableOtpValue.replace(/\s+/g, '').length !== 6}
                >
                  {isEnableVerifying ? (
                    <>
                      <Loader2 className='mr-2 size-4 animate-spin' />
                      Verifying…
                    </>
                  ) : (
                    'Verify & enable'
                  )}
                </Button>
              </DialogFooter>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={isDisableDialogOpen} onOpenChange={handleDisableDialogOpenChange}>
        <DialogContent className='space-y-6'>
          <DialogHeader>
            <DialogTitle>Disable two-factor authentication</DialogTitle>
            <DialogDescription>
              Confirm this action by entering the 6-digit code from your authenticator app.
              We&apos;ll disable 2FA after verifying the code.
            </DialogDescription>
          </DialogHeader>
          {isIssuingDisableChallenge ? (
            <div className='flex justify-center py-8'>
              <Loader2 className='size-8 animate-spin text-muted-foreground' />
            </div>
          ) : (
            <div className='space-y-4'>
              <InputOTP
                maxLength={6}
                value={disableOtp}
                onChange={(value) => setDisableOtp(value)}
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
              <p className='text-muted-foreground text-xs text-center'>
                Enter the latest 6-digit code generated by your authenticator app.
              </p>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={resetDisableDialog} disabled={isDisableVerifying}>
                  Cancel
                </Button>
                <Button
                  type='button'
                  onClick={handleDisableVerify}
                  disabled={isDisableVerifying || disableOtp.replace(/\s+/g, '').length !== 6}
                >
                  {isDisableVerifying ? (
                    <>
                      <Loader2 className='mr-2 size-4 animate-spin' />
                      Verifying…
                    </>
                  ) : (
                    'Verify & disable'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
