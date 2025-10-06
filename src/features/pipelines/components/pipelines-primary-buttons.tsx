import { RefreshCcw, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePipelines } from './pipelines-provider'



export function PipelinesPrimaryButtons() {
  const { setOpen, refetchPipelines, refetchLoading } = usePipelines()

  return (
    <div className='flex gap-2'>
      <Button
        disabled={refetchLoading}
        size='icon'
        variant='ghost'
        onClick={() => refetchPipelines()}
        className='space-x-1'
      >
        <RefreshCcw size={18} />
      </Button>
      <Button
        disabled={refetchLoading}
        className='space-x-1'
        onClick={() => setOpen('add')}
      >
        <span>Add</span> <Save size={18} />
      </Button>
    </div>
  )
}
