import { RefreshCcw, Save, Newspaper, MailPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEmails } from './emails-provider'



export function EmailsPrimaryButtons() {
  const { setOpen, refetchEmails, refetchLoading } = useEmails()

  return (
    <div className='flex gap-2'>
      <Button
        disabled={refetchLoading}
        size='icon'
        variant='ghost'
        onClick={() => refetchEmails()}
        className='space-x-1'
      >
        <RefreshCcw size={18} />
      </Button>
      <Button
        disabled={refetchLoading}
        className='space-x-1'
        onClick={() => setOpen('add-email')}
      >
        <span>Add Email</span> <MailPlus size={18} />
      </Button>
       <Button
        disabled={refetchLoading}
        className='space-x-1'
        onClick={() => setOpen('add-newsletter')}
      >
        <span>Add Newsletter</span> <Newspaper size={18} />
      </Button>
    </div>
  )
}
