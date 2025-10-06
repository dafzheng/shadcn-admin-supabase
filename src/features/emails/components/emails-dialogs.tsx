import { EmailsActionDialog } from './emails-action-dialog'
import { EmailsNewslettersActionDialog } from './emails-newsletters-action-dialog'
import { EmailsDeleteDialog } from './emails-delete-dialog'
import { EmailsInviteDialog } from './emails-invite-dialog'
import { useEmails } from './emails-provider'

export function EmailsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, refetchEmails } = useEmails()
  return (
    <>
      <EmailsActionDialog
        key='email-add'
        open={open === 'add-email'}
        onOpenChange={() => {
          setOpen('add-email')
          console.log('add close!!')
        }}
      />

      <EmailsNewslettersActionDialog
        key='newsletter-add'
        open={open === 'add-newsletter'}
        onOpenChange={() => {
          setOpen('add-newsletter')
          console.log('add close!!')
        }}
      />

      {currentRow && (
        <>
          <EmailsActionDialog
            key={`email-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              console.log('edit close')
              setOpen('edit')
              // refetchEmails()
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <EmailsDeleteDialog
            key={`email-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  )
}
