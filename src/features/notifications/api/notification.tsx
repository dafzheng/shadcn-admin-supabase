import { authedAxios } from "@/lib/authed-axios";

export async function getNotificationUnreadCount(): Promise<any> {
  const resp = await authedAxios({
    url: "/api/notifications/count",
    method: "GET",
  });

  console.log("getNotificationUnreadCount resp:", resp);
  return resp;
}