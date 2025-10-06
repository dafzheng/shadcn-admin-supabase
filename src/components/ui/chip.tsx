import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

type ChipProps = {
  label: string
  value: string
  onClose: (value: string) => void
}

export function Chip({ label, value, onClose }: ChipProps) {
  return (
    <span className="inline-flex items-center px-3 py-1 bg-muted rounded-2xl text-sm font-medium border border-muted-foreground/10 gap-1 shadow-sm mr-2">
      {label}
      <Button
        variant="ghost"
        size="icon"
        className="w-5 h-5 ml-1 rounded-full"
        onClick={() => onClose(value)}
        tabIndex={-1}
      >
        <X className="w-3 h-3" />
      </Button>
    </span>
  )
}