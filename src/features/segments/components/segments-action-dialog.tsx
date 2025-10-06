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
import { Segment, SegmentForm, segmentFormSchema } from '../data/schema'
import { AsyncInputSearchSelect } from '@/components/ui/async-input-search-select'
import { AsyncSingleSelect } from '@/components/ui/async-single-select'

import { RangeSelect } from '@/components/ui/range-select'
import { useState } from "react";

import { upsertSegment } from '../api/segment'
import { apolloTagsSearch, apolloOrganizationsSearch, apolloFacets, apolloEmailStatus } from '../api/apollo'
import { useSegments } from './segments-provider'


type SegmentActionDialogProps = {
  currentRow?: Segment
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SegmentsActionDialog({
  currentRow,
  open,
  onOpenChange,
}: SegmentActionDialogProps) {
  const isEdit = !!currentRow
  const { refetchSegments } = useSegments()
  const [loading, setLoading] = useState(false)
  const form = useForm<SegmentForm>({
    resolver: zodResolver(segmentFormSchema),
    defaultValues: isEdit
      ? {
        ...currentRow,
        isEdit,
      }
      : {
        segmentName: '',
        emailStatus: [],
        personTitles: [],
        organization: [],
        industry: [],
        personLocations: [],
        employees: [],
        revenueRange: { min: '', max: '' },
        description: '',
        isEdit,
      },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit', // ★ 關鍵：避免打字就再次整體驗證
  })

  const onSubmit = async (values: SegmentForm) => {
    setLoading(true)
    try {
      await upsertSegment(currentRow?.id || '', values)
      // showSubmittedData(values)
      await refetchSegments()
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
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-left'>
          <DialogTitle>{isEdit ? 'Edit Segment' : 'Add New Segment'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the segment here. ' : 'Create new segment here. '}
            Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className='-mr-4 h-[26.25rem] w-full overflow-y-auto py-1 pr-4'>

          <Form {...form}>
            <form
              id='segment-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 p-0.5'
            >
              <FormField
                control={form.control}
                name='segmentName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right'>
                      Segment Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='New Segment'
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
                name='personTitles'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    {/* label 固定上方 */}
                    <FormLabel className='col-span-2 text-right self-start pt-3'>
                      Job Title
                    </FormLabel>
                    <div className="col-span-4">
                      <AsyncInputSearchSelect
                        request={apolloTagsSearch}
                        kind={'person_title'}
                        value={field.value ?? []}
                        onChange={field.onChange}
                      />
                      <FormMessage className='mt-1' />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='emailStatus'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right self-start pt-3'>
                      Email Status
                    </FormLabel>
                    <div className="col-span-4">
                      <AsyncSingleSelect
                        request={apolloEmailStatus}
                        value={field.value ?? []}
                        onChange={field.onChange}
                      />
                      <FormMessage className='mt-1' />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='organization'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right self-start pt-3'>
                      Company
                    </FormLabel>
                    <div className="col-span-4">
                      <AsyncInputSearchSelect
                        request={apolloOrganizationsSearch}
                        kind={''}
                        value={field.value ?? []}
                        onChange={field.onChange}
                      />
                      <FormMessage className='mt-1' />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='employees'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right self-start pt-3'>
                      Employees
                    </FormLabel>
                    <div className="col-span-4">
                      <AsyncSingleSelect
                        request={apolloFacets}
                        value={field.value ?? []}
                        onChange={field.onChange}
                      />
                      <FormMessage className='mt-1' />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='industry'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right self-start pt-3'>
                      Industry
                    </FormLabel>
                    <div className="col-span-4">
                      <AsyncInputSearchSelect
                        request={apolloTagsSearch}
                        kind={'linkedin_industry'}
                        value={field.value ?? []}
                        onChange={field.onChange}
                      />
                      <FormMessage className='mt-1' />
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='personLocations'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    {/* label 固定上方 */}
                    <FormLabel className='col-span-2 text-right self-start pt-3'>
                      Location
                    </FormLabel>
                    <div className="col-span-4">
                      <AsyncInputSearchSelect
                        request={apolloTagsSearch}
                        kind={'location'}
                        value={field.value ?? []}
                        onChange={field.onChange}
                      />
                      <FormMessage className='mt-1' />
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='revenueRange'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-right self-start pt-3'>
                      Revenue
                    </FormLabel>
                    <div className="col-span-4">
                      <RangeSelect
                        minPlaceholder={'Min: 100000, 20m, 3b...'}
                        maxPlaceholder={'Max: 100000, 20m, 3b...'}
                        value={field.value}
                        onChange={field.onChange}
                      />
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

            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='segment-form' disabled={loading}>
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
