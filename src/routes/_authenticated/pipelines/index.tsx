import { createFileRoute } from '@tanstack/react-router'
import { Pipelines } from '@/features/pipelines'

export const Route = createFileRoute('/_authenticated/pipelines/')({
  component: Pipelines,
})
