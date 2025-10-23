import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { insertNotification } from '../api/notificaiton'
import { notificationLevels, notificationScopes } from '../data/options'
import { useNotificationsStore } from '@/features/notifications/store/notifications-store'
import { parseNotification, type AppNotification } from '@/features/notifications/data/schema'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  level: z.enum(['info', 'success', 'warning', 'error']),
  scope: z.enum(['global', 'organization', 'user']),
})

type InsertNotificationFormValues = z.infer<typeof formSchema>

type NotificationsAddDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NotificationsAddDialog({
  open,
  onOpenChange,
}: NotificationsAddDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const upsertNotification = useNotificationsStore((state) => state.upsertNotification)

  const form = useForm<InsertNotificationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      message: '',
      level: 'info',
      scope: 'global',
    },
  })

  const handleSubmit = async (values: InsertNotificationFormValues) => {
    setIsSubmitting(true)
    try {
      const scopePayload = values.scope === 'organization' ? 'org' : values.scope
      const response = await insertNotification(values.title, values.message, values.level, scopePayload)
      const candidates: unknown[] = [response]
      if (response && typeof response === 'object') {
        const record = response as Record<string, unknown>
        if ('notification' in record) {
          candidates.push(record.notification)
        }
        if ('data' in record) {
          candidates.push(record.data)
        }
      }
      const parsed = candidates.reduce<AppNotification | null>((acc, item) => {
        if (acc) return acc
        return parseNotification(item)
      }, null)
      if (parsed) {
        upsertNotification(parsed)
      }
      toast.success('Notification sent successfully.')
      form.reset({
        title: '',
        message: '',
        level: 'info',
        scope: 'global',
      })
      onOpenChange(false)
    } catch (error) {
      handleServerError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          form.reset({
            title: '',
            message: '',
            level: 'info',
            scope: 'global',
          })
        }
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-left'>
          <DialogTitle>Add Notification</DialogTitle>
          <DialogDescription>
            Broadcast a message to users in your organization.
          </DialogDescription>
        </DialogHeader>
        <div className='-mr-4 max-h-[26rem] w-full overflow-y-auto py-1 pr-4'>
          <Form {...form}>
            <form
              id='notification-form'
              onSubmit={form.handleSubmit(handleSubmit)}
              className='space-y-4 p-0.5'
            >
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Title
                    </FormLabel>
                    <FormControl>
                      <Input
                        className='col-span-4'
                        placeholder='System maintenance scheduled'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='message'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right pt-2'>
                      Message
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        className='col-span-4'
                        rows={4}
                        placeholder='We will perform maintenance on Saturday at 9 AM UTC.'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='level'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Level
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='col-span-4 w-full'>
                          <SelectValue placeholder='Select a level' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {notificationLevels.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='scope'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Scope
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className='col-span-4 w-full'>
                          <SelectValue placeholder='Select a scope' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {notificationScopes.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            form='notification-form'
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send notification'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
