import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'
import { ConfirmDialog } from '@/components/confirm-dialog'

interface SignOutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate()
  const { auth } = useAuthStore()
  const { signOut } = useSupabaseAuth()

  const handleSignOut = () => {
    // Use an async IIFE so we can await Supabase while keeping the confirm handler synchronous.
    void (async () => {
      const { error } = await signOut()
      if (error) {
        toast.error(error.message)
        return
      }
      auth.reset()
      // Flag the guard so it skips preserving the current route after an explicit sign-out.
      sessionStorage.setItem('skipAuthRedirect', 'true')
      navigate({ to: '/sign-in', replace: true })
    })()
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Sign out'
      desc='Are you sure you want to sign out? You will need to sign in again to access your account.'
      confirmText='Sign out'
      handleConfirm={handleSignOut}
      className='sm:max-w-sm'
    />
  )
}
