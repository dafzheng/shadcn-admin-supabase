import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { HeaderNotificationsMenu } from '@/components/layout/header-notifications-menu'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { SegmentsDialogs } from './components/segments-dialogs'
import { SegmentsPrimaryButtons } from './components/segments-primary-buttons'
import { SegmentsProvider } from './components/segments-provider'
import { SegmentsTable } from './components/segments-table'

const route = getRouteApi('/_authenticated/segments/')

export function Segments() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <SegmentsProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <HeaderNotificationsMenu />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Segment List</h2>
            <p className='text-muted-foreground'>
              Manage your segments here.
            </p>
          </div>
          <SegmentsPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <SegmentsTable search={search} navigate={navigate} />
        </div>
      </Main>

      <SegmentsDialogs />
    </SegmentsProvider>
  )
}
