import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Please enter your email' : undefined),
  }),
})

export function ForgotPasswordForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const { client } = useSupabaseAuth()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)
    // const redirectTo =
    //   typeof window !== 'undefined'
    //     ? new URL('/reset-password', window.location.origin).toString()
    //     : undefined

    // Request Supabase to send the reset email and bounce the user back to our handler page.
    // const { error } = await client.auth.resetPasswordForEmail(data.email, {
    //   redirectTo,
    // })
    const { error } = await client.auth.resetPasswordForEmail(data.email, {
      redirectTo: window.location.origin
    })

    setIsLoading(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success(`Password reset instructions have been sent to ${data.email}.`)
    // Redirect back to the app's sign-in page so the user can log in after completing the reset.
    form.reset()
    navigate({ to: '/sign-in' })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-2', className)}
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
        <Button className='mt-2' disabled={isLoading}>
          Continue
          {isLoading ? <Loader2 className='animate-spin' /> : <ArrowRight />}
        </Button>
      </form>
    </Form>
  )
}
