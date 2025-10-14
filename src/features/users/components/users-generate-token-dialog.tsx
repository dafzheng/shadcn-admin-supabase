import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format } from 'date-fns'
import { Check, ClipboardCopy, KeyRound, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InviteRole, genInviteToken } from '../api/users'

const ROLE_OPTIONS: InviteRole[] = ['owner', 'member', 'viewer']

type UsersGenerateTokenDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersGenerateTokenDialog({
  open,
  onOpenChange,
}: UsersGenerateTokenDialogProps) {
  const [count, setCount] = useState<number>(1)
  const [loading, setLoading] = useState<boolean>(false)
  const [tokens, setTokens] = useState<string[]>([])
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [role, setRole] = useState<InviteRole>('member')
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      setCount(1)
      setTokens([])
      setExpiresAt(null)
      setErrorMessage(null)
      setLoading(false)
      setCopiedToken(null)
      setRole('member')
      if (copyResetTimer.current) {
        clearTimeout(copyResetTimer.current)
        copyResetTimer.current = null
      }
    }
  }, [open])

  const handleGenerate = useCallback(async () => {
    if (loading) return

    const safeCount = Number.isFinite(count) && count > 0 ? Math.min(Math.floor(count), 50) : 1

    setLoading(true)
    setErrorMessage(null)
    try {
      const { tokens: generatedTokens, expiresAt: apiExpiresAt } = await genInviteToken(safeCount, role)
      const tokenList = generatedTokens.filter((token): token is string => typeof token === 'string' && token.trim().length > 0)
      setTokens(tokenList)
      setExpiresAt(apiExpiresAt ?? null)
      if (tokenList.length === 0) {
        setErrorMessage('No tokens were returned.')
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
          ? error
          : 'Failed to generate invite tokens.'
      setErrorMessage(message)
      setTokens([])
      setExpiresAt(null)
    } finally {
      setLoading(false)
    }
  }, [count, loading, role])

  const handleCopy = useCallback(
    async (token: string) => {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        setErrorMessage('Clipboard is not available. Please copy the token manually.')
        return
      }

      try {
        await navigator.clipboard.writeText(token)
        setErrorMessage(null)
        setCopiedToken(token)
        if (copyResetTimer.current) {
          clearTimeout(copyResetTimer.current)
        }
        copyResetTimer.current = setTimeout(() => {
          setCopiedToken((prev) => (prev === token ? null : prev))
        }, 2000)
      } catch {
        setErrorMessage('Failed to copy token. Please copy it manually.')
      }
    },
    []
  )

  useEffect(() => {
    return () => {
      if (copyResetTimer.current) {
        clearTimeout(copyResetTimer.current)
        copyResetTimer.current = null
      }
    }
  }, [])

  const expiresLabel = useMemo(() => {
    if (!expiresAt) return null
    return format(expiresAt, 'PPP p')
  }, [expiresAt])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle className='flex items-center gap-2'>
            <KeyRound size={20} /> Generate Invite Tokens
          </DialogTitle>
          <DialogDescription>
            Create one-time invite tokens that expire in 3 days. Share them with new teammates to let them join without an email invite.
          </DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4'>
          <div className='space-y-3'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6'>
              <div className='space-y-4 sm:max-w-[220px]'>
                <div className='space-y-2'>
                  <Label htmlFor='invite-token-role'>Role</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as InviteRole)}>
                    <SelectTrigger id='invite-token-role'>
                      <SelectValue placeholder='Select a role' />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='invite-token-count'>Number of tokens</Label>
                  <Input
                    id='invite-token-count'
                    type='number'
                    inputMode='numeric'
                    min={1}
                    max={50}
                    value={count}
                    onChange={(event) => {
                      const next = Number.parseInt(event.target.value, 10)
                      if (Number.isNaN(next)) {
                        setCount(1)
                      } else {
                        setCount(Math.min(Math.max(next, 1), 50))
                      }
                    }}
                  />
                </div>
              </div>

              <div className='sm:pb-1'>
                <Button className='w-full sm:w-auto sm:self-end' onClick={handleGenerate} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className='animate-spin' size={16} />
                      Generating...
                    </>
                  ) : (
                    'Generate'
                  )}
                </Button>
              </div>
            </div>

            <p className='text-sm text-muted-foreground'>
              You can generate up to 50 tokens at a time. Each token expires 3 days after creation.
            </p>
            {errorMessage && (
              <p className='text-sm text-destructive'>{errorMessage}</p>
            )}
          </div>

          {tokens.length > 0 && (
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label>Generated tokens</Label>
                {expiresLabel && (
                  <span className='text-sm text-muted-foreground'>
                    Expires on {expiresLabel}
                  </span>
                )}
              </div>
              <ScrollArea className='h-48 rounded-md border'>
                <ul className='divide-y'>
                  {tokens.map((token, index) => (
                    <li key={`${token}-${index}`} className='px-4 py-3 text-sm'>
                      <div className='flex items-center justify-between gap-3'>
                        <div className='flex items-center gap-3'>
                          <span className='text-muted-foreground font-medium tabular-nums'>
                            {index + 1}
                          </span>
                          <span className='font-mono break-all'>{token}</span>
                        </div>
                        <Button
                          size='icon'
                          variant='outline'
                          onClick={() => handleCopy(token)}
                          aria-label='Copy token'
                        >
                          {copiedToken === token ? <Check size={16} /> : <ClipboardCopy size={16} />}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className='gap-2'>
          <DialogClose asChild>
            <Button variant='outline'>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
