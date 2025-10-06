import { RefreshCcw, MailPlus, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUsers } from './users-provider'

export function UsersPrimaryButtons() {
  const { setOpen, refetchUsers, refetchLoading } = useUsers()
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
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Add User</span> <UserPlus size={18} />
      </Button>
    </div>
  )
}
