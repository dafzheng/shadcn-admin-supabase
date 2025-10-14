import React, { useState, useEffect } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { type User } from '../data/schema'
import { getUsers } from '../api/users'

type UsersDialogType = 'invite' | 'add' | 'edit' | 'delete' | 'generate-token'

type UsersContextType = {
  open: UsersDialogType | null
  setOpen: (str: UsersDialogType | null) => void
  currentRow: User | null
  setCurrentRow: React.Dispatch<React.SetStateAction<User | null>>
  userList: User[]
  refetchUsers: () => Promise<void>
  refetchLoading: boolean
}

const UsersContext = React.createContext<UsersContextType | null>(null)

export function UsersProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useDialogState<UsersDialogType>(null)
  const [currentRow, setCurrentRow] = useState<User | null>(null)
  const [userList, setUserList] = useState<User[]>([])
  const [refetchLoading, setRefreshLoading] = useState<boolean>(false)

  const refetchUsers = async () => {
    try {
      setRefreshLoading(true)
      const res = await getUsers()
      console.log('res = ', res)
      setUserList(res)

      setRefreshLoading(false)
    } catch (err) {
      console.error('Fetch users failed:', err)
    }
  }

  useEffect(() => {
    refetchUsers()
  }, [])

  return (
    <UsersContext value={{ open, setOpen, currentRow, setCurrentRow, userList, refetchLoading, refetchUsers }}>
      {children}
    </UsersContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useUsers = () => {
  const usersContext = React.useContext(UsersContext)

  if (!usersContext) {
    throw new Error('useUsers has to be used within <UsersContext>')
  }

  return usersContext
}
