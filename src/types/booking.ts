import { z } from 'zod'

// ─── Validation schema ────────────────────────────────────────────────────────
// Used for both client-side form validation (Zod) and server-side API validation.
// The server always re-validates independently — never trusts the client result.

const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(0, 0, 0, 0)
  return d
}

export const CreateBookingSchema = z.object({
  // Personal details
  name:    z.string().min(2, 'Name must be at least 2 characters').max(100),
  email:   z.string().email('Please enter a valid email address').max(254),
  phone:   z.string()
    .regex(/^[\d\s\-\+\(\)]{7,}$/, 'Please enter a valid phone number')
    .max(30),
  address: z.string().min(5, 'Please enter a valid address').max(300),
  city:    z.string().min(2, 'Please enter a valid city').max(100),
  state:   z.string().length(2, 'Please enter a 2-letter state code').toUpperCase(),
  zip:     z.string().regex(/^\d{5}(-\d{4})?$/, 'Please enter a valid ZIP code (e.g. 12345 or 12345-6789)'),

  // Service details
  service:      z.enum(['RESIDENTIAL', 'COMMERCIAL', 'DEEP', 'SPECIALIZED'], {
    errorMap: () => ({ message: 'Please select a service' }),
  }),
  frequency:    z.enum(['ONE_TIME', 'WEEKLY', 'BIWEEKLY', 'MONTHLY'], {
    errorMap: () => ({ message: 'Please select a frequency' }),
  }),
  propertySize: z.enum(['SMALL', 'MEDIUM', 'LARGE'], {
    errorMap: () => ({ message: 'Please select a property size' }),
  }),

  // Scheduling
  date:     z.string()
    .min(1, 'Please select a date')
    .refine(
      d => new Date(d) >= tomorrow(),
      'Please select a future date'
    ),
  timeSlot: z.enum(['MORNING', 'AFTERNOON', 'EVENING'], {
    errorMap: () => ({ message: 'Please select a time slot' }),
  }),

  // Optional
  extras:    z.array(z.enum(['WINDOWS', 'CARPETS', 'LAUNDRY', 'ORGANIZATION'])).default([]),
  notes:     z.string().max(500).optional(),
  marketing: z.boolean().default(false),
}).strict()

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>

// ─── Response types ───────────────────────────────────────────────────────────

export interface BookingResponse {
  id:          string
  reference:   string
  total:       number   // cents
  status:      'PENDING_PAYMENT' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'
  checkoutUrl: string   // Stripe Checkout URL — redirect client here immediately
}

export interface BookingListItem extends BookingResponse {
  name:        string
  email:       string
  service:     string
  scheduledAt: string
  timeSlot:    string
}

// ─── Display maps ─────────────────────────────────────────────────────────────
// Used in both the booking form summary and the email template

export const SERVICE_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Residential Cleaning',
  COMMERCIAL:  'Commercial Cleaning',
  DEEP:        'Deep Cleaning',
  SPECIALIZED: 'Specialized Cleaning',
}

export const FREQUENCY_LABELS: Record<string, string> = {
  ONE_TIME: 'One-time',
  WEEKLY:   'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY:  'Monthly',
}

export const SIZE_LABELS: Record<string, string> = {
  SMALL:  'Small (1–2 rooms)',
  MEDIUM: 'Medium (3–4 rooms)',
  LARGE:  'Large (5+ rooms)',
}

export const TIME_LABELS: Record<string, string> = {
  MORNING:   'Morning (8:00 AM – 12:00 PM)',
  AFTERNOON: 'Afternoon (12:00 PM – 4:00 PM)',
  EVENING:   'Evening (4:00 PM – 6:00 PM)',
}

export const EXTRA_LABELS: Record<string, string> = {
  WINDOWS:      'Window cleaning',
  CARPETS:      'Carpet cleaning',
  LAUNDRY:      'Laundry',
  ORGANIZATION: 'Organisation',
}
