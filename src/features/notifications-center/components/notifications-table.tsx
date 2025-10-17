import { useEffect, useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useNotificationsStore } from '@/features/notifications/store/notifications-store'
import type { AppNotification } from '@/features/notifications/data/schema'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { notificationLevels, notificationReadStates, resolveNotificationScope } from '../data/options'
import { notificationsColumns } from './notifications-columns'
import { NotificationsBulkActions } from './notifications-bulk-actions'

const route = getRouteApi('/_authenticated/notifications/')

export type NotificationRow = AppNotification

const columns = notificationsColumns

export function NotificationsTable() {
  const notifications = useNotificationsStore((state) => state.notifications)
  const data = useMemo(
    () => notifications.map((notification) => mapNotificationToRow(notification)),
    [notifications]
  )

  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: route.useSearch(),
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 'filter' },
    columnFilters: [
      { columnId: 'level', searchKey: 'level', type: 'array' },
      { columnId: 'readAt', searchKey: 'read', type: 'array' },
    ],
  })

  // When data shrinks, keep pagination valid.
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection: true,
    globalFilterFn: (row, _columnId, filterValue) => {
      const title = String(row.original.title ?? '').toLowerCase()
      const message = String(row.original.message ?? '').toLowerCase()
      const level = String(row.original.level ?? '').toLowerCase()
      const scope = resolveNotificationScope(row.original)
      const filter = String(filterValue ?? '').toLowerCase()
      return (
        title.includes(filter) ||
        message.includes(filter) ||
        level.includes(filter) ||
        scope.includes(filter)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
  })

  const pageCount = table.getPageCount()
  useEffect(() => {
    ensurePageInRange(pageCount)
  }, [ensurePageInRange, pageCount])

  return (
    <div className='space-y-4 max-sm:has-[div[role="toolbar"]]:mb-16'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Filter by title, message, or level...'
        filters={[
          {
            columnId: 'level',
            title: 'Level',
            options: notificationLevels.map((option) => ({
              label: option.label,
              value: option.value,
              icon: option.icon,
            })),
          },
          {
            columnId: 'readAt',
            title: 'Read status',
            options: notificationReadStates,
          },
        ]}
      />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No notifications found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
      <NotificationsBulkActions table={table} />
    </div>
  )
}

function mapNotificationToRow(notification: AppNotification): NotificationRow {
  return {
    ...notification,
  }
}
