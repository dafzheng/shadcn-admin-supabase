import { RefreshCcw, MailPlus, UserPlus, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'
import { useUsers } from './users-provider'

export function UsersPrimaryButtons() {
  const { setOpen, refetchUsers, refetchLoading } = useUsers()
  const authUser = useAuthStore((state) => state.auth.user)

  const resolveActiveRole = () => {
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

  const activeRole = resolveActiveRole()
  const canGenerateTokens = activeRole ? ['admin', 'owner'].includes(activeRole) : false

  return (
    <div className='flex gap-2'>
      <Button
        disabled={refetchLoading}
        size='icon'
        variant='ghost'
        onClick={() => refetchUsers()}
        className='space-x-1'
      >
        <RefreshCcw size={18} />
      </Button>
      <Button
        variant='outline'
        className='space-x-1'
        onClick={() => setOpen('invite')}
      >
        <span>Invite User</span> <MailPlus size={18} />
      </Button>
      {canGenerateTokens && (
        <Button
          variant='outline'
          className='space-x-1'
          onClick={() => setOpen('generate-token')}
        >
          <span>Generate Tokens</span> <KeyRound size={18} />
        </Button>
      )}
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Add User</span> <UserPlus size={18} />
      </Button>
    </div>
  )
}
