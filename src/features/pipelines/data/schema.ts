import { z } from 'zod'

const pipelineStatusSchema = z.union([
  z.literal('queued'),
  z.literal('succeeded'),
  z.literal('running'),
  z.literal('failed'),
  z.literal('info'),
  z.literal('canceled'),
])
export type PipelineStatus = z.infer<typeof pipelineStatusSchema>



export const pipelineRawSchema = z.object({
  id: z.string(),
  pipeline_name: z.string(),
  target_segment: z.any(),
  category: z.array(z.string()),
  pipeline_campaigns: z.array(z.any()),
  // campaigns: z.array(z.object({
  //   description: z.string(),
  //   status: z.string(),
  //   email: z.string(),
  //   trigger_type: z.string(),
  //   trigger_content: z.string()
  // })),
  description: z.string(),
  created_at: z.string(),
})

export const pipelineSchema = pipelineRawSchema.transform(data => ({
  id: data.id,
  pipelineName: data.pipeline_name,
  // status: 'inactive',
  targetSegment: data.target_segment,
  category: data.category,
  pipelineCampaigns: data.pipeline_campaigns,
  description: data.description,
  createdAt: data.created_at
}))

export type Pipeline = z.infer<typeof pipelineSchema>

export const pipelineFormSchema = z
  .object({
    pipelineName: z.string().min(1, { message: 'Pipeline Name is required.' }),
    targetSegment: z.any(),
    category: z.array(z.string()),
    campaigns: z.array(z.any()),
    description: z.string(),
    isEdit: z.boolean(),
  }).refine(
    ({ targetSegment }) => {
      if (!targetSegment.id) {
        return false
      } else {
        return true
      }

    },
    {
      message: 'Please select a segment.',
      path: ['targetSegment'],
    }
  )

export type PipelineForm = z.infer<typeof pipelineFormSchema>

export const pipelineListSchema = z.array(pipelineSchema)

export const pipelineRawListSchema = z.array(pipelineRawSchema)


export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled' | 'info'

export type PipelineSnapshot = {
  pipeline_id: string
  org_id: string
  step: string
  status: JobStatus
  progress: number
  message: string | null
  payload: any | null
  created_at: string
}


export const pipelineLogRawSchema = z.object({
  id: z.number(),
  pipeline_id: z.string(),
  step: z.string(),
  status: z.string(),
  progress: z.number(),
  message: z.string(),
  created_at: z.string(),
})

export const pipelineLogSchema = pipelineLogRawSchema.transform(data => ({
  id: data.id,
  pipelineId: data.pipeline_id,
  step: data.step,
  status: data.status,
  progress: data.progress,
  message: data.message,
  createdAt: data.created_at
}))

export type PipelineLog = z.infer<typeof pipelineLogSchema>

export const pipelineLogListSchema = z.array(pipelineLogSchema)


export type CampaignStats = {
  campaign_id: number;
  sent_count: number;
  read_count: number;
  hit_count: number;
};


export type Campaign = {
  id: string
  pipeline_id: string
  order: number
  ref_id: number
  status: string
  email: any,
  started_at: string
  finished_at: string
  description: string
  trigger_type: string
  // email: number
};

// export type CampaignSnapshot = {
//   id: string
//   pipeline_id: string
//   order: number
//   ref_id: string
//   status: string
//   started_at: number
//   finished_at: number
// }