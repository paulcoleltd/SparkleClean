'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cn } from '@/lib/utils'
import { CreateBookingSchema, type CreateBookingInput } from '@/types/booking'
import { useCreateBooking } from './hooks/useCreateBooking'
import { PriceSummary } from './PriceSummary'

// ─── Today's date as YYYY-MM-DD for the date input min attribute ──────────────
const todayISO = new Date().toISOString().split('T')[0] as string

export interface BookingFormPrefill {
  name?:    string
  email?:   string
  phone?:   string
  address?: string
  city?:    string
  county?:  string
  postcode?: string
}

export function BookingForm({ prefill }: { prefill?: BookingFormPrefill }) {
  const { mutate, isPending } = useCreateBooking()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateBookingInput>({
    resolver:      zodResolver(CreateBookingSchema),
    defaultValues: { extras: [], marketing: false, ...prefill },
  })

  // Watch live values for the price summary
  const [service, frequency, propertySize, timeSlot, date, extras] = watch([
    'service', 'frequency', 'propertySize', 'timeSlot', 'date', 'extras',
  ])

  function onSubmit(data: CreateBookingInput) {
    mutate(data, {
      onSuccess: (booking) => {
        // Redirect to Stripe Checkout — payment happens there
        window.location.href = booking.checkoutUrl
      },
    })
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Form — takes 2/3 on large screens */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="space-y-6 lg:col-span-2"
      >

        {/* Personal Information */}
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-gray-800">Personal Information</legend>

          <Field label="Full Name" error={errors.name?.message} required>
            <input {...register('name')} placeholder="Your full name" className={input(!!errors.name)} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email Address" error={errors.email?.message} required>
              <input {...register('email')} type="email" placeholder="you@example.com" className={input(!!errors.email)} />
            </Field>
            <Field label="Phone Number" error={errors.phone?.message} required>
              <input {...register('phone')} type="tel" placeholder="+44 7700 900000" className={input(!!errors.phone)} />
            </Field>
          </div>

          <Field label="Street Address" error={errors.address?.message} required>
            <input {...register('address')} placeholder="123 Main Street" className={input(!!errors.address)} />
          </Field>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <Field label="City" error={errors.city?.message} required>
                <input {...register('city')} placeholder="London" className={input(!!errors.city)} />
              </Field>
            </div>
            <Field label="County" error={errors.county?.message}>
              <input {...register('county')} placeholder="Greater London" className={input(!!errors.county)} />
            </Field>
            <Field label="Postcode" error={errors.postcode?.message} required>
              <input {...register('postcode')} placeholder="SW1A 1AA" className={input(!!errors.postcode)} />
            </Field>
          </div>
        </fieldset>

        {/* Service Details */}
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-gray-800">Service Details</legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Service Type" error={errors.service?.message} required>
              <select {...register('service')} className={input(!!errors.service)}>
                <option value="">Select a service</option>
                <option value="RESIDENTIAL">Residential Cleaning — £150</option>
                <option value="COMMERCIAL">Commercial Cleaning — £200</option>
                <option value="DEEP">Deep Cleaning — £300</option>
                <option value="SPECIALIZED">Specialized Cleaning — £250</option>
              </select>
            </Field>

            <Field label="Frequency" error={errors.frequency?.message} required>
              <select {...register('frequency')} className={input(!!errors.frequency)}>
                <option value="">Select frequency</option>
                <option value="ONE_TIME">One-time</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Bi-weekly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </Field>

            <Field label="Property Size" error={errors.propertySize?.message} required>
              <select {...register('propertySize')} className={input(!!errors.propertySize)}>
                <option value="">Select property size</option>
                <option value="SMALL">Small (1–2 rooms)</option>
                <option value="MEDIUM">Medium (3–4 rooms)</option>
                <option value="LARGE">Large (5+ rooms)</option>
              </select>
            </Field>
          </div>
        </fieldset>

        {/* Scheduling */}
        <fieldset className="space-y-4">
          <legend className="text-base font-semibold text-gray-800">Preferred Schedule</legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Preferred Date" error={errors.date?.message} required>
              <input
                {...register('date')}
                type="date"
                min={todayISO}
                className={input(!!errors.date)}
              />
            </Field>

            <Field label="Time Slot" error={errors.timeSlot?.message} required>
              <select {...register('timeSlot')} className={input(!!errors.timeSlot)}>
                <option value="">Select a time slot</option>
                <option value="MORNING">Morning (8:00 AM – 12:00 PM)</option>
                <option value="AFTERNOON">Afternoon (12:00 PM – 4:00 PM)</option>
                <option value="EVENING">Evening (4:00 PM – 6:00 PM)</option>
              </select>
            </Field>
          </div>
        </fieldset>

        {/* Add-ons */}
        <fieldset className="space-y-3">
          <legend className="text-base font-semibold text-gray-800">Optional Add-ons</legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {([
              ['WINDOWS',      'Window cleaning',  '+£50'],
              ['CARPETS',      'Carpet cleaning',  '+£75'],
              ['LAUNDRY',      'Laundry',          '+£40'],
              ['ORGANIZATION', 'Organisation',     '+£60'],
            ] as const).map(([value, label, price]) => (
              <label key={value} className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 p-3 hover:border-brand-300 hover:bg-brand-50">
                <input type="checkbox" value={value} {...register('extras')} className="h-4 w-4 accent-brand-500" />
                <span className="flex-1 text-sm text-gray-700">{label}</span>
                <span className="text-sm font-medium text-brand-600">{price}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Notes */}
        <Field label="Special Instructions" error={errors.notes?.message}>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Any special requests or access instructions..."
            className={cn(input(!!errors.notes), 'resize-none')}
          />
        </Field>

        {/* Marketing consent */}
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" {...register('marketing')} className="mt-0.5 h-4 w-4 accent-brand-500" />
          <span className="text-sm text-gray-600">
            I'd like to receive offers, tips, and updates from SparkleClean by email.
          </span>
        </label>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className={cn(btnPrimary, 'w-full', isPending && 'cursor-not-allowed opacity-60')}
        >
          {isPending ? 'Preparing Payment...' : 'Book & Pay Now'}
        </button>
      </form>

      {/* Live price summary — right column */}
      <PriceSummary
        service={service ?? ''}
        frequency={frequency ?? ''}
        propertySize={propertySize ?? ''}
        timeSlot={timeSlot ?? ''}
        date={date ?? ''}
        extras={Array.isArray(extras) ? extras : []}
        className="h-fit lg:sticky lg:top-6"
      />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label, error, required, children,
}: {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
        <span>{label}{required && <span className="ml-0.5 text-error" aria-hidden>*</span>}</span>
        {children}
      </label>
      {error && (
        <p className="text-xs text-red-600" role="alert">{error}</p>
      )}
    </div>
  )
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const input = (hasError: boolean) => cn(
  'w-full rounded-md border px-3 py-2 text-sm text-gray-800 transition-colors',
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
  hasError
    ? 'border-red-400 bg-red-50'
    : 'border-gray-300 bg-white hover:border-gray-400'
)

const btnPrimary = 'rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2'
