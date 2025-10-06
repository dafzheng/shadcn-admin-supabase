import * as React from 'react'
import { ChevronsUpDown, Plus } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useSupabaseAuth } from '@/features/auth/supabase/provider'
import { useAuthStore, type AuthActiveOrganization, type AuthOrganization } from '@/stores/auth-store'

type TeamOption = {
  id: string
  name: string
  plan: string | null
  role: string | null
  initials: string
  logo?: React.ElementType
}

function mapOrgToOption(org: AuthOrganization, index: number): TeamOption {
  const orgIdValue = org['org_id'] ?? org['id'] ?? org['slug'] ?? org['uid'] ?? null
  if (orgIdValue == null) {
    throw new Error('Organization is missing an identifiable key')
  }

  const nameCandidate = [
    typeof org['name'] === 'string' ? (org['name'] as string) : null,
    typeof org['title'] === 'string' ? (org['title'] as string) : null,
    typeof org['display_name'] === 'string' ? (org['display_name'] as string) : null,
    typeof org['slug'] === 'string' ? (org['slug'] as string) : null,
  ].find(Boolean)

  const planCandidate = [
    typeof org['plan'] === 'string' ? (org['plan'] as string) : null,
    typeof org['tier'] === 'string' ? (org['tier'] as string) : null,
    typeof org['subscription'] === 'string' ? (org['subscription'] as string) : null,
  ].find(Boolean)

  const idCandidate = (() => {
    if (typeof orgIdValue === 'string') return orgIdValue
    if (typeof orgIdValue === 'number') return String(orgIdValue)
    return `org-${index}`
  })()

  const name = nameCandidate ?? `Organization ${index + 1}`
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'OR'

  return {
    id: idCandidate,
    name,
    plan: planCandidate ?? null,
    role: typeof org['role'] === 'string' ? org['role'] : null,
    initials,
  }
}

function matchActiveOrg(option: TeamOption, active: AuthActiveOrganization | null) {
  if (!active) return false
  const possibleMatches = [
    typeof active === 'object' && active !== null && 'org_id' in active && typeof active['org_id'] === 'string'
      ? (active['org_id'] as string)
      : null,
    typeof active === 'object' && active !== null && 'org_id' in active && typeof active['org_id'] === 'number'
      ? String(active['org_id'])
      : null,
    typeof active === 'object' && active !== null && 'id' in active && typeof active['id'] === 'string'
      ? (active['id'] as string)
      : null,
    typeof active === 'object' && active !== null && 'id' in active && typeof active['id'] === 'number'
      ? String(active['id'])
      : null,
    typeof active === 'object' && active !== null && 'slug' in active && typeof active['slug'] === 'string'
      ? (active['slug'] as string)
      : null,
  ].filter((value): value is string => Boolean(value))

  return possibleMatches.includes(option.id)
}

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const authUser = useAuthStore((state) => state.auth.user)
  const setAuthUser = useAuthStore((state) => state.auth.setUser)
  const { client: supabase } = useSupabaseAuth()

  const orgOptions = React.useMemo<TeamOption[]>(() => {
    if (!authUser?.orgs?.length) return []
    return authUser.orgs
      .map((org, index) => {
        try {
          return mapOrgToOption(org, index)
        } catch (error) {
          console.warn('Skipping organization without identifier', { org, error })
          return null
        }
      })
      .filter((option): option is TeamOption => option !== null)
  }, [authUser?.orgs])

  const activeOptionFromAuth = React.useMemo(() => {
    if (!authUser?.activeOrg) return null
    return orgOptions.find((option) => matchActiveOrg(option, authUser.activeOrg)) ?? null
  }, [authUser?.activeOrg, orgOptions])

  const [activeTeamId, setActiveTeamId] = React.useState<string | null>(
    activeOptionFromAuth?.id ?? orgOptions[0]?.id ?? null
  )

  React.useEffect(() => {
    const nextActive = activeOptionFromAuth?.id ?? orgOptions[0]?.id ?? null
    setActiveTeamId((prev) => (prev === nextActive ? prev : nextActive))
  }, [activeOptionFromAuth?.id, orgOptions])

  const handleSelectTeam = React.useCallback(
    async (team: TeamOption) => {
      setActiveTeamId(team.id)

      try {
        // Persist active organization selection so the server keeps the session in sync.
        const { data, error } = await supabase.rpc('set_active_org', { p_org: team.id })
        if (error) throw error

        const nextActiveOrg = (Array.isArray(data) ? data[0] ?? null : data ?? null) as AuthActiveOrganization

        setAuthUser((prev) => {
          if (!prev) return prev
          const fallbackActiveOrg: AuthActiveOrganization = {
            ...(typeof prev.activeOrg === 'object' && prev.activeOrg !== null ? prev.activeOrg : {}),
            org_id: team.id,
          }

          return {
            ...prev,
            activeOrg: nextActiveOrg ?? fallbackActiveOrg,
          }
        })
      } catch (error) {
        console.error('Failed to update active organization', error)
        const fallbackId = activeOptionFromAuth?.id ?? null
        if (fallbackId && fallbackId !== team.id) {
          setActiveTeamId(fallbackId)
        }
      }
    },
    [activeOptionFromAuth?.id, setAuthUser, supabase]
  )

  if (!orgOptions.length) return null

  const activeTeam = orgOptions.find((team) => team.id === activeTeamId) ?? orgOptions[0]

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-semibold'>
                {activeTeam.logo ? <activeTeam.logo className='size-4' /> : activeTeam.initials}
              </div>
              <div className='grid flex-1 text-start text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  {activeTeam.name}
                </span>
                <span className='truncate text-xs'>{activeTeam.role ?? '—'}</span>
              </div>
              <ChevronsUpDown className='ms-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs'>
              Teams
            </DropdownMenuLabel>
            {orgOptions.map((team, index) => (
              <DropdownMenuItem
                key={team.id}
                onClick={() => {
                  void handleSelectTeam(team)
                }}
                className='gap-2 p-2'
              >
                <div className='flex size-6 items-center justify-center rounded-sm border text-[10px] font-semibold'>
                  {team.logo ? <team.logo className='size-4 shrink-0' /> : team.initials}
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className='gap-2 p-2'>
              <div className='bg-background flex size-6 items-center justify-center rounded-md border'>
                <Plus className='size-4' />
              </div>
              <div className='text-muted-foreground font-medium'>Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
