import { SegmentForm, segmentListSchema } from "../data/schema";
import { authedAxios } from "@/lib/authed-axios";

export async function querySegment(id: string): Promise<any> {

  const resp = await authedAxios({
    url: `/api/segments/${id}/query`,
    method: "POST",
    data: {}
  });
  return resp.data;
}

export async function getQueryURL(id: string): Promise<any> {
  const resp = await authedAxios({
    url: `/api/segments/${id}/query`,
    method: "GET",
    data: {}
  });
  return resp.data;
}

export async function upsertSegment(id: string, segment: SegmentForm): Promise<any> {
  const resp = await authedAxios({
    url: "/api/segments",
    method: "POST",
    data: {
      id,
      segment_name: segment.segmentName,
      person_titles: segment.personTitles,
      email_status: segment.emailStatus,
      organization: segment.organization,
      industry: segment.industry,
      employees: segment.employees,
      person_locations: segment.personLocations,
      revenue_range: segment.revenueRange,
      description: segment.description
    }
  });
  return resp.data;
}


export async function deleteSegments(ids: string[]): Promise<void> {

  const resp = await authedAxios({
    url: "/api/segments",
    method: "DELETE",
    data: { ids }
  });
  return resp.data;
}


export async function getSegment(): Promise<any> {
  const resp = await authedAxios({
    url: "/api/segments",
    method: "GET",
  });

  const parsed = segmentListSchema.parse(resp.data); // 根據你的 API 回傳格式
  return parsed;
}

// export async function getSegment(): Promise<any> {
//   const accessToken = useAuthStore.getState().auth.accessToken

//   console.log('here = ', accessToken)

//   if (!accessToken) {
//     throw new Error("No Supabase access token found.");
//   }

//   const resp = await axios.get<any>(
//     "/api/segments",
//     {
//       headers: {
//         Authorization: `Bearer ${accessToken}`,
//       },
//     }
//   );
//   const parsed = segmentListSchema.parse(resp.data.data)

//   return parsed;
// }

