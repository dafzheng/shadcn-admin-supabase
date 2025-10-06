import { createFileRoute } from '@tanstack/react-router'
import { Segments } from '@/features/segments'

export const Route = createFileRoute('/_authenticated/segments/')({
  component: Segments,
})
