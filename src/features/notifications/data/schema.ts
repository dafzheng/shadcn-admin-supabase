import { z } from 'zod'

export type AppNotification = {
  id: string
  title: string
  message: string
  level: 'info' | 'success' | 'warning' | 'error'
  publishedAt: string
  expiresAt: string | null
  metadata: Record<string, unknown>
  userId: string | null
  orgId: string | null
  readAt: string | null
}

export const notificationRowSchema = z
  .object({
    id: z.string(),
    title: z.string().min(1),
    message: z.string().min(1),
    level: z
      .string()
      .transform((value) => value.toLowerCase())
      .pipe(z.enum(['info', 'success', 'warning', 'error']).catch('info')),
    published_at: z.string(),
    expires_at: z.string().nullish(),
    metadata: z.record(z.any()).nullish(),
    user_id: z.string().nullish(),
    org_id: z.string().nullish(),
    read_at: z.string().nullish(),
  })
  .transform<AppNotification>((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    level: row.level,
    publishedAt: row.published_at,
    expiresAt: row.expires_at ?? null,
    metadata: row.metadata ?? {},
    userId: row.user_id ?? null,
    orgId: row.org_id ?? null,
    readAt: row.read_at ?? null,
  }))

export function parseNotification(raw: unknown): AppNotification | null {
  const result = notificationRowSchema.safeParse(raw)
  return result.success ? result.data : null
}

export function parseNotificationList(raw: unknown): AppNotification[] {
  if (!Array.isArray(raw)) {
    const single = parseNotification(raw)
    return single ? [single] : []
  }
  return raw
    .map(parseNotification)
    .filter((notification): notification is AppNotification => Boolean(notification))
}
