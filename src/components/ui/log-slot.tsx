import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { CircleX, CircleCheck, Info } from 'lucide-react'
interface LogSlotProps {
  asChild?: boolean
  title: string,
  status?: string,
  time?: string,
  description?: string
  className?: string
}

function LogSlot({
  asChild,
  title,
  status,
  description,
  time,
  className,
}: LogSlotProps) {
  const Comp = asChild ? Slot : 'div'

  const renderIcon = () => {
    if (status === 'succeeded') {
      return <CircleCheck className="h-5 w-5 text-green-500 shrink-0" />
    }
    if (status === 'failed') {
      return <CircleX className="h-5 w-5 text-red-500 shrink-0" />
    }

    if (status === 'info') {
      return <Info className="h-5 w-5 text-blue-500 shrink-0" />
    }
    return null
  }

  return (
    <Comp
      className={`flex items-center gap-3 border rounded-md p-4 ${className ?? ''}`}
    >
      {renderIcon()}
      <div className="flex flex-1 flex-col">
        <div className="flex justify-between items-start">
          <h5 className="text-sm font-semibold leading-none">{title}</h5>
          {time && (
            <span className="text-xs text-muted-foreground">{time}</span>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </Comp>
  )
}

export { LogSlot }