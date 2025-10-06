import React, { useState, useEffect, useMemo } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { PipelineSnapshot, Pipeline } from '../data/schema'
import { getPipeline, getPipelineStatusSnapshot } from '../api/pipelines'
import { useAuthStore } from "@/stores/auth-store"
import { useSupabaseAuth } from '@/features/auth/supabase/provider'

type PipelinesDialogType = 'invite' | 'add' | 'edit' | 'delete' | 'detail'
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'

interface PipelinesContextType {
  open: PipelinesDialogType | null
  setOpen: (str: PipelinesDialogType | null) => void
  currentRow: Pipeline | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Pipeline | null>>
  pipelineList: Pipeline[]
  refetchPipelines: () => Promise<void>
  refetchLoading: boolean
  latestByPipeline: Record<string, PipelineSnapshot>
}

const PipelinesContext = React.createContext<PipelinesContextType | null>(null)

interface Props {
  children: React.ReactNode
}

export function PipelinesProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<PipelinesDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Pipeline | null>(null)
  const [pipelineList, setPipelineList] = useState<Pipeline[]>([])
  const [refetchLoading, setRefreshLoading] = useState<boolean>(false)
  const [latestByPipeline, setLatestByPipeline] = useState<Record<string, PipelineSnapshot>>({})
  const { client } = useSupabaseAuth()

  const user = useAuthStore((s) => s.auth.user)
  const token = useAuthStore((s) => s.auth.accessToken)

  const activeOrgId = user?.activeOrg?.['org_id'] ?? ''

  const refetchPipelines = async () => {
    try {
      setRefreshLoading(true)
      const res = await getPipeline()
      const statusSnapshot = await getPipelineStatusSnapshot()

      setPipelineList(res)
      console.log('pipeline = ', res)
      const dict: Record<string, PipelineSnapshot> = {}
        ; (statusSnapshot ?? []).forEach((s: any) => { dict[s.pipeline_id] = s })
      setLatestByPipeline(dict)

      setRefreshLoading(false)
    } catch (err) {
      console.error('Fetch pipelines failed:', err)
    }
  }

  useEffect(() => {
    refetchPipelines()
  }, [])


  useEffect(() => {
    if (!activeOrgId) {
      console.log('no activeOrgId...')
      return
    }
    // testf()
    console.log('active = ', activeOrgId)

    client.realtime.setAuth(token)
    client.realtime.connect()
    const channel = client
      .channel(`org:${activeOrgId}:pipelines`)
      .on('postgres_changes', {
        // event: 'INSERT',
        event: '*',
        schema: 'public',
        table: 'pipeline_process_log',
        filter: `org_id=eq.${activeOrgId}`,

      }, (payload) => {
        console.log('payload = ', payload)
        const row = payload.new as {
          org_id: string
          pipeline_id: string
          step: string
          status: JobStatus
          progress: number
          message: string | null
          payload: any | null
          created_at: string
        }
        console.log('[realtime]', payload.eventType, {
          new: payload.new, old: payload.old
        })
        setLatestByPipeline(prev => ({
          ...prev,
          [row.pipeline_id]: {
            pipeline_id: row.pipeline_id,
            org_id: row.org_id,
            step: row.step,
            status: row.status,
            progress: row.progress ?? 0,
            message: row.message ?? null,
            payload: row.payload ?? null,
            created_at: row.created_at,
          }
        }))
      })
      .subscribe((status) => {
        console.log('Realtime status', status)
      })

    return () => { client.removeChannel(channel) }
  }, [activeOrgId])



  const ctxValue = useMemo<PipelinesContextType>(() => ({
    pipelineList,
    refetchPipelines,
    refetchLoading,
    open,
    setOpen,
    currentRow,
    setCurrentRow,
    latestByPipeline,
  }), [pipelineList, refetchPipelines, refetchLoading, open, setOpen, currentRow, latestByPipeline])


  return (
    <PipelinesContext value={ctxValue}>
      {children}
    </PipelinesContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const usePipelines = () => {
  const pipelinesContext = React.useContext(PipelinesContext)

  if (!pipelinesContext) {
    throw new Error('usePipelines has to be used within <PipelinesContext>')
  }

  return pipelinesContext
}
