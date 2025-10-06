import { z } from 'zod'

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

const userRoleSchema = z.union([
  z.literal('superadmin'),
  z.literal('admin'),
  z.literal('cashier'),
  z.literal('manager'),
])

export const userFormSchema = z
  .object({
    fullName: z.string().min(1, 'Full Name is required.'),
    email: z.email({
      error: (iss) => (iss.input === '' ? 'Email is required.' : undefined),
    }),
    password: z.string().transform((pwd) => pwd.trim()),
    role: z.string().min(1, 'Role is required.'),
    confirmPassword: z.string().transform((pwd) => pwd.trim()),
    isEdit: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.isEdit && !data.password) return true
      return data.password.length > 0
    },
    {
      message: 'Password is required.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return password.length >= 6
    },
    {
      message: 'Password must be at least 6 characters long.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return /[a-z]/.test(password)
    },
    {
      message: 'Password must contain at least one lowercase letter.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password }) => {
      if (isEdit && !password) return true
      return /\d/.test(password)
    },
    {
      message: 'Password must contain at least one number.',
      path: ['password'],
    }
  )
  .refine(
    ({ isEdit, password, confirmPassword }) => {
      if (isEdit && !password) return true
      return password === confirmPassword
    },
    {
      message: "Passwords don't match.",
      path: ['confirmPassword'],
    }
  )


export type UserForm = z.infer<typeof userFormSchema>

export const userRawSchema = z.object({
  user_id: z.string(),
  org_id: z.string(),
  full_name: z.string(),
  avatar_url: z.string().nullable(),
  email: z.string(),
  status: z.string(),
  role: z.string(),
  joined_at: z.string()
})

export const userSchema = userRawSchema.transform(data => ({
  id: data.user_id,
  orgId: data.org_id,
  fullName: data.full_name,
  avatarUrl: data.avatar_url,
  email: data.email,
  role: data.role,
  status: data.status,
  joinedAt: data.joined_at
}))

export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)
