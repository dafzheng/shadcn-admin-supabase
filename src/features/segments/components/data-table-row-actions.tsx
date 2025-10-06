import { useState } from 'react'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { Loader2, SquarePen, Copy, SearchCheck, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSegments } from './segments-provider'
import { Segment } from '../data/schema'
import { querySegment, getQueryURL } from '../api/segment'

interface DataTableRowActionsProps {
  row: Row<Segment>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen: setDialogOpen, setCurrentRow, refetchSegments } = useSegments()
  const [menuOpen, setMenuOpen] = useState(false)
  const [copyURLLoading, setCopyURLLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)

  return (
    <DropdownMenu
      open={menuOpen}
      onOpenChange={(v) => { if (!copyURLLoading || !fetchLoading) setMenuOpen(v) }} // 執行中時不允許被動關閉
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

      <DropdownMenuContent align='end' className='w-[180px]'>
        <DropdownMenuItem
          disabled={copyURLLoading || fetchLoading}
          onSelect={async (e) => {
            // 阻止 Radix 預設的「選取後關閉」行為
            e.preventDefault()
            setCopyURLLoading(true)
            try {
              const result = await getQueryURL(row.original.id)
              console.log('url = ', result)
              navigator.clipboard.writeText(result)
            } catch (err) {
              console.error(err)
            } finally {
              setCopyURLLoading(false)
              setMenuOpen(false) // 任務完成後再關閉
            }
          }}
        >
          {copyURLLoading ? (
            <>
              Fetch...
              <DropdownMenuShortcut>
                <Loader2 className="h-4 w-4 animate-spin" />
              </DropdownMenuShortcut>
            </>
          ) : (
            <>
              Copy URL
              <DropdownMenuShortcut>
                <Copy size={16} />
              </DropdownMenuShortcut>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={copyURLLoading || fetchLoading}
          onSelect={async (e) => {
            // 阻止 Radix 預設的「選取後關閉」行為
            e.preventDefault()
            setFetchLoading(true)
            try {
              await querySegment(row.original.id)
              await refetchSegments()
              // 這裡可加上 toast 成功提示
            } catch (err) {
              // 這裡可加上錯誤提示
              console.error(err)
            } finally {
              setFetchLoading(false)
              setMenuOpen(false) // 任務完成後再關閉
            }
          }}
        >
          {fetchLoading ? (
            <>
              Checking...
              <DropdownMenuShortcut>
                <Loader2 className="h-4 w-4 animate-spin" />
              </DropdownMenuShortcut>
            </>
          ) : (
            <>
              Check Result Number
              <DropdownMenuShortcut>
                <SearchCheck size={16} className="text-green-500" />
              </DropdownMenuShortcut>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={copyURLLoading || fetchLoading}
          onSelect={() => {
            setCurrentRow(row.original)
            setDialogOpen('edit')
          }}
        >
          Edit
          <DropdownMenuShortcut>
            <SquarePen size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          disabled={copyURLLoading || fetchLoading}
          onSelect={() => {
            setCurrentRow(row.original)
            setDialogOpen('delete')
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
  )
}
