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
import { type Email } from '../data/schema'
import { EmailsMultiDeleteDialog } from './emails-multi-delete-dialog'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleBulkStatusChange = (status: 'active' | 'inactive') => {
    const selectedEmails = selectedRows.map((row) => row.original as Email)
    toast.promise(sleep(2000), {
      loading: `${status === 'active' ? 'Activating' : 'Deactivating'} emails...`,
      success: () => {
        table.resetRowSelection()
        return `${status === 'active' ? 'Activated' : 'Deactivated'} ${selectedEmails.length} email${selectedEmails.length > 1 ? 's' : ''}`
      },
      error: `Error ${status === 'active' ? 'activating' : 'deactivating'} emails`,
    })
    table.resetRowSelection()
  }

  const handleBulkInvite = () => {
    const selectedEmails = selectedRows.map((row) => row.original as Email)
    toast.promise(sleep(2000), {
      loading: 'Inviting emails...',
      success: () => {
        table.resetRowSelection()
        return `Invited ${selectedEmails.length} email${selectedEmails.length > 1 ? 's' : ''}`
      },
      error: 'Error inviting emails',
    })
    table.resetRowSelection()
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='email'>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Delete selected emails'
              title='Delete selected emails'
            >
              <Trash2 />
              <span className='sr-only'>Delete selected emails</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete selected emails</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <EmailsMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  )
}
