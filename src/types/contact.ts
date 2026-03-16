import { z } from 'zod'

export const CreateContactSchema = z.object({
  name:    z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:   z.string().email('Please enter a valid email address').max(254),
  phone:   z.string().regex(/^[\d\s\-\+\(\)]{7,}$/, 'Please enter a valid phone number').max(30).optional().or(z.literal('')),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
}).strict()

export type CreateContactInput = z.infer<typeof CreateContactSchema>
