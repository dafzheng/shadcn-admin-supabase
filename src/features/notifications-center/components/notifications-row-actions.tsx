import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { ClipboardCopy, Eye, RotateCcw } from 'lucide-react'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'
import { NOTIFICATIONS_TABLE } from '@/features/notifications/constants'
import { useNotificationsStore } from '@/features/notifications/store/notifications-store'
import { format } from 'date-fns'
import type { NotificationRow } from './notifications-table'

type NotificationsRowActionsProps = {
  notification: NotificationRow
}

export function NotificationsRowActions({ notification }: NotificationsRowActionsProps) {
  const { client } = useSupabaseAuth()
  const markAsRead = useNotificationsStore((state) => state.markAsRead)
  const markAsUnread = useNotificationsStore((state) => state.markAsUnread)

  const handleMarkAsRead = async () => {
    if (notification.readAt) return
    const timestamp = new Date().toISOString()
    const { error } = await client
      .from(NOTIFICATIONS_TABLE)
      .update({ read_at: timestamp })
      .eq('id', notification.id)
      .select('id')
      .single()

    if (error) {
      toast.error('Failed to mark notification as read. Please try again.')
      return
    }

    markAsRead(notification.id, timestamp)
    toast.success('Notification marked as read.')
  }

  const handleMarkAsUnread = async () => {
    if (!notification.readAt) return
    const { error } = await client
      .from(NOTIFICATIONS_TABLE)
      .update({ read_at: null })
      .eq('id', notification.id)
      .select('id')
      .single()

    if (error) {
      toast.error('Failed to mark notification as unread. Please try again.')
      return
    }

    markAsUnread(notification.id)
    toast.success('Notification marked as unread.')
  }

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(notification.message)
      toast.success('Message copied to clipboard.')
    } catch {
      toast.error('Failed to copy message.')
    }
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='data-[state=open]:bg-muted flex h-8 w-8 p-0'>
          <DotsHorizontalIcon className='size-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuItem onClick={handleCopyMessage}>
          <ClipboardCopy className='me-2 size-4' />
          Copy message
        </DropdownMenuItem>
        <DropdownMenuItem disabled>
          <Eye className='me-2 size-4' />
          View details
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {notification.readAt ? (
          <DropdownMenuItem onClick={handleMarkAsUnread}>
            <RotateCcw className='me-2 size-4' />
            Mark as unread
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleMarkAsRead}>
            <RotateCcw className='me-2 size-4 rotate-180' />
            Mark as read
          </DropdownMenuItem>
        )}
        {notification.readAt ? (
          <DropdownMenuItem disabled>
            Read {format(new Date(notification.readAt), 'PPpp')}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
