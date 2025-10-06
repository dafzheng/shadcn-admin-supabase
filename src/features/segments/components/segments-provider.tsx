import React, { useState, useEffect } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { segmentListSchema, Segment } from '../data/schema'
import { getSegment } from '../api/segment'

type SegmentsDialogType = 'invite' | 'add' | 'edit' | 'delete'

interface SegmentsContextType {
  open: SegmentsDialogType | null
  setOpen: (str: SegmentsDialogType | null) => void
  currentRow: Segment | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Segment | null>>
  segmentList: Segment[],
  refetchSegments: () => Promise<void>
  refetchLoading: boolean,
}

const SegmentsContext = React.createContext<SegmentsContextType | null>(null)

interface Props {
  children: React.ReactNode
}

export function SegmentsProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<SegmentsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Segment | null>(null)
  const [segmentList, setSegmentList] = useState<Segment[]>([])
  const [refetchLoading, setRefreshLoading] = useState<boolean>(false)

  const refetchSegments = async () => {
    try {
      setRefreshLoading(true)
      const res = await getSegment()
      setSegmentList(res)
      // const parsed = segmentListSchema.parse(res.data)
      // setSegmentList(parsed)
      setRefreshLoading(false)
    } catch (err) {
      console.error('Fetch segments failed:', err)
    }
  }

  useEffect(() => {
    refetchSegments()
  }, [])

  return (
    <SegmentsContext value={{ segmentList, refetchSegments, refetchLoading, open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </SegmentsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSegments = () => {
  const segmentsContext = React.useContext(SegmentsContext)

  if (!segmentsContext) {
    throw new Error('useSegments has to be used within <SegmentsContext>')
  }

  return segmentsContext
}
