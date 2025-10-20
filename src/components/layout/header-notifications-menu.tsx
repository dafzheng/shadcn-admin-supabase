import { useMemo } from 'react'
import { Bell } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'
import { NOTIFICATIONS_TABLE } from '@/features/notifications/constants'
import { useNotificationsStore } from '@/features/notifications/store/notifications-store'
import { getNotificationLevelMeta, resolveNotificationScope } from '@/features/notifications-center/data/options'

export function HeaderNotificationsMenu() {
  const { client } = useSupabaseAuth()
  const notifications = useNotificationsStore((state) => state.notifications)
  const markAsRead = useNotificationsStore((state) => state.markAsRead)

  const { unreadCount, topNotifications } = useMemo(() => {
    const unread = notifications
      .filter((notification) => !notification.readAt)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    return {
      unreadCount: unread.length,
      topNotifications: unread.slice(0, 10),
    }
  }, [notifications])

  const handleMarkAsRead = async (notificationId: string, alreadyRead: boolean) => {
    if (alreadyRead) return
    const timestamp = new Date().toISOString()
    const { error } = await client
      .from(NOTIFICATIONS_TABLE)
      .update({ read_at: timestamp })
      .eq('id', notificationId)
      .select('id')
      .single()

    if (error) {
      toast.error('Failed to mark notification as read. Please try again.')
      return
    }

    markAsRead(notificationId, timestamp)
  }

  const displayUnread = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative size-8'
          aria-label='Notifications'
        >
          <Bell className='size-4' aria-hidden='true' />
          {unreadCount > 0 ? (
            <span className='bg-destructive text-destructive-foreground absolute -end-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold'>
              {displayUnread}
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' sideOffset={14} className='w-80 p-0'>
        <DropdownMenuLabel className='border-b px-4 py-3'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium'>Notifications</span>
            <span className='text-muted-foreground text-xs'>{unreadCount} unread</span>
          </div>
        </DropdownMenuLabel>
        {topNotifications.length ? (
          <div className='max-h-80 overflow-y-auto'>
            <div className='divide-y'>
              {topNotifications.map((notification) => {
                const meta = getNotificationLevelMeta(notification.level)
                const scope = resolveNotificationScope(notification)
                return (
                  <DropdownMenuItem
                    key={notification.id}
                    asChild
                    className='cursor-pointer items-start p-0'
                    onSelect={(event) => {
                      event.preventDefault()
                      void handleMarkAsRead(notification.id, Boolean(notification.readAt))
                    }}
                  >
                    <Link
                      to='/notifications'
                      search={(old) => old ?? {}}
                      className={cn(
                        'flex w-full flex-col items-start gap-1 px-4 py-3 text-left no-underline focus:bg-muted/80',
                        !notification.readAt && 'bg-muted/40'
                      )}
                    >
                      <div className='flex items-center gap-2'>
                        {meta?.icon ? <meta.icon className='text-muted-foreground size-3.5' /> : null}
                        <p className='text-sm font-medium leading-tight'>{notification.title}</p>
                        <Badge variant='outline' className='ms-auto text-[10px] uppercase tracking-wide'>
                          {scope}
                        </Badge>
                      </div>
                      <p className='text-muted-foreground text-xs leading-tight line-clamp-2'>
                        {notification.message}
                      </p>
                      <p className='text-muted-foreground text-[11px]'>
                        {formatDistanceToNow(new Date(notification.publishedAt), { addSuffix: true })}
                      </p>
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </div>
          </div>
        ) : (
          <div className='flex flex-col gap-2 px-4 py-10'>
            <div className='flex items-center gap-2 text-sm font-medium'>
              <Bell className='text-muted-foreground size-4' aria-hidden='true' />
              You’re all caught up
            </div>
            <p className='text-muted-foreground text-xs'>No notifications to show right now.</p>
          </div>
        )}
        <DropdownMenuSeparator />
        <div className='border-t bg-muted/20 px-3 py-2'>
          <Button asChild size='sm' variant='outline' className='w-full'>
            <Link to='/notifications'>View all notifications</Link>
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
