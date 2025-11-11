export type SupportUser = {
  id: string
  name: string
  email: string
  region: 'APAC' | 'EMEA' | 'AMER'
  shift: string
  status: 'online' | 'away' | 'offline'
}

export const supportUsers: SupportUser[] = [
  {
    id: 'SUP-204',
    name: 'Lena Chang',
    email: 'lena.chang@supporthub.io',
    region: 'APAC',
    shift: 'Sun-Thu, 08:00-16:00 JST',
    status: 'online',
  },
  {
    id: 'SUP-118',
    name: 'Mateo Silva',
    email: 'mateo.silva@supporthub.io',
    region: 'AMER',
    shift: 'Mon-Fri, 09:00-17:00 CST',
    status: 'away',
  },
  {
    id: 'SUP-352',
    name: 'Sara Benali',
    email: 'sara.benali@supporthub.io',
    region: 'EMEA',
    shift: 'Mon-Fri, 10:00-18:00 CET',
    status: 'online',
  },
  {
    id: 'SUP-441',
    name: 'Noah Patel',
    email: 'noah.patel@supporthub.io',
    region: 'APAC',
    shift: 'Tue-Sat, 12:00-20:00 SGT',
    status: 'offline',
  },
]
