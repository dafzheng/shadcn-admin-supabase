import { useNavigate, useLocation } from '@tanstack/react-router'
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
  const location = useLocation()
  const { auth } = useAuthStore()
  const { signOut } = useSupabaseAuth()

  const handleSignOut = () => {
    // Use an async IIFE so we can await Supabase while keeping the confirm handler synchronous.
    void (async () => {
      const currentPath = location.href
      const { error } = await signOut()
      if (error) {
        toast.error(error.message)
        return
      }
      auth.reset()
      navigate({
        to: '/sign-in',
        search: { redirect: currentPath },
        replace: true,
      })
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
