import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { HeaderNotificationsMenu } from '@/components/layout/header-notifications-menu'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { EmailsDialogs } from './components/emails-dialogs'
import { EmailsPrimaryButtons } from './components/emails-primary-buttons'
import { EmailsProvider } from './components/emails-provider'
import { EmailsTable } from './components/emails-table'

const route = getRouteApi('/_authenticated/emails/')

export function Emails() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <EmailsProvider>
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
            <h2 className='text-2xl font-bold tracking-tight'>Email List</h2>
            <p className='text-muted-foreground'>
              Manage your emails here.
            </p>
          </div>
          <EmailsPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <EmailsTable search={search} navigate={navigate} />
        </div>
      </Main>

      <EmailsDialogs />
    </EmailsProvider>
  )
}
