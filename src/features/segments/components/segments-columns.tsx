import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { LongText } from '@/components/long-text'
import { callTypes, rangeTypes } from '../data/data'
import { type Segment } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import numeral from "numeral";
import dayjs from "dayjs";
import {
  ArrowDownToLine,
  ArrowUpToLine
} from 'lucide-react'

export const segmentsColumns: ColumnDef<Segment>[] = [
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
    accessorKey: 'segmentName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      const { segmentName } = row.original
      return (<LongText className='max-w-36 ps-3'>{segmentName}</LongText>)
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
    accessorKey: 'queriedTotalEntries',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Leads' />
    ),
    cell: ({ row }) => {
      const { queriedTotalEntries } = row.original
      if (queriedTotalEntries === -1) {
        return <LongText className='max-w-36'>{"-"}</LongText>
      } else {
        return <LongText className='max-w-36'>{numeral(queriedTotalEntries).format("0,0")}</LongText>
      }

    },
    meta: { className: 'w-20' },
  },
  {
    accessorKey: 'Job Title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Job Title' />
    ),
    cell: ({ row }) => {
      const { personTitles } = row.original
      if (personTitles.length === 0) {
        return <LongText className='max-w-36'>{"-"}</LongText>
      }
      const stringList = personTitles.map(item => item.label).join(', ');
      return <LongText className='max-w-36'>{stringList}</LongText>
    },
    meta: { className: 'w-50' },
  },
  {
    accessorKey: 'Email Status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email Status' />
    ),
    cell: ({ row }) => {
      const { emailStatus } = row.original
      // return <LongText className='max-w-36'>{stringList}</LongText>
      if (emailStatus.length === 0) {
        return <LongText className='max-w-36'>{"-"}</LongText>
      }
      return (
        <span className="max-w-36 flex flex-wrap gap-2">
          {emailStatus.find(email => email.value === 'verified') &&
            <Badge className={cn('capitalize', callTypes.get('active'))} variant='outline'>{'Verified'}</Badge>}
          {emailStatus.find(email => email.value === 'unverified') &&
            <Badge className={cn('capitalize', callTypes.get('suspended'))} variant='outline'>{'Unverified'}</Badge>}
          {emailStatus.find(email => email.value === 'user_managed') &&
            <Badge className={cn('capitalize', callTypes.get('inactive'))} variant='outline'>{'User Managed'}</Badge>}
        </span>
      )
    },
    meta: { className: 'w-50' },
  },
  {
    accessorKey: 'Company',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Company' />
    ),
    cell: ({ row }) => {
      const { organization } = row.original
      if (organization.length === 0) {
        return <LongText className='max-w-36'>{"-"}</LongText>
      }
      const stringList = organization.map(item => item.label).join(', ');
      return <LongText className='max-w-36'>{stringList}</LongText>
    },
    meta: { className: 'w-50' },
  },
  {
    accessorKey: 'Employees',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Employees' />
    ),
    cell: ({ row }) => {
      const { employees } = row.original
      if (employees.length === 0) {
        return <LongText className='max-w-36'>{"-"}</LongText>
      }
      const stringList = employees.map(item => item.label).join(', ');
      return <LongText className='max-w-36'>{stringList}</LongText>
    },
    meta: { className: 'w-50' },
  },
  {
    accessorKey: 'Industry',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Industry' />
    ),
    cell: ({ row }) => {
      const { industry } = row.original
      if (industry.length === 0) {
        return <LongText className='max-w-36'>{"-"}</LongText>
      }
      const stringList = industry.map(item => item.label).join(', ');
      return <LongText className='max-w-36'>{stringList}</LongText>
    },
    meta: { className: 'w-50' },
  },
  {
    accessorKey: 'Location',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Location' />
    ),
    cell: ({ row }) => {
      const { personLocations } = row.original
      if (personLocations.length === 0) {
        return <LongText className='max-w-36'>{"-"}</LongText>
      }
      const stringList = personLocations.map(item => item.label).join(', ');
      return <LongText className='max-w-36'>{stringList}</LongText>
    },
    meta: { className: 'w-50' },
  },
  {
    accessorKey: 'Revenue',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Revenue' />
    ),
    cell: ({ row }) => {
      const { revenueRange } = row.original

      if (revenueRange.min === '' && revenueRange.max === '') {
        return (<LongText className='max-w-36'>{'-'}</LongText>)
      } else {
        return (
          <span className="max-w-36 flex flex-wrap gap-2">
            {revenueRange.max !== '' && <Badge className={cn('capitalize', rangeTypes.get('max'))} variant='outline'><ArrowDownToLine />{numeral(revenueRange.max).format("0,0")}</Badge>}
            {revenueRange.min !== '' && <Badge className={cn('capitalize', rangeTypes.get('min'))} variant='outline'><ArrowUpToLine />{numeral(revenueRange.min).format("0,0")}</Badge>}
          </span>
        )
        // if (revenueRange.min !== '') {

        //   outputString += `> ${numeral(revenueRange.min).format("0,0")} and `;
        // }

        // if (revenueRange.max !== '') {
        //   outputString += `< ${numeral(revenueRange.max).format("0,0")}`;
        // }
      }
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
