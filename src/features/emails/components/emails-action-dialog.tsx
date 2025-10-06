'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { showSubmittedData } from '@/utils/show-submitted-data'
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
import { Email, EmailForm, emailFormSchema } from '../data/schema'
import { useState, useRef } from "react";

import { upsertEmail } from '../api/email'
import { useEmails } from './emails-provider'
import { useGrapesEditor } from '../hook/use-grapes-editor'
import { EXPORT_CSS } from '../data/data'

type EmailActionDialogProps = {
  currentRow?: Email
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmailsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: EmailActionDialogProps) {

  const isEdit = !!currentRow
  const { refetchEmails } = useEmails()
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useGrapesEditor(open, containerRef, currentRow, {
    prefix: 'email/',     // 可留空或指定子目錄
    useSignedUrl: false,    // 私有桶改 true
    signedExpires: 600,
  })

  const form = useForm<EmailForm>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: isEdit
      ? {
        ...currentRow,
        isEdit,
      }
      : {
        emailName: '',
        type: 'email',
        content: [],
        subject: '',
        mjml: '',
        description: '',
        newsletterTopic: '',
        newsletterType: '',
        newsletterTone: '',
        newsletterTargetAudience: '',
        newsletterNumberOfTopics: '',
        newsletterAddAmernetService: false,
        newsletterAvatar: '',
        isEdit,
      },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit', // ★ 關鍵：避免打字就再次整體驗證
  })


  const onSubmit = async (values: EmailForm) => {
    setLoading(true)
    // values.content = containerRef.current?.getHTML() || ''
    values.content = editorRef.current?.getComponents() || ''
    values.mjml = editorRef.current?.getHtml() || ''



    console.log('values = ', values)

    try {
      await upsertEmail(currentRow?.id || '', values)
      // showSubmittedData(values)
      await refetchEmails()
      form.reset()
      onOpenChange(false)
    } catch (e: any) {
      // 可加 show toast / 失敗提示
      alert(e?.message || "send fail")
    } finally {
      setLoading(false)
    }
  }


  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent
        className='sm:max-w-[1200px] h-[90vh]'
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className='text-left'>
          <DialogTitle>{isEdit ? 'Edit Email' : 'Add New Email'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the email here. ' : 'Create new email here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        {/* <div className='-mr-4 h-[26.25rem] w-full overflow-y-auto py-1 pr-4'> */}
        <div className="h-[calc(90vh-120px)] overflow-y-auto">
          <Form {...form}>
            <form
              id='email-form'
              onSubmit={form.handleSubmit(onSubmit)}
              // onSubmit={form.handleSubmit((data) => {
              //   console.log("valid data", data)
              // }, (errors) => {
              //   console.error("invalid", errors)
              // })}
              className='space-y-4 p-0.5'
            >
              <FormField
                control={form.control}
                name='emailName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Email Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='New Email'
                        className='col-span-4'
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
                name='subject'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Email Subject
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Hello World'
                        className='col-span-4'
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
                name='description'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Description
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder=''
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />


            </form>
          </Form>
          <div ref={containerRef} className="w-full h-full mt-4" />
        </div>
        <DialogFooter>
          <Button disabled={loading} type='submit' form='email-form'>
            {loading ? "Saving..." : "Save changes"}
          </Button>

        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
