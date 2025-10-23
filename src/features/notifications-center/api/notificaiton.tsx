import { authedAxios } from '@/lib/authed-axios'
import type { AppNotification } from '@/features/notifications/data/schema'

type NotificationLevel = AppNotification['level']

export async function insertNotification(
  title: string,
  message: string,
  level: NotificationLevel,
  scope: string,
): Promise<any> {
  const data = await authedAxios({
    url: '/api/notifications',
    method: 'POST',
    data: {
      title,
      message,
      level,
      scope,
    },
  })

  return data
}
