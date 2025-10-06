import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { LongText } from '@/components/long-text'
import { callTypes } from '../data/data'
import { type Email, type EmailStatus } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import dayjs from "dayjs";
import {
  Check,
  Cog,
  CircleX,
  LucideIcon
} from 'lucide-react'

const isEmailStatus = (value: string): value is EmailStatus =>
  value === 'available' || value === 'building' || value === 'error'

const STATUS_CONFIG: Record<EmailStatus, { Icon: LucideIcon; iconClass?: string }> = {
  available: { Icon: Check },
  building: { Icon: Cog, iconClass: 'animate-spin' },
  error: { Icon: CircleX },
}

export const emailsColumns: ColumnDef<Email>[] = [
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
    meta: {
      className: cn('sticky md:table-cell start-0 z-10 rounded-tl-[inherit]'),
    },
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
    accessorKey: 'id',
    // 這個欄不需要顯示任何內容
    header: () => null,
    cell: () => null,
    enableSorting: false,
    enableHiding: true,
    meta: { className: 'w-0 p-0' },
  },
  {
    accessorKey: 'emailName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      const { emailName } = row.original
      return (<LongText className='max-w-36 ps-3'>{emailName}</LongText>)
    },
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'Type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ row }) => {
      const { type } = row.original
      return (<LongText className='max-w-36 capitalize'>{type}</LongText>)
    },
    meta: { className: 'w-50' },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const { status } = row.original
      if (!isEmailStatus(status)) {
        return null
      }
      const badgeColor = callTypes.get(status)

      const config = STATUS_CONFIG[status]

      return (
        <Badge variant="outline" className={cn('capitalize', badgeColor)}>
          <config.Icon size={16} className={cn('h-4 w-4', config.iconClass)} />
          {status}
        </Badge>
      )
      // if (status === 'available') {
      //   return (
      //     <Badge variant='outline' className={cn('capitalize', badgeColor)}>
      //       <Check size={16} className='h-4 w-4' /> {status}
      //     </Badge>
      //   )
      // } else if (status === 'building') {
      //   return (
      //     <Badge variant='outline' className={cn('capitalize', badgeColor)}>
      //       <Cog size={16} className='h-4 w-4 animate-spin' /> {status}
      //     </Badge>
      //   )
      // } else if (status === 'error') {
      //   return (
      //     <Badge variant='outline' className={cn('capitalize', badgeColor)}>
      //       <CircleX size={16} className='h-4 w-4' /> {status}
      //     </Badge>
      //   )
      // } else {
      //   return null
      // }


    },
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'Created At',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created At' />
    ),
    cell: ({ row }) => {
      const { createdAt } = row.original
      return (<LongText className='max-w-36'>{dayjs(createdAt).format("YYYY-MM-DD HH:mm:ss")}</LongText>)
    },
    meta: { className: 'w-50' },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
    meta: {
      className: cn(
        'sticky end-0 z-10 rounded-tr-[inherit] bg-background',
        // 你可以加上 drop-shadow 或 border 看起來更清楚
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]'
      ),
    },
  },
]
