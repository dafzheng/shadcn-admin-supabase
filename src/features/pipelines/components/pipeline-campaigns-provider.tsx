import React, { useState, useEffect, useMemo } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { Campaign, CampaignStats } from '../data/schema'
import { getPipelineCampiagns, getPipelineCampiagnStats } from '../api/pipelines'
import { useAuthStore } from "@/stores/auth-store"
import { useSupabaseAuth } from '@/features/auth/supabase/provider'

type CampaignsDialogType = 'invite' | 'add' | 'edit' | 'delete' | 'detail'
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'

interface CampaignsContextType {
  open: CampaignsDialogType | null
  setOpen: (str: CampaignsDialogType | null) => void
  // currentRow: Campaign | null
  // setCurrentRow: React.Dispatch<React.SetStateAction<Campaign | null>>
  campaignList: Campaign[]
  refetchCampaigns: () => Promise<void>
  refetchCampaignStats: () => Promise<void>
  campaignLoading: boolean
  latestByCampaign: Record<string, Campaign>
  statsMap: Record<number, CampaignStats>
}

const CampaignsContext = React.createContext<CampaignsContextType | null>(null)

interface Props {
  children: React.ReactNode
  pipelineId: string
}


type CampaignStatsMap = Record<number, CampaignStats>;


function toStatusMap(list: CampaignStats[]): CampaignStatsMap {
  return list.reduce<CampaignStatsMap>((acc, item) => {
    acc[item.campaign_id] = item;
    return acc;
  }, {});
}

export function CampaignsProvider({ children, pipelineId }: Props) {
  const [open, setOpen] = useDialogState<CampaignsDialogType>(null)
  const [campaignList, setCampaignList] = useState<Campaign[]>([])
  const [campaignLoading, setCampaignLoading] = useState<boolean>(false)
  const [statsLoading, setStatsLoading] = useState<boolean>(false)
  const [statsMap, setStatsMap] = useState<CampaignStatsMap>({});
  const [latestByCampaign, setLatestByCampaign] = useState<Record<string, Campaign>>({})
  const { client } = useSupabaseAuth()


  const token = useAuthStore((s) => s.auth.accessToken)

  const refetchCampaigns = async () => {
    try {
      setCampaignLoading(true)
      const res = await getPipelineCampiagns(pipelineId)


      setCampaignList(res)
      console.log('campaign = ', res)
      // const dict: Record<string, CampaignSnapshot> = {}
      //   ; (statusSnapshot ?? []).forEach((s: any) => { dict[s.campaign_id] = s })
      // setLatestByCampaign(dict)

      setCampaignLoading(false)
    } catch (err) {
      console.error('Fetch campaigns failed:', err)
    }
  }

  const refetchCampaignStats = async () => {
    try {
      setStatsLoading(true)
      const statsRes = await getPipelineCampiagnStats(pipelineId)
      console.log('statsRes = ', statsRes)
      setStatsMap(toStatusMap(statsRes));
      setStatsLoading(false)
    } catch (err) {
      console.error('Fetch stats failed:', err)
    }
  }

  // useEffect(() => {
  //   refetchCampaigns()
  //   refetchCampaignStats()
  // }, [])


  useEffect(() => {
    if (!pipelineId) {
      console.log('no pipelineId...')
      return
    }

    client.realtime.setAuth(token)
    client.realtime.connect()
    const channel = client
      .channel(`pipeline_id:${pipelineId}:pipeline_campaigns`)
      .on('postgres_changes', {
        // event: 'INSERT',
        event: '*',
        schema: 'public',
        table: 'pipeline_campaigns',
        filter: `pipeline_id=eq.${pipelineId}`,
      }, (payload) => {
        console.log('payload cam = ', payload)
        if (payload.eventType === 'UPDATE') {
          console.log('update stats')
          refetchCampaignStats()
        }
        const row = payload.new as Campaign
        setLatestByCampaign(prev => ({
          ...prev,
          [row.id]: row
        }))

      })
      .subscribe((status) => {
        console.log('Realtime status', status)
      })

    return () => { client.removeChannel(channel) }
  }, [pipelineId])



  // const ctxValue = useMemo<CampaignsContextType>(() => ({
  //   campaignList,
  //   refetchCampaigns,
  //   refetchLoading,
  //   open,
  //   setOpen,
  //   currentRow,
  //   setCurrentRow,
  // latestByCampaign,
  // }), [campaignList, refetchCampaigns, refetchLoading, open, setOpen, currentRow, latestByCampaign])

  const ctxValue = useMemo<CampaignsContextType>(() => ({
    campaignList,
    refetchCampaigns,
    campaignLoading,
    open,
    setOpen,
    latestByCampaign,
    refetchCampaignStats,
    statsMap
  }), [
    campaignList,
    refetchCampaigns,
    campaignLoading,
    open,
    setOpen,
    latestByCampaign,
    refetchCampaignStats,
    statsMap
  ])

  return (
    <CampaignsContext.Provider value={ctxValue}>
      {children}
    </CampaignsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCampaigns = () => {
  const campaignsContext = React.useContext(CampaignsContext)

  if (!campaignsContext) {
    throw new Error('useCampaigns has to be used within <CampaignsContext>')
  }

  return campaignsContext
}
