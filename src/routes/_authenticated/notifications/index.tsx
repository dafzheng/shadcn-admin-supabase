import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { NotificationsCenter } from '@/features/notifications-center'

const notificationsSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  level: z
    .array(z.enum(['info', 'success', 'warning', 'error']))
    .optional()
    .catch([]),
  read: z
    .array(z.enum(['read', 'unread']))
    .optional()
    .catch([]),
  filter: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/notifications/')({
  validateSearch: notificationsSearchSchema,
  component: NotificationsCenter,
})
