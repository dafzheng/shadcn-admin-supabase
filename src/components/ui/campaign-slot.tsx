import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { CircleX, CircleCheck, Clock, Loader2, Play, Square, Hourglass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CampaignStats } from '@/features/pipelines/data/schema'
interface CampaignSlotProps {
  asChild?: boolean
  title: string,
  status?: string,
  email: string,
  // time?: string,
  description?: string
  stats: CampaignStats
  start: string,
  finish: string,
  triggerType: string
  className?: string
  onRun?: () => Promise<void> | void
  onFinish?: () => Promise<void> | void
}

function CampaignSlot({
  asChild,
  title,
  status,
  email,
  description,
  stats,
  start,
  finish,
  triggerType,
  // time,
  className,
  onRun,
  onFinish,
}: CampaignSlotProps) {
  const Comp = asChild ? Slot : 'div'
  const [running, setRunning] = React.useState(false)
  const showActiveButton = status === 'inactive' ? true : false

  const showFinishButton = status === 'active' ? true : false

  const handleRun = async () => {
    if (!onRun || running) return
    try {
      setRunning(true)
      await onRun()
    } finally {
      setRunning(false)
    }
  }


  const handleFinish = async () => {
    if (!onFinish || running) return
    try {
      setRunning(true)
      await onFinish()
    } finally {
      setRunning(false)
    }
  }

  const renderIcon = () => {
    if (status === 'active') {
      return <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
    }

    if (status === 'queue') {
      return <Hourglass className="h-5 w-5 text-grey-500 shrink-0" />
    }

    if (status === 'inactive') {
      return <Clock className="h-5 w-5 text-grey-500 shrink-0" />
    }

    if (status === 'finish') {
      return <CircleCheck className="h-5 w-5 text-green-500 shrink-0" />
    }
    return null
  }

  const showStatus = () => {
    if (status === 'active') {
      return 'Active'
    }

    if (status === 'inactive') {
      return 'Inactive'
    }

    if (status === 'queue') {
      return 'Queue'
    }

    if (status === 'finish') {
      return 'Finished'
    }
    return null
  }


  return (
    <Comp className={`flex items-start gap-3 border rounded-md p-4 ${className ?? ''}`}>
      {renderIcon()}
      <div className="flex flex-1 flex-col">
        {/* <div className="flex items-center justify-between gap-3"> */}
        <div className="flex justify-between items-start">
          <h2 className="text-lg font-semibold leading-none">{title}</h2>

          {showActiveButton && (
            <Button
              type="button"
              size="sm"
              // variant={running ? "destructive" : "default"}
              variant={"default"}
              onClick={handleRun}
              disabled={!onRun}
            >
              <span className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                <span>{'Active'}</span>
              </span>
            </Button>
          )}

          {showFinishButton && (
            <Button
              type="button"
              size="sm"
              variant={"secondary"}
              onClick={handleFinish}
              disabled={!onFinish}
            >
              <span className="flex items-center gap-2">
                <Square className="h-4 w-4" />
                <span>{'Finish'}</span>
              </span>
            </Button>
          )}

        </div>

        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}

        <ul className="mt-2 space-y-1 text-sm">

          <li className="flex items-start gap-2">
            <span className="min-w-28 text-muted-foreground">Status</span>
            <span className="font-medium break-all">{showStatus()}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="min-w-28 text-muted-foreground">Email Name</span>
            <span className="font-medium break-all">{email}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="min-w-28 text-muted-foreground">Started At</span>
            <span className="font-medium break-all">{start}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="min-w-28 text-muted-foreground">Finished At</span>
            <span className="font-medium break-all">{finish}</span>
          </li>


          {stats && status !== 'queue' && (
            <li className="flex items-start gap-2">
              <span className="min-w-28 text-muted-foreground">Read/Sent</span>
              <span className="font-medium break-all">
                {stats.sent_count === 0 ? '0/0 (0%)' : `${stats.read_count}/${stats.sent_count} (${(stats.read_count * 100 / stats.sent_count).toFixed(1)}%)`}
              </span>
            </li>
          )}
          {stats && status !== 'queue' && (
            <li className="flex items-start gap-2">
              <span className="min-w-28 text-muted-foreground">Hit/Sent</span>
              <span className="font-medium break-all">
                {stats.sent_count === 0 ? '0/0 (0%)' : `${stats.hit_count}/${stats.sent_count} (${(stats.hit_count * 100 / stats.sent_count).toFixed(1)}%)`}
              </span>
            </li>
          )}
          {email && (
            <li className="flex items-start gap-2">
              <span className="min-w-28 text-muted-foreground">Trigger Type</span>
              <span className="font-medium">{triggerType}</span>
            </li>
          )}
          {/* {email && (
            <li className="flex items-start gap-2">
              <span className="min-w-28 text-muted-foreground">Email ID</span>
              <span className="font-mono text-xs break-all">{email}</span>
            </li>
          )} */}
        </ul>
      </div>
    </Comp>
  )
}

export { CampaignSlot }