'use client'

import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { sleep } from '@/utils/sleep'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deletePipelines } from '../api/pipelines'
import { usePipelines } from './pipelines-provider'

type PipelineMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

const CONFIRM_WORD = 'DELETE'

export function PipelinesMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: PipelineMultiDeleteDialogProps<TData>) {
  const [value, setValue] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const { refetchPipelines } = usePipelines()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleDelete = async () => {
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`Please type "${CONFIRM_WORD}" to confirm.`)
      return
    }

    const idList = selectedRows.map(row => row.getValue<string>('id'))

    try {
      setIsDeleting(true)
      const delPromise = deletePipelines(idList)
      // 1) 刪除中顯示 loading，成功/失敗顯示結果
      await toast.promise(
        delPromise,
        {
          loading: 'Deleting pipelines...',
          success: () => `Deleted ${idList.length} ${idList.length > 1 ? 'pipelines' : 'pipeline'}`,
          error: (err) => {
            // 盡可能把後端錯誤訊息顯示出來
            const msg = err?.response?.data?.error || err?.message || 'Delete failed'
            return msg
          },
        }
      )

      // 2) 刪除成功後刷新列表 + 清選取 + 關閉對話框 + 重置輸入框
      await refetchPipelines()
      table.resetRowSelection()
      onOpenChange(false)
      setValue('') // 重置輸入框
    } finally {
      setIsDeleting(false)
    }

  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== 'DELETE' || isDeleting || selectedRows.length === 0}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          Delete {selectedRows.length}{' '}
          {selectedRows.length > 1 ? 'pipelines' : 'pipeline'}
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Are you sure you want to delete the selected pipelines? <br />
            This action cannot be undone.
          </p>

          <Label className='my-4 flex flex-col items-start gap-1.5'>
            <span className=''>Confirm by typing "{CONFIRM_WORD}":</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Type "${CONFIRM_WORD}" to confirm.`}
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Delete'
      destructive
    />
  )
}
