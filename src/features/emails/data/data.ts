import { Shield, UserCheck, Users, CreditCard, FileText, Video } from 'lucide-react'
import { EmailStatus } from './schema'

export const callTypes = new Map<EmailStatus, string>([
  ['available', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['building', 'bg-sky-200/40 text-sky-900 dark:text-sky-100 border-sky-300'],
  [
    'error',
    'bg-destructive/10 dark:bg-destructive/50 text-destructive dark:text-primary border-destructive/10',
  ],
])


export const emailTypes = [
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




export const newsletterTypes = [
  {
    label: 'Text',
    value: 'text',
    icon: FileText,
  },
  {
    label: 'Video',
    value: 'video',
    icon: Video,
  }
] as const

export const tones = [
  {
    label: 'Professional',
    value: 'Professional',
  },
  {
    label: 'Funny',
    value: 'Funny',
  }
] as const

export const numberOfTopicList = [
  {
    label: 'From 2 to 3',
    value: 'from 2 to 3',
  },
  {
    label: 'From 4 to 6',
    value: 'from 4 to 6',
  }
] as const

export const avatarList = [
  {
    label: 'Annie',
    value: 'Annie',
  },
  {
    label: 'Armando',
    value: 'Armando',
  },
  {
    label: 'Caroline',
    value: 'Caroline',
  },
  {
    label: 'Onat',
    value: 'Onat',
  },
    {
    label: 'Tuba',
    value: 'Tuba',
  }
] as const


export const A4_WIDTH: string = '210mm';
export const A4_HEIGHT: string = '297mm';
export const A4_PADDING: string = '20mm';

export const INITIAL_STYLES: string = `
  body {
    margin: 0;
    background: #f0f0f0;
    display: flex;
    justify-content: center;
  }
  .a4-page {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: ${A4_WIDTH};
    height: ${A4_HEIGHT};
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
    padding: ${A4_PADDING};
    box-sizing: border-box;
    overflow: hidden;
    page-break-after: always;
  }
  .a4-page:last-child {
    page-break-after: auto;
  }
`

export const EXPORT_CSS: string = `
  @page { size: A4 portrait; margin: 0; }
  body { margin: 0; padding: 0; display: block !important; }

  .a4-page {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: ${A4_WIDTH};
    height: ${A4_HEIGHT};
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
    padding: ${A4_PADDING};
    box-sizing: border-box;
    overflow: hidden;
    page-break-after: always;
  }

  .a4-page:last-child {
    page-break-after: auto;
  }

  .a4-page * {
    break-inside: avoid;
    page-break-inside: avoid;
  }
`