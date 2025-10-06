import { z } from 'zod'
import { useForm } from 'react-hook-form'
import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'

import { Input } from '@/components/ui/input'
import { LogSlot } from '@/components/ui/log-slot'
import { CampaignSlot } from '@/components/ui/campaign-slot'
import { ArrowBigDown } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getPipelineLogs, activePipelineCampaign, getPipelineCampiagnStats } from '../api/pipelines'
import { Pipeline, PipelineLog, CampaignStats } from '../data/schema'
import { useCampaigns } from './pipeline-campaigns-provider'
import dayjs from "dayjs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LongText } from '@/components/long-text'

type PipelineMutateDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: Pipeline
  pipelineId: string
}





// type CampaignStatsMap = Record<number, CampaignStats>;


// function toStatusMap(list: CampaignStats[]): CampaignStatsMap {
//   return list.reduce<CampaignStatsMap>((acc, item) => {
//     acc[item.campaign_id] = item;
//     return acc;
//   }, {});
// }

export function PipelinesMutateDrawer({
  open,
  onOpenChange,
  currentRow,
  pipelineId,
}: PipelineMutateDrawerProps) {

  const [logLoading, setLogLoading] = useState<boolean>(false)
  const [pipelineLogList, setPipelineLogList] = useState<PipelineLog[]>([])
  const [tab, setTab] = useState<'campaigns' | 'logs'>('campaigns')

  // const [statsMap, setStatsMap] = useState<CampaignStatsMap>({});
  const {
    campaignList,
    latestByCampaign,
    statsMap,
    refetchCampaigns,
    refetchCampaignStats,
    campaignLoading
  } = useCampaigns()

  const fetchLogs = async () => {
    try {
      setLogLoading(true)
      const logsRes = await getPipelineLogs(pipelineId)
      console.log('logsRes = ', logsRes)
      setPipelineLogList(logsRes)
      setLogLoading(false)
    } catch (err) {
      console.error('Fetch logs failed:', err)
    }
  }

  useEffect(() => {
    if (tab === 'logs') {
      if (!logLoading) {
        fetchLogs()
      }
    }

    if (tab === 'campaigns') {
      refetchCampaigns()
      refetchCampaignStats()
    }

  }, [tab])

  useEffect(() => {
    fetchLogs()
  }, [])


  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
      }}
    >
      <SheetContent className='flex flex-col'>
        <SheetHeader className='text-start'>
          <SheetTitle>{currentRow?.pipelineName}</SheetTitle>
          <SheetDescription>
            {currentRow?.description}
          </SheetDescription>
        </SheetHeader>



        <div className="flex-1 space-y-6 overflow-y-auto px-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'campaigns' | 'logs')} className="w-full">
            <TabsList>
              <TabsTrigger value="campaigns">
                Campaigns
                <span className="ml-2 text-xs text-muted-foreground">
                  {campaignList.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="logs">
                Logs
                <span className="ml-2 text-xs text-muted-foreground">
                  {pipelineLogList.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="campaigns" className="space-y-6">
              {campaignLoading ? (
                <p className="text-sm text-muted-foreground">Loading campaigns...</p>
              ) : campaignList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No campaigns.</p>
              ) : (
                campaignList.map((campaign) => (
                  <React.Fragment key={campaign.id}>
                    <CampaignSlot
                      title={`#${campaign.order}`}
                      description={campaign.description}
                      status={latestByCampaign[campaign.id]?.status || campaign.status}
                      email={campaign.email.email_name}
                      stats={statsMap[campaign.ref_id]}
                      start={dayjs(
                        latestByCampaign[campaign.id]?.started_at || campaign.started_at
                      )
                        .format("YYYY-MM-DD HH:mm:ss")
                        .replace("Invalid Date", "-")}
                      finish={dayjs(
                        latestByCampaign[campaign.id]?.finished_at || campaign.finished_at
                      )
                        .format("YYYY-MM-DD HH:mm:ss")
                        .replace("Invalid Date", "-")}
                      triggerType={campaign.trigger_type}
                      onRun={() => activePipelineCampaign(pipelineId, campaign.id, 'active')}
                      onFinish={() => activePipelineCampaign(pipelineId, campaign.id, 'finish')}
                    />
                  </React.Fragment>
                ))
              )}
            </TabsContent>

            {/* Logs Tab */}
            <TabsContent value="logs" className="space-y-6">
              {logLoading ? (
                <p className="text-sm text-muted-foreground">Loading logs...</p>
              ) : pipelineLogList.length === 0 ? (
                <p className="text-sm text-muted-foreground">No logs.</p>
              ) : (
                pipelineLogList.map((log, index) => (
                  <React.Fragment key={log.id}>
                    <LogSlot
                      title={log.step}
                      description={log.message}
                      status={log.status}
                      time={dayjs(log.createdAt).format("YYYY-MM-DD HH:mm:ss")}
                    />
                    {index < pipelineLogList.length - 1 && (
                      <div className="flex justify-center">
                        <ArrowBigDown className="h-6 w-6" />
                      </div>
                    )}
                  </React.Fragment>
                ))
              )}
            </TabsContent>
          </Tabs>



          {/* {campaignList.map((campaign, index) => (
            <React.Fragment key={index}>
              <CampaignSlot
                title={`#${campaign.order}`}
                description={campaign.description}
                status={latestByCampaign[campaign.id]?.status || campaign.status}
                // email={campaign.email}
                email={'temp'}
                stats={statsMap[campaign.ref_id]}
                start={dayjs(latestByCampaign[campaign.id]?.started_at || campaign.started_at).format("YYYY-MM-DD HH:mm:ss").replace("Invalid Date", "-")}
                finish={dayjs(latestByCampaign[campaign.id]?.finished_at || campaign.finished_at).format("YYYY-MM-DD HH:mm:ss").replace("Invalid Date", "-")}
                triggerType={campaign.trigger_type}
                onRun={() => activePipelineCampaign(pipelineId, campaign.id, 'active')}
                onFinish={() => activePipelineCampaign(pipelineId, campaign.id, 'finish')}
              />
            </React.Fragment>
          ))}


          {pipelineLogList.map((log, index) => (
            <React.Fragment key={log.id}>
              <LogSlot
                title={log.step}
                description={log.message}
                status={log.status}
                time={dayjs(log.createdAt).format("YYYY-MM-DD HH:mm:ss")}
              />

              {index < pipelineLogList.length - 1 && (
                <div className="flex justify-center">
                  <ArrowBigDown className="h-6 w-6" />
                </div>
              )}
            </React.Fragment>
          ))} */}

        </div>
        <SheetFooter className='gap-2'>
          <SheetClose asChild>
            <Button variant='outline'>Close</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
