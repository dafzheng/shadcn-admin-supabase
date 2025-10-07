import { authedAxios } from "@/lib/authed-axios";
import { UserForm, userListSchema } from '../data/schema'


export async function getAccountOrg(): Promise<any> {
  const resp = await authedAxios({
    url: "/api/accounts/orgs",
    method: "GET",
  });
  return resp;
}

export async function getUsers(): Promise<any> {
  const resp = await authedAxios({
    url: "/api/tenants/users",
    method: "GET",
  });
  console.log('resp.data = ', resp.data)
  const parsed = userListSchema.parse(resp.data);
  return parsed;
}

export async function addUser(user: UserForm): Promise<any> {
  const resp = await authedAxios({
    url: "/api/tenants/users",
    method: "POST",
    data: {
      full_name: user.fullName,
      email: user.email,
      role: user.role,
      password: user.password,
      sendInvite: false,
    }
  });
  return resp.data;
}


export async function sendInvitationEmail(email: string, role: string, description: string): Promise<any> {

  const resp = await authedAxios({
    url: "/api/tenants/invitations",
    method: "POST",
    data: {
      email,
      role,
      description
    }
  });
  return resp.data;
}