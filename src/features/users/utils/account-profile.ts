import { z } from 'zod'
import type { AuthAccountProfile } from '@/stores/auth-store'

export const accountProfileSchema = z
  .object({
    id: z.string(),
    full_name: z.string(),
    avatar_url: z.string().nullish(),
    email: z.string().nullish(),
    created_at: z.string(),
    updated_at: z.string(),
    status: z.string(),
  })
  .transform<AuthAccountProfile>((profile) => ({
    id: profile.id,
    fullName: profile.full_name.trim(),
    avatarUrl:
      typeof profile.avatar_url === 'string' && profile.avatar_url.trim().length > 0
        ? profile.avatar_url
        : null,
    email:
      typeof profile.email === 'string' && profile.email.trim().length > 0
        ? profile.email
        : null,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    status: profile.status,
  }))

export function parseAccountProfile(raw: unknown): AuthAccountProfile | null {
  if (raw === null || raw === undefined) return null

  const candidates: unknown[] = []

  if (Array.isArray(raw)) {
    candidates.push(...raw)
  }

  if (typeof raw === 'object' && raw !== null) {
    candidates.push(raw)
    const record = raw as Record<string, unknown>
    if ('data' in record) {
      const data = record.data
      if (Array.isArray(data)) {
        candidates.push(...data)
      } else if (data !== null && data !== undefined) {
        candidates.push(data)
      }
    }
  } else {
    candidates.push(raw)
  }

  for (const candidate of candidates) {
    const result = accountProfileSchema.safeParse(candidate)
    if (result.success) {
      return result.data
    }
  }

  return null
}
