import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { HeaderNotificationsMenu } from '@/components/layout/header-notifications-menu'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { NotificationsTable } from './components/notifications-table'

export function NotificationsCenter() {
  return (
    <>
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
        <div className='mb-2 flex flex-wrap items-center justify-between gap-x-4 space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Notifications</h2>
            <p className='text-muted-foreground'>
              Stay on top of broadcast updates that your organization shares in real time.
            </p>
          </div>
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1'>
          <NotificationsTable />
        </div>
      </Main>
    </>
  )
}
