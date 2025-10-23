import { useMemo, useState } from 'react'
import { Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore, type AuthUser } from '@/stores/auth-store'
import { NotificationsAddDialog } from './notifications-add-dialog'

const PRIVILEGED_ROLES = ['owner', 'admin']

function resolveActiveRole(authUser: AuthUser | null) {
  const activeOrg = authUser?.activeOrg
  if (activeOrg && typeof activeOrg === 'object') {
    const value = (activeOrg as Record<string, unknown>)['role']
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim().toLowerCase()
    }
  }

  if (Array.isArray(authUser?.orgs)) {
    for (const org of authUser.orgs) {
      if (org && typeof org === 'object') {
        const value = (org as Record<string, unknown>)['role']
        if (typeof value === 'string' && value.trim().length > 0) {
          return value.trim().toLowerCase()
        }
      }
    }
  }

  return null
}

export function NotificationsPrimaryButtons() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const authUser = useAuthStore((state) => state.auth.user)

  const canSendNotifications = useMemo(() => {
    const role = resolveActiveRole(authUser)
    return role ? PRIVILEGED_ROLES.includes(role) : false
  }, [authUser])

  if (!canSendNotifications) {
    return null
  }

  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setIsDialogOpen(true)}>
        <span>Add Notification</span> <Megaphone size={18} />
      </Button>
      <NotificationsAddDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  )
}
