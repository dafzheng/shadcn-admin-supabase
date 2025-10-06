import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, UserX, UserCheck, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
// import { BulkActionsToolbar } from '@/components/bulk-actions-toolbar'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type Segment } from '../data/schema'
import { SegmentsMultiDeleteDialog } from './segments-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: 'active' | 'inactive') => {
    const selectedSegments = selectedRows.map((row) => row.original as Segment)
    toast.promise(sleep(2000), {
      loading: `${status === 'active' ? 'Activating' : 'Deactivating'} segments...`,
      success: () => {
        table.resetRowSelection()
        return `${status === 'active' ? 'Activated' : 'Deactivated'} ${selectedSegments.length} segment${selectedSegments.length > 1 ? 's' : ''}`
      },
      error: `Error ${status === 'active' ? 'activating' : 'deactivating'} segments`,
    })
    table.resetRowSelection()
  }

  const handleBulkInvite = () => {
    const selectedSegments = selectedRows.map((row) => row.original as Segment)
    toast.promise(sleep(2000), {
      loading: 'Inviting segments...',
      success: () => {
        table.resetRowSelection()
        return `Invited ${selectedSegments.length} segment${selectedSegments.length > 1 ? 's' : ''}`
      },
      error: 'Error inviting segments',
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='segment'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Delete selected segments'
              title='Delete selected segments'
            >
              <Trash2 />
              <span className='sr-only'>Delete selected segments</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete selected segments</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <SegmentsMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  )
}
