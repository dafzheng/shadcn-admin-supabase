import { Shield, UserCheck, Users, CreditCard } from 'lucide-react'
import { SegmentStatus, range } from './schema'

export const callTypes = new Map<SegmentStatus, string>([
  ['active', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['inactive', 'bg-neutral-300/40 border-neutral-300'],
  ['invited', 'bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300'],
  [
    'suspended',
    'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10',
  ],
])

export const rangeTypes = new Map<range, string>([
  ['max', 'bg-pink-100/30 text-pink-900 dark:text-pink-200 border-pink-200'],
  ['min', 'bg-blue-300/40 border-blue-300'],
])

export const segmentTypes = [
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
