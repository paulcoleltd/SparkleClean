import { useMutation } from '@tanstack/react-query'
import type { CreateBookingInput, BookingResponse } from '@/types/booking'

interface ApiError {
  error: { message: string; code: string; field?: string }
}

async function postBooking(input: CreateBookingInput): Promise<BookingResponse> {
  const res = await fetch('/api/bookings', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(input),
  })

  const json = await res.json()

  if (!res.ok) {
    const err = (json as ApiError).error
    throw new Error(err?.message ?? 'Something went wrong')
  }

  return (json as { data: BookingResponse }).data
}

export function useCreateBooking() {
  return useMutation({
    mutationFn: postBooking,
  })
}
