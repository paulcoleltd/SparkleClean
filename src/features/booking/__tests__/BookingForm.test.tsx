// @vitest-environment jsdom
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Mock the hook so tests don't hit the network
vi.mock('../hooks/useCreateBooking')

import { useCreateBooking } from '../hooks/useCreateBooking'
import { BookingForm } from '../BookingForm'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0] as string
}

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function renderForm(prefill?: Parameters<typeof BookingForm>[0]['prefill']) {
  const client = makeClient()
  return render(
    <QueryClientProvider client={client}>
      <BookingForm prefill={prefill} />
    </QueryClientProvider>
  )
}

// Default mock — idle, not pending
function mockIdle() {
  vi.mocked(useCreateBooking).mockReturnValue({
    mutate:    vi.fn(),
    isPending: false,
  } as never)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('BookingForm', () => {
  beforeEach(() => {
    mockIdle()
  })

  // ─── Rendering ────────────────────────────────────────────────────────────

  it('renders all required fields', () => {
    renderForm()
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/county/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/postcode/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/service type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/frequency/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/property size/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/preferred date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/time slot/i)).toBeInTheDocument()
  })

  it('renders the submit button', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /book & pay now/i })).toBeInTheDocument()
  })

  it('renders the price summary panel', () => {
    renderForm()
    expect(screen.getByText(/booking summary/i)).toBeInTheDocument()
  })

  it('renders add-on checkboxes', () => {
    renderForm()
    expect(screen.getByLabelText(/window cleaning/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/carpet cleaning/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/laundry/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/organisation/i)).toBeInTheDocument()
  })

  // ─── Prefill ──────────────────────────────────────────────────────────────

  it('pre-fills name when prefill prop is provided', () => {
    renderForm({ name: 'Jane Smith', email: 'jane@example.com' })
    expect(screen.getByLabelText<HTMLInputElement>(/full name/i).value).toBe('Jane Smith')
    expect(screen.getByLabelText<HTMLInputElement>(/email address/i).value).toBe('jane@example.com')
  })

  // ─── Validation errors ────────────────────────────────────────────────────

  it('shows name validation error on submit with empty name', async () => {
    renderForm()
    await userEvent.click(screen.getByRole('button', { name: /book & pay now/i }))
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    })
  })

  it('shows email error when email is invalid', async () => {
    renderForm()
    await userEvent.type(screen.getByLabelText(/email address/i), 'not-an-email')
    await userEvent.click(screen.getByRole('button', { name: /book & pay now/i }))
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0)
    })
  })

  it('does not call mutate when the form is invalid', async () => {
    const mutate = vi.fn()
    vi.mocked(useCreateBooking).mockReturnValue({ mutate, isPending: false } as never)
    renderForm()
    await userEvent.click(screen.getByRole('button', { name: /book & pay now/i }))
    await waitFor(() => {
      expect(mutate).not.toHaveBeenCalled()
    })
  })

  // ─── Pending state ────────────────────────────────────────────────────────

  it('shows "Preparing Payment..." and disables button when isPending', () => {
    vi.mocked(useCreateBooking).mockReturnValue({ mutate: vi.fn(), isPending: true } as never)
    renderForm()
    const btn = screen.getByRole('button', { name: /preparing payment/i })
    expect(btn).toBeDisabled()
  })

  // ─── Successful submission ────────────────────────────────────────────────

  it('calls mutate with valid form data on submit', async () => {
    const mutate = vi.fn()
    vi.mocked(useCreateBooking).mockReturnValue({ mutate, isPending: false } as never)
    renderForm()

    await userEvent.type(screen.getByLabelText(/full name/i),     'Jane Smith')
    await userEvent.type(screen.getByLabelText(/email address/i), 'jane@example.com')
    await userEvent.type(screen.getByLabelText(/phone number/i),  '(555) 123-4567')
    await userEvent.type(screen.getByLabelText(/street address/i),'123 Main St')
    await userEvent.type(screen.getByLabelText(/city/i),          'London')
    await userEvent.type(screen.getByLabelText(/county/i),        'Greater London')
    await userEvent.type(screen.getByLabelText(/postcode/i),      'SW1A 1AA')

    await userEvent.selectOptions(screen.getByLabelText(/service type/i),   'RESIDENTIAL')
    await userEvent.selectOptions(screen.getByLabelText(/frequency/i),      'ONE_TIME')
    await userEvent.selectOptions(screen.getByLabelText(/property size/i),  'MEDIUM')
    await userEvent.selectOptions(screen.getByLabelText(/time slot/i),      'MORNING')
    await userEvent.type(screen.getByLabelText(/preferred date/i), tomorrow())

    await userEvent.click(screen.getByRole('button', { name: /book & pay now/i }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledOnce()
      const [arg] = mutate.mock.calls[0] as [Record<string, unknown>]
      expect(arg.email).toBe('jane@example.com')
      expect(arg.service).toBe('RESIDENTIAL')
    })
  })

  // ─── Add-ons ──────────────────────────────────────────────────────────────

  it('includes checked extras in the submitted data', async () => {
    const mutate = vi.fn()
    vi.mocked(useCreateBooking).mockReturnValue({ mutate, isPending: false } as never)
    renderForm()

    await userEvent.type(screen.getByLabelText(/full name/i),     'Jane Smith')
    await userEvent.type(screen.getByLabelText(/email address/i), 'jane@example.com')
    await userEvent.type(screen.getByLabelText(/phone number/i),  '(555) 123-4567')
    await userEvent.type(screen.getByLabelText(/street address/i),'123 Main St')
    await userEvent.type(screen.getByLabelText(/city/i),          'London')
    await userEvent.type(screen.getByLabelText(/county/i),        'Greater London')
    await userEvent.type(screen.getByLabelText(/postcode/i),      'SW1A 1AA')
    await userEvent.selectOptions(screen.getByLabelText(/service type/i),  'RESIDENTIAL')
    await userEvent.selectOptions(screen.getByLabelText(/frequency/i),     'ONE_TIME')
    await userEvent.selectOptions(screen.getByLabelText(/property size/i), 'MEDIUM')
    await userEvent.selectOptions(screen.getByLabelText(/time slot/i),     'MORNING')
    await userEvent.type(screen.getByLabelText(/preferred date/i), tomorrow())

    await userEvent.click(screen.getByLabelText(/window cleaning/i))

    await userEvent.click(screen.getByRole('button', { name: /book & pay now/i }))

    await waitFor(() => {
      expect(mutate).toHaveBeenCalledOnce()
      const [arg] = mutate.mock.calls[0] as [Record<string, unknown>]
      expect(arg.extras).toContain('WINDOWS')
    })
  })
})
