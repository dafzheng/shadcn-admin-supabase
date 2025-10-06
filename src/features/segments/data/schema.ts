import { z } from 'zod'
import { parseCompactNumber } from "@/lib/parse-compact-number"

const segmentStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
  z.literal('suspended'),
])
export type SegmentStatus = z.infer<typeof segmentStatusSchema>

const rangeSchema = z.union([
  z.literal('max'),
  z.literal('min'),
])
export type range = z.infer<typeof rangeSchema>

export const segmentRawSchema = z.object({
  id: z.string(),
  segment_name: z.string(),
  person_titles: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })),
  email_status: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })),
  organization: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })),
  industry: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })),
  person_locations: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })),
  revenue_range: z.object({
    max: z.string(),
    min: z.string(),
  }),
  employees: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })),
  response_content: z.any(),
  created_at: z.string(),
  queried_at: z.string().nullable(),
  description: z.string(),
})

export const segmentSchema = segmentRawSchema.transform(data => ({
  id: data.id,
  segmentName: data.segment_name,
  personTitles: data.person_titles,
  emailStatus: data.email_status,
  organization: data.organization,
  industry: data.industry,
  personLocations: data.person_locations,
  revenueRange: data.revenue_range,
  description: data.description,
  employees: data.employees,
  queriedTotalEntries: data.response_content?.pagination?.total_entries ?? -1,
  createdAt: data.created_at,
  queriedAt: data.queried_at,
}))

export type Segment = z.infer<typeof segmentSchema>

export const segmentFormSchema = z
  .object({
    segmentName: z.string().min(1, { message: 'Segment Name is required.' }),
    personTitles: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })),
    emailStatus: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })),
    organization: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })),
    industry: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })),
    personLocations: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })),
    employees: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })),
    revenueRange: z.object({
      max: z.string(),
      min: z.string(),
    }),
    description: z.string(),
    isEdit: z.boolean(),
  })
  .superRefine(({ personTitles, emailStatus, organization, industry, personLocations, revenueRange, employees }, ctx) => {
    if (personTitles.length === 0 &&
      organization.length === 0 &&
      emailStatus.length === 0 &&
      industry.length === 0 &&
      personLocations.length === 0 &&
      employees.length === 0 &&
      revenueRange.max === '' &&
      revenueRange.min === ''
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Filter must be at least one condition.",
        path: ['segmentName'],
      })
    }

    const numberMax = parseCompactNumber(revenueRange.max)
    const numberMin = parseCompactNumber(revenueRange.min)

    if (numberMax === null && revenueRange.max !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Max field Format error.",
        path: ['revenueRange'],
      })
    }

    if (numberMin === null && revenueRange.min !== '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Min field Format error.",
        path: ['revenueRange'],
      })
    }

    if (Number.isInteger(numberMax) && Number.isInteger(numberMin) &&
      revenueRange.max !== '' && revenueRange.min !== '') {
      console.log('numberMax = ', numberMax)
      console.log('numberMin = ', numberMin)


      if ((numberMax || 0) < (numberMin || 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Max must be bigger than Min.",
          path: ['revenueRange'],
        })
      }
    }


  })

export type SegmentForm = z.infer<typeof segmentFormSchema>

export const segmentListSchema = z.array(segmentSchema)

export const segmentRawListSchema = z.array(segmentRawSchema)