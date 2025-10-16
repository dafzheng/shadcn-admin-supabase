import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { getAccountProfile, updateAccountProfile } from '@/features/users/api/users'
import { parseAccountProfile } from '@/features/users/utils/account-profile'
import { useAuthStore } from '@/stores/auth-store'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
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
    .min(1, 'Please enter your full name.')
    .max(160, 'Full name must not exceed 160 characters.'),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

export function ProfileForm() {
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

  const handleSubmit = async (values: ProfileFormValues) => {
    const fullName = values.fullName.trim()
    if (fullName.length === 0) {
      form.setError('fullName', {
        type: 'manual',
        message: 'Please enter your full name.',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await updateAccountProfile(fullName)
      const responseRecord =
        response && typeof response === 'object' ? (response as Record<string, unknown>) : undefined
      const responseData =
        responseRecord?.data && typeof responseRecord.data === 'object'
          ? (responseRecord.data as Record<string, unknown>)
          : undefined
      const updateError =
        (responseRecord?.updateError as { message?: string } | undefined) ??
        (responseRecord?.error as { message?: string } | undefined) ??
        (responseData?.updateError as { message?: string } | undefined) ??
        (responseData?.error as { message?: string } | undefined)

      if (updateError) {
        throw new Error(updateError.message ?? 'Failed to update profile.')
      }

      let nextProfile = authUser?.profile ?? null
      try {
        const profileResponse = await getAccountProfile()
        const parsedProfile = parseAccountProfile(profileResponse)
        if (parsedProfile) {
          nextProfile = parsedProfile
        }
      } catch (_profileError) {
        // Ignore refresh failures; the caller will retry soon.
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

      form.reset({ fullName })
      toast.success('Profile updated successfully.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-8'>
        <FormField
          control={form.control}
          name='fullName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder='Jane Doe' {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a pseudonym.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting ? 'Updating...' : 'Update profile'}
        </Button>
      </form>
    </Form>
  )
}
