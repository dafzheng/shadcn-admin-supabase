import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import type { NotificationRow } from './notifications-table'
import { getNotificationLevelMeta, resolveNotificationScope } from '../data/options'
import { NotificationsRowActions } from './notifications-row-actions'

export const notificationsColumns: ColumnDef<NotificationRow>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Title' />
    ),
    cell: ({ row }) => (
      <div className='flex flex-col gap-1'>
        <span className='font-medium leading-tight'>{row.original.title}</span>
        <span className='text-muted-foreground text-xs leading-tight'>
          {row.original.message}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'level',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Level' />
    ),
    cell: ({ row }) => {
      const level = row.original.level
      const meta = getNotificationLevelMeta(level)
      if (!meta) return null
      const Icon = meta.icon
      return (
        <div className='flex w-[110px] items-center gap-2'>
          {Icon ? <Icon className='text-muted-foreground size-4' /> : null}
          <span>{meta.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => value.includes(row.getValue(id)),
  },
  {
    accessorKey: 'scope',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Scope' />
    ),
    cell: ({ row }) => {
      const scope = resolveNotificationScope(row.original)
      const labelMap = {
        user: 'Direct',
        organization: 'Organization',
        global: 'Global',
      } as const
      return (
        <Badge variant='outline'>
          {labelMap[scope]}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'publishedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Published' />
    ),
    cell: ({ row }) => {
      const publishedAt = row.original.publishedAt
      return (
        <div className='flex flex-col leading-tight'>
          <span>{new Date(publishedAt).toLocaleString()}</span>
          <span className='text-muted-foreground text-xs'>
            {formatDistanceToNow(new Date(publishedAt), { addSuffix: true })}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'readAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Read status' />
    ),
    cell: ({ row }) => {
      const readAt = row.original.readAt
      return (
        <div className='flex flex-col leading-tight'>
          <span
            className={cn(
              'text-sm font-medium',
              readAt ? 'text-muted-foreground' : 'text-primary'
            )}
          >
            {readAt ? 'Read' : 'Unread'}
          </span>
          {readAt ? (
            <span className='text-muted-foreground text-xs'>
              {formatDistanceToNow(new Date(readAt), { addSuffix: true })}
            </span>
          ) : null}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      const readAt = row.getValue(id) as string | null
      if (value.includes('unread') && !readAt) return true
      if (value.includes('read') && Boolean(readAt)) return true
      return value.length === 0
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <NotificationsRowActions notification={row.original} />,
  },
]
