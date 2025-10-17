import { useState } from 'react'
import type { Table } from '@tanstack/react-table'
import { MailCheck, Undo2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'
import { NOTIFICATIONS_TABLE } from '@/features/notifications/constants'
import { useNotificationsStore } from '@/features/notifications/store/notifications-store'
import type { NotificationRow } from './notifications-table'

type NotificationsBulkActionsProps = {
  table: Table<NotificationRow>
}

export function NotificationsBulkActions({ table }: NotificationsBulkActionsProps) {
  const { client } = useSupabaseAuth()
  const markManyAsRead = useNotificationsStore((state) => state.markManyAsRead)
  const markManyAsUnread = useNotificationsStore((state) => state.markManyAsUnread)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const unreadIds = selectedRows.filter((row) => !row.original.readAt).map((row) => row.original.id)
  const readIds = selectedRows.filter((row) => row.original.readAt).map((row) => row.original.id)
  const selectedCount = selectedRows.length

  if (selectedCount === 0) {
    return null
  }

  const handleBulkRead = async () => {
    if (unreadIds.length === 0) return
    setIsSubmitting(true)
    const timestamp = new Date().toISOString()
    const { error } = await client
      .from(NOTIFICATIONS_TABLE)
      .update({ read_at: timestamp })
      .in('id', unreadIds)
      .select('id')

    if (error) {
      toast.error('Failed to mark selected notifications as read.')
      setIsSubmitting(false)
      return
    }

    markManyAsRead(unreadIds, timestamp)
    table.resetRowSelection()
    setIsSubmitting(false)
    toast.success('Selected notifications marked as read.')
  }

  const handleBulkUnread = async () => {
    if (readIds.length === 0) return
    setIsSubmitting(true)
    const { error } = await client
      .from(NOTIFICATIONS_TABLE)
      .update({ read_at: null })
      .in('id', readIds)
      .select('id')

    if (error) {
      toast.error('Failed to mark selected notifications as unread.')
      setIsSubmitting(false)
      return
    }

    markManyAsUnread(readIds)
    table.resetRowSelection()
    setIsSubmitting(false)
    toast.success('Selected notifications marked as unread.')
  }

  return (
    <BulkActionsToolbar table={table} entityName='notification'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='default'
            size='icon'
            className='size-8'
            onClick={handleBulkRead}
            disabled={isSubmitting || unreadIds.length === 0}
            aria-label='Mark selected as read'
          >
            <MailCheck className='size-4' />
            <span className='sr-only'>Mark selected as read</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Mark selected as read</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            className='size-8'
            onClick={handleBulkUnread}
            disabled={isSubmitting || readIds.length === 0}
            aria-label='Mark selected as unread'
          >
            <Undo2 className='size-4' />
            <span className='sr-only'>Mark selected as unread</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Mark selected as unread</p>
        </TooltipContent>
      </Tooltip>

      <span className='text-muted-foreground text-sm'>{selectedCount} selected</span>
    </BulkActionsToolbar>
  )
}
