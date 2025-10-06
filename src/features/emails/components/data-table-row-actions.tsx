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
import { useEmails } from './emails-provider'
import { Email } from '../data/schema'

interface DataTableRowActionsProps {
  row: Row<Email>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen: setDialogOpen, setCurrentRow } = useEmails()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <DropdownMenu modal={false}>
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
