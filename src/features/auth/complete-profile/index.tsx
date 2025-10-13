import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'
import { AuthLayout } from '@/features/auth/auth-layout'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'
import { useAuthStore } from '@/stores/auth-store'
import { updateAccountProfile, getAccountProfile, updateAccountProviderProfile } from '@/features/users/api/users'
import { parseAccountProfile } from '@/features/users/utils/account-profile'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
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

const profileFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, 'Please enter your full name')
    .max(160, 'Full name is too long'),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

type CompleteProfileProps = {
  redirectTo?: string
}

export function CompleteProfile({ redirectTo }: CompleteProfileProps) {
  const navigate = useNavigate()
  const { user: supabaseUser, isLoading: isAuthLoading } = useSupabaseAuth()
  const authUser = useAuthStore((state) => state.auth.user)
  const setAuthUser = useAuthStore((state) => state.auth.setUser)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fallbackName = useMemo(() => {
    const profileName = authUser?.profile?.fullName ?? ''
    if (profileName && profileName.trim().length > 0) {
      return profileName
    }
    const authFullName = authUser?.fullName ?? ''
    return authFullName.trim()
  }, [authUser?.fullName, authUser?.profile?.fullName])

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: fallbackName,
    },
  })

  useEffect(() => {
    form.reset({ fullName: fallbackName })
  }, [fallbackName, form])

  useEffect(() => {
    if (isAuthLoading) return
    if (!supabaseUser) {
      const target = redirectTo ?? '/'
      navigate({
        to: '/sign-in',
        search: () => (target && target !== '/' ? { redirect: target } : {}),
        replace: true,
      })
    }
  }, [isAuthLoading, navigate, redirectTo, supabaseUser])

  const handleSubmit = async (values: ProfileFormValues) => {
    const fullName = values.fullName.trim()
    if (fullName.length === 0) {
      form.setError('fullName', {
        type: 'manual',
        message: 'Please enter your full name',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const { updateError } = await updateAccountProviderProfile(fullName)
      if (updateError) {
        throw new Error(updateError.message ?? 'Failed to update profile')
      }

      let nextProfile = authUser?.profile ?? null
      try {
        const profileResponse = await getAccountProfile()
        nextProfile = parseAccountProfile(profileResponse)
      } catch (_profileError) {
        // Ignore refresh failures; the loader will retry shortly.
      }

      setAuthUser((previous) => {
        if (!previous) return previous
        return {
          ...previous,
          fullName,
          profile: nextProfile
            ? {
                ...nextProfile,
                fullName,
              }
            : nextProfile,
        }
      })

      toast.success('Profile updated successfully')
      const target = redirectTo ?? '/'
      navigate({
        to: '/loading',
        search: () => (target && target !== '/' ? { redirect: target } : {}),
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isAuthLoading || !supabaseUser) {
    return (
      <AuthLayout>
        <Card>
          <CardContent className='flex flex-col items-center gap-4 py-12'>
            <Loader2 className='size-6 animate-spin' aria-hidden='true' />
            <p className='text-muted-foreground text-sm'>Preparing your account…</p>
          </CardContent>
        </Card>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <Card>
        <CardHeader className='space-y-3 text-center'>
          <div className='mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary'>
            <Sparkles className='size-5' aria-hidden='true' />
          </div>
          <CardTitle className='text-xl font-semibold'>Complete your profile</CardTitle>
          <CardDescription>
            Welcome! Before you continue, let us know how we should address you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className='space-y-4' onSubmit={form.handleSubmit(handleSubmit)}>
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
              <Button className='w-full' type='submit' disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className='flex items-center justify-center gap-2'>
                    <Loader2 className='size-4 animate-spin' aria-hidden='true' />
                    Saving…
                  </span>
                ) : (
                  'Save and continue'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
