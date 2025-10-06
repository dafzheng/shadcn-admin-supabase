import { PipelinesActionDialog } from './pipelines-action-dialog'
import { PipelinesDeleteDialog } from './pipelines-delete-dialog'
import { PipelinesInviteDialog } from './pipelines-invite-dialog'
import { usePipelines } from './pipelines-provider'
import { PipelinesMutateDrawer } from './pipelines-mutate-drawer'
import { CampaignsProvider } from './pipeline-campaigns-provider'
export function PipelinesDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = usePipelines()
  return (
    <>
      <PipelinesActionDialog
        key='pipeline-add'
        open={open === 'add'}
        onOpenChange={() => {
          setOpen('add')
          console.log('add close!!')
        }}
      />

      {currentRow && (
        <>
          <PipelinesActionDialog
            key={`pipeline-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={() => {
              console.log('edit close')
              setOpen('edit')
              // refetchPipelines()
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />

          <PipelinesDeleteDialog
            key={`pipeline-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={() => {
              setOpen('delete')
              setTimeout(() => {
                setCurrentRow(null)
              }, 500)
            }}
            currentRow={currentRow}
          />
          <CampaignsProvider pipelineId={currentRow.id}>
            <PipelinesMutateDrawer
              key={`pipeline-detail-${currentRow.id}`}
              open={open === 'detail'}
              onOpenChange={() => {
                setOpen('detail')
                setTimeout(() => {
                  setCurrentRow(null)
                }, 500)
              }}
              pipelineId={currentRow.id}
              currentRow={currentRow}
            />
          </CampaignsProvider>

        </>
      )}
    </>
  )
}
