'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Email } from '../data/schema'
import { deleteEmails } from '../api/email'
import { useEmails } from './emails-provider'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Email
}

export function EmailsDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const { refetchEmails } = useEmails()
  const handleDelete = async () => {
    await deleteEmails([currentRow.id])
    await refetchEmails()
    onOpenChange(false)
    // showSubmittedData(currentRow, 'The following email has been deleted:')
  }

  return (
    <ConfirmDialog
      key='email-delete'
      destructive
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      className='max-w-md'
      title={`Delete this email: ${currentRow.emailName} ?`}
      desc={
        <>
          You are about to delete a email with the name{' '}
          <strong>{currentRow.emailName}</strong>. <br />
          This action cannot be undone.
        </>
      }
      confirmText='Delete'
    />
  )
}
