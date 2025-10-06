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
import { SelectDropdown } from '@/components/select-dropdown'
import { upsertEmail } from '../api/email'
import { useEmails } from './emails-provider'
import { newsletterTypes, numberOfTopicList, tones, avatarList } from '../data/data'
import { Switch } from '@/components/ui/switch'

type EmailNewslettersActionDialogProps = {
  currentRow?: Email
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EmailsNewslettersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: EmailNewslettersActionDialogProps) {

  const isEdit = !!currentRow
  const { refetchEmails } = useEmails()
  const [loading, setLoading] = useState(false)
  const form = useForm<EmailForm>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: isEdit
      ? {
        ...currentRow,
        isEdit,
      }
      : {
        emailName: '',
        content: [],
        subject: '',
        type: 'newsletter',
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

  const watchType = form.watch('newsletterType')

  const enabledFieldsMap = {
    text: ['newsletterTargetAudience', 'newsletterAvatar'],
    video: ['newsletterTargetAudience', 'newsletterTone', 'newsletterNumberOfTopics', 'newsletterAddAmernetService'],
  }


  const shouldRenderField = (fieldName: keyof EmailForm) => {
    if (watchType !== 'text' && watchType !== 'video') return false
    return enabledFieldsMap[watchType].includes(fieldName)
  }

  const onSubmit = async (values: EmailForm) => {
    setLoading(true)
    // values.content = containerRef.current?.getHTML() || ''
    values.content = ''
    values.mjml = ''


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
        className='sm:max-w-2xl'
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
              // onSubmit={form.handleSubmit((data :EmailForm) => {
              //   data.type = 'newsletter'
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


              <FormField
                control={form.control}
                name='newsletterTopic'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Topic
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Voice AI'
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
                name='newsletterType'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Type
                    </FormLabel>
                    <FormControl>
                      <SelectDropdown
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        placeholder='Select a type'
                        className='col-span-4'
                        items={newsletterTypes.map(({ label, value }) => ({
                          label,
                          value,
                        }))}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />

              {shouldRenderField('newsletterTargetAudience') &&
                <FormField
                  control={form.control}
                  name='newsletterTargetAudience'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-right'>
                        Target Audience
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Dentist Offices'
                          className='col-span-4'
                          autoComplete='off'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              }

              {shouldRenderField('newsletterTone') &&
                <FormField
                  control={form.control}
                  name='newsletterTone'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-right'>
                        Tone
                      </FormLabel>
                      <FormControl>
                        <SelectDropdown
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          placeholder='Select a type'
                          className='col-span-4'
                          items={tones.map(({ label, value }) => ({
                            label,
                            value,
                          }))}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              }

              {shouldRenderField('newsletterNumberOfTopics') &&
                <FormField
                  control={form.control}
                  name='newsletterNumberOfTopics'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-right'>
                        Number Of Topics
                      </FormLabel>
                      <FormControl>
                        <SelectDropdown
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          placeholder='Select a option'
                          className='col-span-4'
                          items={numberOfTopicList.map(({ label, value }) => ({
                            label,
                            value,
                          }))}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              }

              {shouldRenderField('newsletterAddAmernetService') &&
                <FormField
                  control={form.control}
                  name='newsletterAddAmernetService'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-right'>
                        Add Service
                      </FormLabel>
                      <FormControl className="col-span-4">
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              }

              {shouldRenderField('newsletterAvatar') &&
                <FormField
                  control={form.control}
                  name='newsletterAvatar'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-right'>
                        Avatar
                      </FormLabel>
                      <FormControl>
                        <SelectDropdown
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          placeholder='Select a option'
                          className='col-span-4'
                          items={avatarList.map(({ label, value }) => ({
                            label,
                            value,
                          }))}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              }

            </form>
          </Form>
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
