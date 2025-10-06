import { Shield, UserCheck, Users, CreditCard } from 'lucide-react'
import { PipelineStatus } from './schema'
import { Loader2, CheckCircle2, XCircle, Info, PauseCircle } from "lucide-react"

export const callTypes = new Map<PipelineStatus, string>([
  ['queued', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['succeeded', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['canceled', 'bg-red-300/40 border-red-300'],
  ['running', 'bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300'],
  [
    'failed',
    'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10',
  ],
  ['info', 'bg-indigo-200/40 text-indigo-900 dark:text-indigo-100 border-indigo-300']

])

type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>

export const STATUS_META: Record<PipelineStatus, { icon: IconType; className: string; spin?: boolean }> = {
  queued:    { icon: PauseCircle,  className: "text-teal-600 dark:text-teal-200" },
  succeeded: { icon: CheckCircle2, className: "text-teal-600 dark:text-teal-200" },
  canceled:  { icon: XCircle,      className: "text-red-600 dark:text-red-400" },
  running:   { icon: Loader2,      className: "text-sky-600 dark:text-sky-200", spin: true },
  failed:    { icon: XCircle,      className: "text-destructive dark:text-primary" },
  info:      { icon: Info,         className: "text-indigo-600 dark:text-indigo-200" },

}

export const pipelineTypes = [
  {
    label: 'Superadmin',
    value: 'superadmin',
    icon: Shield,
  },
  {
    label: 'Admin',
    value: 'admin',
    icon: UserCheck,
  },
  {
    label: 'Manager',
    value: 'manager',
    icon: Users,
  },
  {
    label: 'Cashier',
    value: 'cashier',
    icon: CreditCard,
  },
] as const
