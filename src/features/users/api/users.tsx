import { authedAxios } from "@/lib/authed-axios";
import { UserForm, userListSchema } from '../data/schema'


export async function getAccountOrg(): Promise<any> {
  const resp = await authedAxios({
    url: "/api/accounts/orgs",
    method: "GET",
  });
  return resp;
}

export async function updateAccountProfile(full_name: string): Promise<any> {
  const resp = await authedAxios({
    url: "/api/accounts/profiles",
    method: "PATCH",
    data: {
      full_name,
    }
  });
  return resp;
}

export async function updateAccountProviderProfile(full_name: string, token: string): Promise<any> {
  const resp = await authedAxios({
    url: "/api/accounts/provider/profiles",
    method: "PATCH",
    data: {
      full_name,
      token,
    }
  });
  return resp;
}


export async function getAccountProfile(): Promise<any> {
  const resp = await authedAxios({
    url: "/api/accounts/profiles",
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
    url: "/api/tenants/test",
    method: "POST",
    data: {
      email,
      role,
      description
    }
  });
  return resp.data;
}

export type InviteRole = 'owner' | 'member' | 'viewer'

export type InviteTokenResult = {
  tokens: string[]
  expiresAt: Date | null
}

export async function genInviteToken(count: number, role: InviteRole): Promise<InviteTokenResult> {
  const payload = await authedAxios<{ tokens?: unknown; data?: unknown; expireAt?: unknown; expiresAt?: unknown }>({
    url: '/api/tenants/users/invite-tokens',
    method: 'POST',
    data: {
      count,
      role,
    },
  })

  const extractTokens = (raw: unknown): string[] => {
    if (!Array.isArray(raw)) return []
    return raw
      .filter((token): token is string => typeof token === 'string' && token.trim().length > 0)
      .map((token) => token.trim())
  }

  const collectTokens = (raw: unknown): string[] => {
    const direct = extractTokens(raw)
    if (direct.length) return direct
    if (!raw || typeof raw !== 'object') return []
    const record = raw as Record<string, unknown>
    if ('tokens' in record) {
      const nestedTokens = collectTokens(record.tokens)
      if (nestedTokens.length) return nestedTokens
    }
    if ('data' in record) {
      const nestedDataTokens = collectTokens((record as { data?: unknown }).data)
      if (nestedDataTokens.length) return nestedDataTokens
    }
    return []
  }

  const parseDate = (value: unknown): Date | null => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : date
    }
    if (typeof value === 'string') {
      const numeric = Number(value)
      if (!Number.isNaN(numeric)) {
        return parseDate(numeric)
      }
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : date
    }
    return null
  }

  const tokens = collectTokens(payload)

  const resolveExpiresAt = (raw: unknown): Date | null => {
    if (!raw || typeof raw !== 'object') return null
    const record = raw as Record<string, unknown>
    const directKeys = ['expireAt', 'expiresAt'] as const
    for (const key of directKeys) {
      const result = parseDate(record[key])
      if (result) return result
    }
    if ('data' in record) {
      return resolveExpiresAt((record as { data?: unknown }).data)
    }
    return null
  }

  const expiresAt = resolveExpiresAt(payload)

  return {
    tokens,
    expiresAt,
  }
}
