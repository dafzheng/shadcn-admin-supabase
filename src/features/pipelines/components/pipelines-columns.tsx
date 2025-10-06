import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { LongText } from '@/components/long-text'
import { callTypes, STATUS_META } from '../data/data'
import { type Pipeline } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import numeral from "numeral";
import dayjs from "dayjs";

import { usePipelines } from './pipelines-provider'
import { Loader2 } from 'lucide-react'



const StatusIcon = ({ status }: { status: keyof typeof STATUS_META }) => {
  const { icon: Icon, className, spin } = STATUS_META[status]
  return <Icon className={cn("h-4 w-4", className, spin && "animate-spin")} />
}

export const pipelinesColumns: ColumnDef<Pipeline>[] = [
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
    accessorKey: 'pipelineName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      const { pipelineName } = row.original
      return (<LongText className='max-w-36 ps-3'>{pipelineName}</LongText>)
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
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      // const { status } = row.original
      const { latestByPipeline } = usePipelines()

      if (latestByPipeline[row.original.id]) {
        const badgeColor = callTypes.get(latestByPipeline[row.original.id]?.status || 'inactive')
        return (
          <div className='flex space-x-2'>
            <Badge variant='outline' className={cn('capitalize', badgeColor)}>
              {/* <Loader2 className="h-4 w-4 animate-spin" />{latestByPipeline[row.original.id]?.step} */}
              {/* {StatusIcon(latestByPipeline[row.original.id].status|| 'failed')} */}
              <StatusIcon status={latestByPipeline[row.original.id]?.status} />{latestByPipeline[row.original.id]?.step}
            </Badge>
          </div>
        )
      } else {
        return (
          <div className='flex space-x-2'>
            <Badge variant='outline'>
              {'inactive'}
            </Badge>
          </div>
        )
      }
    },
    meta: { className: 'w-50' },
  },
  {
    accessorKey: 'message',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Message' />
    ),
    cell: ({ row }) => {
      // const { status } = row.original
      const { latestByPipeline } = usePipelines()

      if (latestByPipeline[row.original.id]) {
        return (
          <div className='flex space-x-2'>
            <LongText className='max-w-36'>{latestByPipeline[row.original.id]?.message}</LongText>
          </div>
        )
      } else {

        return (
          <div className='flex space-x-2'>
            <LongText className='max-w-36'>{'-'}</LongText>
          </div>
        )
      }
    },
    meta: { className: 'w-50' },
  },
  {
    accessorKey: 'Segment Name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Segment Name' />
    ),
    cell: ({ row }) => {
      const { targetSegment } = row.original
      return (<LongText className='max-w-36'>{targetSegment.segment_name}</LongText>)
    },
    meta: { className: 'w-50' },
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
