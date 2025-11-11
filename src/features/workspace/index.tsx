import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Check, Copy } from 'lucide-react'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { useAuthStore } from '@/stores/auth-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const FALLBACK_TOKEN = 'dGVzdGV0c2V3c2Vncmdkc2ZnZmdkc2Zoc2VoZWg'

type WorkspaceOrg = {
  id: string
  name: string
  plan: string
  seats: number
  role: 'Owner' | 'Admin' | 'Viewer'
  status: 'active' | 'suspended'
}

function deriveWorkspaceToken(seed: string | undefined) {
  if (!seed) return FALLBACK_TOKEN
  const hashed = seed
    .split('')
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 0xffffff, 7)
    .toString(16)
    .padStart(6, '0')
  //return `wrk_${hashed}`
  return FALLBACK_TOKEN
}

export function Workspace() {
  const authUser = useAuthStore((state) => state.auth.user)
  const navigate = useNavigate()
  const defaultEmail = authUser?.email ?? 'workspace.team@shadcn.dev'
  const displayName = authUser?.fullName ?? 'Workspace user'
  const [email, setEmail] = useState(defaultEmail)
  const [password, setPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const token = useMemo(
    () => deriveWorkspaceToken(authUser?.id ?? authUser?.email ?? defaultEmail),
    [authUser?.email, authUser?.id, defaultEmail]
  )

  const organizations = useMemo<WorkspaceOrg[]>(() => {
    const seedSuffix = (authUser?.id ?? 'guest').slice(-4)
    return [
      {
        id: `ORG-SHD-${seedSuffix}`,
        name: `${displayName.split(' ')[0] ?? 'You'} · Shadcn Studio`,
        plan: 'Enterprise',
        seats: 42,
        role: 'Owner',
        status: 'active',
      },
      {
        id: `ORG-OPS-${seedSuffix}`,
        name: 'Operations Collective',
        plan: 'Growth',
        seats: 18,
        role: 'Admin',
        status: 'active',
      },
      {
        id: `ORG-RND-${seedSuffix}`,
        name: 'R&D Prototype Hub',
        plan: 'Starter',
        seats: 6,
        role: 'Viewer',
        status: 'suspended',
      },
    ]
  }, [authUser?.id, displayName])

  const handleSwitchOrg = (org: WorkspaceOrg) => {
    showSubmittedData(
      { orgId: org.id, orgName: org.name },
      'Switching organization and redirecting to dashboard...'
    )
    navigate({ to: '/' })
  }

  const qrValue = useMemo(
    () => JSON.stringify({ email, token }),
    [email, token]
  )

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    showSubmittedData(
      { email, password },
      'Workspace credentials have been staged:'
    )
  }

  const resetChanges = () => {
    setEmail(defaultEmail)
    setPassword('')
  }

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch (error) {
      console.error(error)
    }
  }

  return (
    <div className='min-h-svh bg-muted/40'>
      <div className='mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10'>
        <div className='space-y-1'>
          <p className='text-sm uppercase tracking-wide text-muted-foreground'>
            Workspace
          </p>
          <h1 className='text-3xl font-semibold'>Personal workspace</h1>
          <p className='text-muted-foreground text-sm'>
            調整登入憑證，或用 QR code 讓你的裝置在安全的 workspace 中同步。
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Workspace credentials</CardTitle>
            <CardDescription>
              更新登入 Email 與一次性密碼，會在儲存後套用到所有新的工作階段。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className='space-y-6'
              onSubmit={handleSubmit}
              noValidate
              autoComplete='off'
            >
              <div className='space-y-2'>
                <Label htmlFor='workspace-email'>Email</Label>
                <Input
                  id='workspace-email'
                  type='email'
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='workspace-password'>Password</Label>
                <Input
                  id='workspace-password'
                  type='password'
                  placeholder='至少 12 碼，含符號'
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <div className='flex flex-wrap justify-end gap-3'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={resetChanges}
                  size='sm'
                >
                  Reset
                </Button>
                <Button type='submit' size='sm'>
                  Save workspace
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Personal QR & token</CardTitle>
            <CardDescription>
              提供手機或桌面 App 掃描，快速帶入目前使用者的 workspace 權杖。
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-2'>
              <Label>Token</Label>
              <div className='flex flex-wrap items-center gap-3 rounded-lg border bg-background/90 px-4 py-3 font-mono text-sm'>
                <span className='truncate'>{token}</span>
                <Button
                  type='button'
                  size='sm'
                  variant='secondary'
                  className='ms-auto'
                  onClick={handleCopyToken}
                >
                  {copied ? (
                    <>
                      <Check className='size-4' />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className='size-4' />
                      Copy token
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className='space-y-3'>
              <Label>QR code</Label>
              <div className='flex justify-center rounded-xl border bg-background p-6'>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrValue)}`}
                  alt='Workspace QR code'
                  className='h-52 w-52'
                  loading='lazy'
                />
              </div>
              <p className='text-muted-foreground text-xs'>
                這組 QR code 與 token 綁定目前 Email。更新 Email 後記得重新發佈。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>
              你目前加入的所有 organizations，依角色權限排序。
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {organizations.map((org) => (
              <div
                key={org.id}
                className='flex flex-wrap items-center gap-3 rounded-xl border px-4 py-4'
              >
                <div className='me-auto space-y-1'>
                  <p className='text-base font-medium'>{org.name}</p>
                  <p className='text-muted-foreground text-sm'>
                    {org.role} · {org.seats} members
                  </p>
                </div>
                <Badge variant='outline'>{org.plan}</Badge>
                <Badge
                  variant={org.status === 'active' ? 'secondary' : 'destructive'}
                  className='capitalize'
                >
                  {org.status}
                </Badge>
                <Button type='button' size='sm' onClick={() => handleSwitchOrg(org)}>
                  Switch
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
