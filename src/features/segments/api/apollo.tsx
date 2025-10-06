import { authedAxios } from "@/lib/authed-axios";

export async function apolloTagsSearch(params: { search: string, kind: string }): Promise<any> {
  const resp = await authedAxios({
    url: "/api/apollo/tags-search",
    method: "GET",
    params: params
  });
  return resp;
}

export async function apolloOrganizationsSearch(params: { search: string }): Promise<any> {
  const resp = await authedAxios({
    url: "/api/apollo/organizations-search",
    method: "GET",
    params: params
  });
  return resp;
}

export async function apolloFacets(): Promise<any> {

  const resp = await authedAxios({
    url: "/api/apollo/mixed-people-facets",
    method: "GET",
    data: {}
  });
  return resp;

}

export async function apolloEmailStatus(): Promise<any> {
 const resp = await authedAxios({
    url: "/api/apollo/email-status",
    method: "GET",
    data: {}
  });
  return resp;
}

export async function apolloMixedPeopleUsage(): Promise<any> {
 const resp = await authedAxios({
    url: "/api/apollo/mixed-people-usage",
    method: "POST",
    data: {}
  });
  return resp;
}