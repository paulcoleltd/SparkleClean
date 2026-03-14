'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { BookingStatus } from '@prisma/client'
import { formatDate, formatPrice } from '@/lib/utils'
import { SERVICE_LABELS } from '@/types/booking'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BookingRow {
  id:          string
  reference:   string
  name:        string
  email:       string
  service:     string
  scheduledAt: Date
  status:      BookingStatus
  total:       number
  createdAt:   Date
}

interface Props {
  bookings: BookingRow[]
}

// ─── Style maps ────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'bg-gray-100   text-gray-600',
  PENDING:         'bg-yellow-100 text-yellow-800',
  CONFIRMED:       'bg-blue-100   text-blue-800',
  COMPLETED:       'bg-green-100  text-green-800',
  CANCELLED:       'bg-red-100    text-red-800',
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING_PAYMENT: 'Awaiting Payment',
  PENDING:         'Pending',
  CONFIRMED:       'Confirmed',
  COMPLETED:       'Completed',
  CANCELLED:       'Cancelled',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BookingsTable({ bookings }: Props) {
  const router              = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [error, setError]   = useState<string | null>(null)

  // ─── Selection helpers ────────────────────────────────────────────────────

  const allIds       = bookings.map(b => b.id)
  const allSelected  = allIds.length > 0 && allIds.every(id => selected.has(id))
  const someSelected = selected.size > 0

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(allIds))
  }

  function toggleOne(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ─── Bulk action ──────────────────────────────────────────────────────────

  async function bulkUpdate(status: 'CONFIRMED' | 'CANCELLED') {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/bookings/bulk', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ ids: Array.from(selected), status }),
        })

        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError((data as { error?: { message?: string } }).error?.message ?? 'Something went wrong')
          return
        }

        setSelected(new Set())
        router.refresh()
      } catch {
        setError('Network error. Please try again.')
      }
    })
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    aria-label="Select all bookings"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-gray-300 accent-brand-500 cursor-pointer"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Reference</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Service</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Scheduled</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Booked</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                    No bookings found
                  </td>
                </tr>
              ) : (
                bookings.map(b => (
                  <tr
                    key={b.id}
                    className={`hover:bg-gray-50 transition-colors ${selected.has(b.id) ? 'bg-brand-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`Select booking ${b.reference}`}
                        checked={selected.has(b.id)}
                        onChange={() => toggleOne(b.id)}
                        className="h-4 w-4 rounded border-gray-300 accent-brand-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-gray-900">
                      {b.reference}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{b.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {SERVICE_LABELS[b.service as keyof typeof SERVICE_LABELS] ?? b.service}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(b.scheduledAt)}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">£{formatPrice(b.total)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                        {STATUS_LABELS[b.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(b.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="text-brand-600 hover:text-brand-700 font-medium"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating bulk action bar */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 bg-gray-900 text-white rounded-2xl shadow-2xl ring-1 ring-white/10">
          <span className="text-sm font-medium whitespace-nowrap">
            {selected.size} booking{selected.size !== 1 ? 's' : ''} selected
          </span>
          <div className="w-px h-5 bg-white/20" />
          <button
            onClick={() => bulkUpdate('CONFIRMED')}
            disabled={isPending}
            className="px-3 py-1.5 text-sm font-medium bg-brand-500 hover:bg-brand-600 rounded-lg disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Updating…' : 'Confirm'}
          </button>
          <button
            onClick={() => bulkUpdate('CANCELLED')}
            disabled={isPending}
            className="px-3 py-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => setSelected(new Set())}
            disabled={isPending}
            className="text-gray-400 hover:text-white transition-colors text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Inline error (shown below table if bulk action fails) */}
      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  )
}
