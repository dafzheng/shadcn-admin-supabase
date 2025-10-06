import { useState } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { Loader2, SquarePen, Copy, Play, Trash2, Logs } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePipelines } from './pipelines-provider'
import { Pipeline } from '../data/schema'
import { activePipeline } from '../api/pipelines'

interface DataTableRowActionsProps {
  row: Row<Pipeline>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow, latestByPipeline } = usePipelines()
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeLoading, setActiveLoading] = useState(false)
  return (
    <>
      <DropdownMenu
        open={menuOpen}
        onOpenChange={(v) => { if (!activeLoading) setMenuOpen(v) }} // 執行中時不允許被動關閉
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
          >
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[160px]'>
          <DropdownMenuItem
            disabled={activeLoading || (latestByPipeline[row.original.id] !== undefined)}
            onSelect={async (e) => {
              // 阻止 Radix 預設的「選取後關閉」行為
              e.preventDefault()
              setActiveLoading(true)
              try {
                await activePipeline(row.original.id)
              } catch (err) {
                console.error(err)
              } finally {
                setActiveLoading(false)
                setMenuOpen(false) // 任務完成後再關閉
              }
            }}
          >
            {activeLoading ? (
              <>
                Active...
                <DropdownMenuShortcut>
                  <Loader2 className="h-4 w-4 animate-spin" />
                </DropdownMenuShortcut>
              </>
            ) : (
              <>
                Active
                <DropdownMenuShortcut>
                  <Play size={16} className="text-green-500" />
                </DropdownMenuShortcut>
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('edit')
            }}
          >
            Edit
            <DropdownMenuShortcut>
              <SquarePen size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('detail')
            }}
          >
            Show Detail
            <DropdownMenuShortcut>
              <Logs size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={activeLoading || latestByPipeline[row.original.id]?.status === 'running'}
            onClick={() => {
              setCurrentRow(row.original)
              setOpen('delete')
            }}
            className='text-red-500!'
          >
            Delete
            <DropdownMenuShortcut>
              <Trash2 size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
