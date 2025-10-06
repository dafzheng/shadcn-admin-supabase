import { PipelineForm, pipelineListSchema, pipelineLogListSchema } from "../data/schema";
import { authedAxios } from "@/lib/authed-axios";

export async function upsertPipeline(id: string | undefined, pipeline: PipelineForm): Promise<any> {

  const pipeline_campaigns = pipeline.campaigns.map(campaign => ({
    trigger_type: campaign.triggerType,
    trigger_content: campaign.triggerContent,
    description: campaign.description,
    email_id: campaign.email.id,
  }))

  const resp = await authedAxios({
    url: "/api/pipelines",
    method: "POST",
    data: {
      id,
      pipeline_name: pipeline.pipelineName,
      target_segment_id: pipeline.targetSegment.id,
      pipeline_campaigns,
      category: pipeline.category,
      description: pipeline.description
    }
  });

  return resp.data;
}

export async function activePipeline(id: string): Promise<any> {

  const resp = await authedAxios({
    url: `/api/pipelines/${id}/active`,
    method: "POST",
    data: {}
  });

  return resp.data;
}

export async function activePipelineCampaign(pipelineId: string, campaignId: string, status: string): Promise<any> {

  const resp = await authedAxios({
    url: `/api/pipelines/${pipelineId}/campaigns/${campaignId}/status`,
    method: "POST",
    data: {
      status
    }
  });

  return resp.data;
}

export async function getPipeline(): Promise<any> {
  const resp = await authedAxios({
    url: "/api/pipelines",
    method: "GET",
  });

  const parsed = pipelineListSchema.parse(resp.data)

  return parsed;
}

export async function getPipelineStatusSnapshot(): Promise<any> {
  const resp = await authedAxios({
    url: "/api/pipelines/status-snapshot",
    method: "GET",
  });

  return resp.data;
}

export async function getPipelineCampiagns(pipelineId: string): Promise<any> {
  const resp = await authedAxios({
    url: `/api/pipelines/${pipelineId}/campaigns/details`,
    method: "GET",
  });

  return resp.data;
}



export async function getPipelineCampiagnStats(pipelineId: string): Promise<any> {
  const resp = await authedAxios({
    url: `/api/pipelines/${pipelineId}/campaigns/stats`,
    method: "GET",
  });

  return resp.data;
}


export async function deletePipelines(ids: string[]): Promise<void> {

  const resp = await authedAxios({
    url: "/api/pipelines",
    method: "DELETE",
    data: { ids }
  });
  return resp.data;
}

export async function getPipelineLogs(id: string): Promise<any> {
  const resp = await authedAxios({
    url: `/api/pipelines/${id}/logs`,
    method: "GET",
  });

  const parsed = pipelineLogListSchema.parse(resp.data)
  return parsed;
}