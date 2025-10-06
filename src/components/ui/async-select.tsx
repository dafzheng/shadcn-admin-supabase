import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useEffect, useState } from "react"

type AsyncSelectProps<T> = {
  request: () => Promise<any>             // 傳入 request function
  getLabel: (item: T) => string           // 如何取 label
  getValue: (item: T) => string           // 如何取 value
  value?: T
  onChange: (val: T) => void
  placeholder?: string,
  className?: string,
}

export function AsyncSelect<T>({
  request,
  getLabel,
  getValue,
  value,
  onChange,
  placeholder = "請選擇",
  className = "",
}: AsyncSelectProps<T>) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res = await request()

        console.log('res = ', res)
        setItems(res)

      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [request])

  return (
    <div className={`flex flex-col w-full gap-2 ${className}`}>
      <Select value={value ? getValue(value) : undefined} // 用 id 當 value
        onValueChange={(val) => {
          const selected = items.find((item) => getValue(item) === val)
          if (selected) {
            onChange(selected)
          }
        }}
        disabled={loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={loading ? "Loading..." : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item, i) => (
            <SelectItem key={i} value={getValue(item)}>
              {getLabel(item)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
