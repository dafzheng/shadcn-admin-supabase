import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { CompleteProfile } from '@/features/auth/complete-profile'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/complete-profile')({
  component: CompleteProfileRoute,
  validateSearch: searchSchema,
})

function CompleteProfileRoute() {
  const { redirect } = Route.useSearch()
  return <CompleteProfile redirectTo={redirect} />
}
