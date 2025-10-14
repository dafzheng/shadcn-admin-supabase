import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
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

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Please enter your email' : undefined),
  }),
  password: z
    .string()
    .min(1, 'Please enter your password')
    .min(6, 'Password must be at least 6 characters long'),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const navigate = useNavigate()
  const { signInWithPassword, signInWithOAuth, isLoading, session } = useSupabaseAuth()
  const [isOAuthLoading, setIsOAuthLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const isSubmitting = form.formState.isSubmitting

  // If the user already has an active Supabase session, skip the form entirely.
  useEffect(() => {
    if (!session) return
    const target = redirectTo ?? '/'
    navigate({ to: '/loading', search: () => ({ redirect: target }), replace: true })
  }, [navigate, redirectTo, session])

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const { error } = await signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success('Signed in successfully')
    const target = redirectTo ?? '/'
    navigate({ to: '/loading', search: () => ({ redirect: target }) })
  }

  const handleGoogleSignIn = useCallback(async () => {
    if (isOAuthLoading) return

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


      console.log('redirectUrl = ', redirectUrl)
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
  }, [isOAuthLoading, redirectTo, signInWithOAuth])

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
                <Input placeholder='name@example.com' {...field} />
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
                <PasswordInput placeholder='********' {...field} />
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
        <Button className='mt-2' disabled={isSubmitting || isLoading}>
          {isSubmitting || isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          Sign in
        </Button>
        <Button
          type='button'
          variant='outline'
          className='mt-1 flex items-center justify-center gap-2'
          disabled={isSubmitting || isLoading || isOAuthLoading}
          onClick={handleGoogleSignIn}
        >
          {isOAuthLoading ? <Loader2 className='size-4 animate-spin' /> : null}
          {!isOAuthLoading ? <IconGoogle className='size-4' /> : null}
          Continue with Google
        </Button>

      </form>
    </Form>
  )
}
