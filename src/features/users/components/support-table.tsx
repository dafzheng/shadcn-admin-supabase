import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription as DialogBodyDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle as DialogBodyTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { showSubmittedData } from '@/lib/show-submitted-data'
import { cn } from '@/lib/utils'
import { type SupportUser, supportUsers } from '../data/support-users'

const statusVariant: Record<SupportUser['status'], string> = {
  online:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  away: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  offline:
    'border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300',
}

export function SupportTable() {
  const [open, setOpen] = useState(false)
  const [token, setToken] = useState('')
  const [role, setRole] = useState('support_agent')
  const [expiresAt, setExpiresAt] = useState('')

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setToken('')
      setRole('support_agent')
      setExpiresAt('')
    }
  }

  const handleSubmit = () => {
    if (!token.trim()) return
    showSubmittedData(
      {
        supportToken: token.trim(),
        role,
        expiresAt,
      },
      'Submitted support token'
    )
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Card className='overflow-hidden'>
        <CardHeader>
          <CardTitle>Support Team Accounts</CardTitle>
          <CardDescription>
            Quick overview of the support inbox logins that help onboard users.
          </CardDescription>
          <CardAction>
            <DialogTrigger asChild>
              <Button size='sm'>Add support</Button>
            </DialogTrigger>
          </CardAction>
        </CardHeader>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {supportUsers.map((user) => (
                <TableRow key={user.id} className='last:border-b-0'>
                  <TableCell className='font-medium'>{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell className='text-muted-foreground'>
                    {user.email}
                  </TableCell>
                  <TableCell>{user.region}</TableCell>
                  <TableCell className='text-sm'>{user.shift}</TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={cn(
                        'capitalize',
                        statusVariant[user.status] ?? statusVariant.offline
                      )}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DialogContent className='sm:max-w-[420px]'>
        <DialogHeader>
          <DialogBodyTitle>Add support account</DialogBodyTitle>
          <DialogBodyDescription>
            貼上支援系統提供的 token，即可把新的 Support 帳號綁定到這個環境。
          </DialogBodyDescription>
        </DialogHeader>
        <div className='space-y-2'>
          <Label htmlFor='support-token'>Token</Label>
          <Input
            id='support-token'
            placeholder='sup_live_xxxxxxxxx'
            value={token}
            onChange={(event) => setToken(event.target.value)}
            autoComplete='off'
          />
        </div>
        <div className='space-y-2'>
          <Label htmlFor='support-role'>Role</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id='support-role'>
              <SelectValue placeholder='Select role' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='support_agent'>Support Agent</SelectItem>
              <SelectItem value='support_lead'>Support Lead</SelectItem>
              <SelectItem value='support_admin'>Support Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label htmlFor='support-expiration'>Expired time</Label>
          <Input
            id='support-expiration'
            type='datetime-local'
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type='button' variant='ghost'>
              Cancel
            </Button>
          </DialogClose>
          <Button type='button' onClick={handleSubmit} disabled={!token.trim()}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
