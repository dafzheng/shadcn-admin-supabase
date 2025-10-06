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
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type Pipeline } from '../data/schema'
import { PipelinesMultiDeleteDialog } from './pipelines-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: 'active' | 'inactive') => {
    const selectedPipelines = selectedRows.map((row) => row.original as Pipeline)
    toast.promise(sleep(2000), {
      loading: `${status === 'active' ? 'Activating' : 'Deactivating'} pipelines...`,
      success: () => {
        table.resetRowSelection()
        return `${status === 'active' ? 'Activated' : 'Deactivated'} ${selectedPipelines.length} pipeline${selectedPipelines.length > 1 ? 's' : ''}`
      },
      error: `Error ${status === 'active' ? 'activating' : 'deactivating'} pipelines`,
    })
    table.resetRowSelection()
  }

  const handleBulkInvite = () => {
    const selectedPipelines = selectedRows.map((row) => row.original as Pipeline)
    toast.promise(sleep(2000), {
      loading: 'Inviting pipelines...',
      success: () => {
        table.resetRowSelection()
        return `Invited ${selectedPipelines.length} pipeline${selectedPipelines.length > 1 ? 's' : ''}`
      },
      error: 'Error inviting pipelines',
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='pipeline'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Delete selected pipelines'
              title='Delete selected pipelines'
            >
              <Trash2 />
              <span className='sr-only'>Delete selected pipelines</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete selected pipelines</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <PipelinesMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  )
}
