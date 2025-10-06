'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { Pipeline } from '../data/schema'
import { deletePipelines } from '../api/pipelines'
import { usePipelines } from './pipelines-provider'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Pipeline
}

export function PipelinesDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const { refetchPipelines } = usePipelines()

  const handleDelete = async () => {
    await deletePipelines([currentRow.id])
    await refetchPipelines()
    onOpenChange(false)
    // showSubmittedData(currentRow, 'The following pipeline has been deleted:')
  }

  return (
    <ConfirmDialog
      key='pipeline-delete'
      destructive
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      className='max-w-md'
      title={`Delete this pipeline: ${currentRow.pipelineName} ?`}
      desc={
        <>
          You are about to delete a pipeline with the name{' '}
          <strong>{currentRow.pipelineName}</strong>. <br />
          This action cannot be undone.
        </>
      }
      confirmText='Delete'
    />
  )
}
