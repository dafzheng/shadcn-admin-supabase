import { getRouteApi } from '@tanstack/react-router'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { PipelinesDialogs } from './components/pipelines-dialogs'
import { PipelinesPrimaryButtons } from './components/pipelines-primary-buttons'
import { PipelinesProvider } from './components/pipelines-provider'
import { PipelinesTable } from './components/pipelines-table'

const route = getRouteApi('/_authenticated/pipelines/')

export function Pipelines() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <PipelinesProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Pipeline List</h2>
            <p className='text-muted-foreground'>
              Manage your pipelines here.
            </p>
          </div>
          <PipelinesPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <PipelinesTable search={search} navigate={navigate} />
        </div>
      </Main>

      <PipelinesDialogs />
    </PipelinesProvider>
  )
}
