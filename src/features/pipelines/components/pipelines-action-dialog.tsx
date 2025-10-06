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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input'

import { Pipeline, PipelineForm, pipelineFormSchema } from '../data/schema'
import React, { useState } from "react";

import { upsertPipeline } from '../api/pipelines'
import { usePipelines } from './pipelines-provider'
import { getSegment } from '@/features/segments/api/segment'
import { getEmail } from '@/features/emails/api/email'
import { Segment } from '@/features/segments/data/schema'
import { AsyncSelect } from '@/components/ui/async-select'
import { SelectDropdown } from '@/components/select-dropdown'
import { useFieldArray } from 'react-hook-form'
import numeral from "numeral";
import { Trash2, CirclePlus } from 'lucide-react'
import { Email } from '@/features/emails/data/schema'



interface Props {
  currentRow?: Pipeline
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PipelinesActionDialog({ currentRow, open, onOpenChange }: Props) {
  const { refetchPipelines } = usePipelines()
  const isEdit = !!currentRow
  const [loading, setLoading] = useState(false)

  const form = useForm<PipelineForm>({
    resolver: zodResolver(pipelineFormSchema),
    defaultValues: isEdit
      ? {
        ...currentRow,
        isEdit,
      }
      : {
        pipelineName: '',
        targetSegment: '',
        campaigns: [],
        category: [],
        description: '',
        isEdit,
      },
  })
  const segmentLeads = form.watch('targetSegment').queriedTotalEntries
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'campaigns',
  })

  const onSubmit = async (values: PipelineForm) => {
    setLoading(true)
    try {
      await upsertPipeline(currentRow?.id, values)
      form.reset()
      // showSubmittedData(values)
      await refetchPipelines()
      onOpenChange(false)
    } catch (e: any) {
      // 可加 show toast / 失敗提示
      alert(e?.message || "送出失敗")
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
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader className='text-left'>
          <DialogTitle>{isEdit ? 'Edit Pipeline' : 'Add New Pipeline'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the pipeline here. ' : 'Create new pipeline here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='-mr-4 h-[26.25rem] w-full overflow-y-auto py-1 pr-4'>

          <Form {...form}>
            <form
              id='pipeline-form'
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
                name='pipelineName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Pipeline Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='New Pipeline'
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
                name='targetSegment'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    {/* label 固定上方 */}
                    <FormLabel className='col-span-2 text-right self-start pt-3'>
                      Segment
                    </FormLabel>
                    <div className="col-span-4">
                      <div className='flex items-center gap-2'>
                        <div className="shrink-0">
                          <AsyncSelect<Segment>
                            request={getSegment}
                            getLabel={(item) => item.segmentName}
                            getValue={(item) => item.id}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select a segment"
                          />
                        </div>
                        {field.value !== '' ?
                          <p className="text-sm text-muted-foreground whitespace-nowrap">
                            {`Leads: ${segmentLeads === -1 ? ' - ' : numeral(segmentLeads).format("0,0")}`}
                          </p> : null}

                      </div>
                      <FormMessage className='mt-1' />
                    </div>
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
                name='campaigns'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right self-start pt-3'>
                      Campaigns
                    </FormLabel>
                    <div className="col-span-4 space-y-3">
                      {fields.map((fieldItem, index) => (
                        <Card key={fieldItem.id} className="bg-muted border rounded-md">
                          <CardHeader className="flex flex-row justify-between items-center px-4 py-2">
                            <CardTitle className="text-sm">Campaign #{index + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => remove(index)}
                              className="text-red-500"
                            >
                              <Trash2 size={20} />
                            </Button>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <FormField
                              control={form.control}
                              name={`campaigns.${index}.description`}
                              render={({ field }) => (
                                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                                  <FormLabel className='col-span-2 text-right'>Description</FormLabel>
                                  <FormControl>
                                    <Input {...field} className='col-span-4' placeholder="" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`campaigns.${index}.email`}
                              render={({ field }) => (
                                <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                                  {/* label 固定上方 */}
                                  <FormLabel className='col-span-2 text-right self-start pt-3'>
                                    Email
                                  </FormLabel>
                                  <div className="col-span-4">
                                    <div className='flex items-center gap-2'>
                                      <div className="shrink-0">
                                        <AsyncSelect<Email>
                                          request={getEmail}
                                          getLabel={(item) => item.emailName}
                                          getValue={(item) => item.id}
                                          value={field.value}
                                          onChange={field.onChange}
                                          placeholder="Select a email"
                                        />
                                      </div>
                                    </div>
                                    <FormMessage className='mt-1' />
                                  </div>
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`campaigns.${index}.triggerType`}
                              render={({ field }) => (
                                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                                  <FormLabel className="col-span-2 text-right">
                                    Trigger Type
                                  </FormLabel>

                                  {/* 重點：讓控制項佔 4 欄，並撐滿寬度 */}
                                  <FormControl className="col-span-4">
                                    <SelectDropdown
                                      className="w-full"
                                      defaultValue={field.value}
                                      onValueChange={field.onChange}
                                      placeholder="Select dropdown"
                                      items={[{ label: 'Manual', value: 'manual' }]}
                                    />
                                  </FormControl>

                                  {/* 錯誤訊息排在控制項下方（從第 3 欄開始、跨 4 欄） */}
                                  <FormMessage className="col-span-4 col-start-3" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`campaigns.${index}.triggerContent`}
                              render={({ field }) => (
                                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                                  <FormLabel className='col-span-2 text-right'>Content</FormLabel>
                                  <FormControl>
                                    <Input {...field} className='col-span-4' placeholder="content" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                          </CardContent>
                        </Card>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => append({ description: '', email: '', triggerType: '', triggerContent: '' })}
                      >
                        <span>Add Campaign</span> <CirclePlus size={18} />
                      </Button>
                    </div>
                  </FormItem>

                )}
              />

            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='pipeline-form' disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


