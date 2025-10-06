'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Segment } from '../data/schema'
import { deleteSegments } from '../api/segment'
import { useSegments } from './segments-provider'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Segment
}

export function SegmentsDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const { refetchSegments } = useSegments()
  const handleDelete = async () => {
    await deleteSegments([currentRow.id])
    await refetchSegments()
    onOpenChange(false)
    // showSubmittedData(currentRow, 'The following segment has been deleted:')
  }

  return (
    <ConfirmDialog
      key='segment-delete'
      destructive
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      className='max-w-md'
      title={`Delete this segment: ${currentRow.segmentName} ?`}
      desc={
        <>
          You are about to delete a segment with the name{' '}
          <strong>{currentRow.segmentName}</strong>. <br />
          This action cannot be undone.
        </>
      }
      confirmText='Delete'
    />
  )
}
