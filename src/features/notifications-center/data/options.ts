import type { AppNotification } from '@/features/notifications/data/schema'
import { CheckCircle2, Info, Square, TriangleAlert, XCircle } from 'lucide-react'

export const notificationLevels: Array<{
  label: string
  value: AppNotification['level']
  icon?: React.ComponentType<{ className?: string }>
}> = [
  { label: 'Info', value: 'info', icon: Info },
  { label: 'Success', value: 'success', icon: CheckCircle2 },
  { label: 'Warning', value: 'warning', icon: TriangleAlert },
  { label: 'Error', value: 'error', icon: XCircle },
]

export const notificationReadStates = [
  { label: 'Unread', value: 'unread', icon: Square },
  { label: 'Read', value: 'read', icon: CheckCircle2 },
]

export function getNotificationLevelMeta(level: AppNotification['level']) {
  return notificationLevels.find((option) => option.value === level)
}

export type NotificationScope = 'global' | 'organization' | 'user'

export function resolveNotificationScope(notification: AppNotification): NotificationScope {
  if (notification.userId) return 'user'
  if (notification.orgId) return 'organization'
  return 'global'
}
