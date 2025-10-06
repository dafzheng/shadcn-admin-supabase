import { SegmentsActionDialog } from './segments-action-dialog'
import { SegmentsDeleteDialog } from './segments-delete-dialog'
import { SegmentsInviteDialog } from './segments-invite-dialog'
import { useSegments } from './segments-provider'

export function SegmentsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow, refetchSegments } = useSegments()
  return (
    <>
      <SegmentsActionDialog
        key='segment-add'
        open={open === 'add'}
        onOpenChange={() => {
          setOpen('add')
          console.log('add close!!')
        }}
      />

      {currentRow && (
        <>
          <SegmentsActionDialog
            key={`segment-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              console.log('edit close')
              setOpen('edit')
              // refetchSegments()
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <SegmentsDeleteDialog
            key={`segment-delete-${currentRow.id}`}
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
