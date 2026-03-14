'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { CreateContactSchema, type CreateContactInput } from '@/types/contact'

async function postContact(data: CreateContactInput) {
  const res = await fetch('/api/contact', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  })
  if (!res.ok) {
    const json = await res.json() as { error: { message: string } }
    throw new Error(json.error?.message ?? 'Something went wrong')
  }
}

export function ContactForm() {
  const { mutate, isPending, isSuccess, reset: resetMutation } = useMutation({ mutationFn: postContact })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateContactInput>({
    resolver: zodResolver(CreateContactSchema),
  })

  function onSubmit(data: CreateContactInput) {
    mutate(data, {
      onSuccess: () => { reset() },
    })
  }

  if (isSuccess) {
    return (
      <div className="rounded-lg border border-brand-200 bg-brand-50 p-8 text-center">
        <div className="mb-3 text-4xl">✅</div>
        <h2 className="mb-2 text-lg font-semibold text-gray-800">Message Sent!</h2>
        <p className="mb-6 text-sm text-gray-600">
          Thank you for reaching out. We'll get back to you within 24 hours.
        </p>
        <button
          onClick={() => resetMutation()}
          className="rounded-md border border-brand-500 px-5 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full Name" error={errors.name?.message} required>
          <input {...register('name')} placeholder="Your full name" className={inp(!!errors.name)} />
        </Field>
        <Field label="Email Address" error={errors.email?.message} required>
          <input {...register('email')} type="email" placeholder="you@example.com" className={inp(!!errors.email)} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Phone (optional)" error={errors.phone?.message}>
          <input {...register('phone')} type="tel" placeholder="(123) 456-7890" className={inp(!!errors.phone)} />
        </Field>
        <Field label="Subject" error={errors.subject?.message} required>
          <input {...register('subject')} placeholder="How can we help?" className={inp(!!errors.subject)} />
        </Field>
      </div>

      <Field label="Message" error={errors.message?.message} required>
        <textarea
          {...register('message')}
          rows={5}
          placeholder="Tell us more about what you need..."
          className={cn(inp(!!errors.message), 'resize-none')}
        />
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className={cn(
          'w-full rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2',
          isPending && 'cursor-not-allowed opacity-60'
        )}
      >
        {isPending ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}

function Field({
  label, error, required, children,
}: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}{required && <span className="ml-0.5 text-red-500" aria-hidden>*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  )
}

const inp = (hasError: boolean) => cn(
  'w-full rounded-md border px-3 py-2 text-sm text-gray-800 transition-colors',
  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400',
  hasError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white hover:border-gray-400'
)
