import { z } from 'zod'
import { newsletterTypes } from './data'

const emailStatusSchema = z.union([
  z.literal('available'),
  z.literal('building'),
  z.literal('error'),
])
export type EmailStatus = z.infer<typeof emailStatusSchema>


export const emailRawSchema = z.object({
  id: z.string(),
  email_name: z.string(),
  type: z.string(),
  status: z.string(),
  subject: z.string(),
  content: z.any(),
  mjml: z.string(),

  ai_config: z.any(),


  created_at: z.string(),
  description: z.string(),
})

export const emailSchema = emailRawSchema.transform(data => ({
  id: data.id,
  emailName: data.email_name,
  type: data.type,
  status: data.status,
  subject: data.subject,
  content: data.content,
  mjml: data.mjml,

  newsletterTopic: data.ai_config?.newsletter_topic || '',
  newsletterType: data.ai_config?.newsletter_type || '',
  newsletterTone: data.ai_config?.newsletter_tone || '',
  newsletterTargetAudience: data.ai_config?.newsletter_target_audience || '',
  newsletterNumberOfTopics: data.ai_config?.newsletter_number_of_topics || '',
  newsletterAddAmernetService: data.ai_config?.newsletter_add_amernet_service || null,
  newsletterAvatar: data.ai_config?.newsletter_avatar || '',


  description: data.description,
  createdAt: data.created_at,
}))

export type Email = z.infer<typeof emailSchema>

export const emailFormSchema = z
  .object({
    emailName: z.string().min(1, { message: 'Email Name is required.' }),
    content: z.any(),
    subject: z.string(),
    type: z.string(),
    mjml: z.string(),
    newsletterTopic: z.string(),
    newsletterType: z.string(),
    newsletterTone: z.string(),
    newsletterTargetAudience: z.string(),
    newsletterNumberOfTopics: z.string(),
    newsletterAddAmernetService: z.boolean(),
    newsletterAvatar: z.string(),

    description: z.string(),
    isEdit: z.boolean(),
  }).refine(
    (data) => {
      if (data.type === 'newsletter' && data.newsletterTopic === '') return false
      else return true
    },
    {
      message: 'Topic is required.',
      path: ['newsletterTopic'],
    }
  ).refine(
    (data) => {
      if (data.type === 'newsletter' && data.newsletterType === '') return false
      else return true
    },
    {
      message: 'Type is required.',
      path: ['newsletterType'],
    }
  )

export type EmailForm = z.infer<typeof emailFormSchema>

export const emailListSchema = z.array(emailSchema)

export const emailRawListSchema = z.array(emailRawSchema)