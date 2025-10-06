import React, { useState, useEffect } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { emailListSchema, Email } from '../data/schema'
import { getEmail } from '../api/email'

type EmailsDialogType = 'invite' | 'add-newsletter' | 'add-email' | 'edit' | 'delete'

interface EmailsContextType {
  open: EmailsDialogType | null
  setOpen: (str: EmailsDialogType | null) => void
  currentRow: Email | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Email | null>>
  emailList: Email[],
  refetchEmails: () => Promise<void>
  refetchLoading: boolean,
}

const EmailsContext = React.createContext<EmailsContextType | null>(null)

interface Props {
  children: React.ReactNode
}

export function EmailsProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<EmailsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Email | null>(null)
  const [emailList, setEmailList] = useState<Email[]>([])
  const [refetchLoading, setRefreshLoading] = useState<boolean>(false)

  const refetchEmails = async () => {
    try {
      setRefreshLoading(true)
      const res = await getEmail()
      setEmailList(res)
      // const parsed = emailListSchema.parse(res.data)
      // setEmailList(parsed)
      setRefreshLoading(false)
    } catch (err) {
      console.error('Fetch emails failed:', err)
    }
  }

  useEffect(() => {
    refetchEmails()
  }, [])

  return (
    <EmailsContext value={{ emailList, refetchEmails, refetchLoading, open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </EmailsContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useEmails = () => {
  const emailsContext = React.useContext(EmailsContext)

  if (!emailsContext) {
    throw new Error('useEmails has to be used within <EmailsContext>')
  }

  return emailsContext
}
