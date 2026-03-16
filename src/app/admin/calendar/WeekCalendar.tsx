'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import type { CalendarBooking } from '@/services/bookingService'

// ─── Colour palette for up to 8 cleaners ─────────────────────────────────────
const CLEANER_COLOURS = [
  'bg-blue-100   text-blue-800   border-blue-300',
  'bg-purple-100 text-purple-800 border-purple-300',
  'bg-pink-100   text-pink-800   border-pink-300',
  'bg-amber-100  text-amber-800  border-amber-300',
  'bg-teal-100   text-teal-800   border-teal-300',
  'bg-rose-100   text-rose-800   border-rose-300',
  'bg-indigo-100 text-indigo-800 border-indigo-300',
  'bg-lime-100   text-lime-800   border-lime-300',
]

const UNASSIGNED_COLOUR = 'bg-gray-100 text-gray-700 border-gray-300'

const STATUS_DOT: Record<string, string> = {
  PENDING:   'bg-amber-400',
  CONFIRMED: 'bg-brand-500',
  COMPLETED: 'bg-gray-400',
  CANCELLED: 'bg-red-400',
}

const SERVICE_LABELS: Record<string, string> = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL:  'Commercial',
  DEEP:        'Deep Clean',
  SPECIALIZED: 'Specialist',
}

const TIME_LABELS: Record<string, string> = {
  MORNING:   '8:00 am',
  AFTERNOON: '12:00 pm',
  EVENING:   '4:00 pm',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toYMD(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + n)
  return d
}

function startOfWeek(date: Date): Date {
  // Monday-based week
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  return d
}

function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function formatRangeLabel(from: Date, to: Date): string {
  const f = from.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  const t = addDays(to, -1).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  return `${f} – ${t}`
}

function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getUTCFullYear() === today.getFullYear() &&
    date.getUTCMonth()    === today.getMonth() &&
    date.getUTCDate()     === today.getDate()
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WeekCalendar() {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()))
  const [bookings,  setBookings]  = useState<CalendarBooking[]>([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  // Build a stable cleaner-ID → colour-class mapping across re-renders
  const [cleanerColours, setCleanerColours] = useState<Record<string, string>>({})

  const weekEnd = addDays(weekStart, 7)  // exclusive upper bound

  const fetchBookings = useCallback(async (from: Date, to: Date) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/admin/calendar?from=${toYMD(from)}&to=${toYMD(to)}`,
        { cache: 'no-store' }
      )
      if (!res.ok) throw new Error('Failed to load calendar data')
      const data: { bookings: CalendarBooking[] } = await res.json()
      setBookings(data.bookings)

      // Assign colours to any new cleaner IDs
      setCleanerColours(prev => {
        const next = { ...prev }
        let idx = Object.keys(next).length
        for (const b of data.bookings) {
          if (b.cleaner && !(b.cleaner.id in next)) {
            next[b.cleaner.id] = CLEANER_COLOURS[idx % CLEANER_COLOURS.length] ?? CLEANER_COLOURS[0]!
            idx++
          }
        }
        return next
      })
    } catch {
      setError('Could not load bookings. Please refresh.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBookings(weekStart, weekEnd)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  function prevWeek() { setWeekStart(d => addDays(d, -7)) }
  function nextWeek() { setWeekStart(d => addDays(d,  7)) }
  function goToday()  { setWeekStart(startOfWeek(new Date())) }

  // Group bookings by YYYY-MM-DD key (UTC date from scheduledAt)
  const byDay: Record<string, CalendarBooking[]> = {}
  for (const b of bookings) {
    const key = b.scheduledAt.slice(0, 10)
    ;(byDay[key] ??= []).push(b)
  }

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Legend: unique cleaners in the current week
  const legendCleaners = Object.values(
    bookings.reduce<Record<string, { id: string; name: string }>>((acc, b) => {
      if (b.cleaner) acc[b.cleaner.id] = b.cleaner
      return acc
    }, {})
  )

  return (
    <div className="space-y-4">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm text-gray-500 font-medium">
          {formatRangeLabel(weekStart, weekEnd)}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Today
          </button>
          <button
            onClick={prevWeek}
            aria-label="Previous week"
            className="rounded-md border border-gray-300 px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ‹
          </button>
          <button
            onClick={nextWeek}
            aria-label="Next week"
            className="rounded-md border border-gray-300 px-2.5 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ›
          </button>
        </div>
      </div>

      {/* ── Error ────────────────────────────────────────────────────────── */}
      {error && (
        <p className="rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </p>
      )}

      {/* ── Calendar grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200">
        {days.map(day => {
          const key     = toYMD(day)
          const entries = byDay[key] ?? []
          const today   = isToday(day)

          return (
            <div key={key} className="bg-white flex flex-col min-h-[160px]">
              {/* Day header */}
              <div
                className={`px-2 py-1.5 text-center border-b border-gray-100 ${
                  today ? 'bg-brand-50' : ''
                }`}
              >
                <p className={`text-xs font-semibold ${today ? 'text-brand-600' : 'text-gray-500'}`}>
                  {formatHeaderDate(day)}
                </p>
                {today && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500 mt-0.5" />
                )}
              </div>

              {/* Booking cards */}
              <div className="flex-1 p-1.5 space-y-1 overflow-y-auto max-h-64">
                {loading ? (
                  <div className="animate-pulse space-y-1">
                    <div className="h-10 bg-gray-100 rounded" />
                    <div className="h-10 bg-gray-100 rounded" />
                  </div>
                ) : entries.length === 0 ? (
                  <p className="text-xs text-gray-300 text-center pt-4">—</p>
                ) : (
                  entries.map(b => {
                    const colourClass = b.cleaner
                      ? (cleanerColours[b.cleaner.id] ?? UNASSIGNED_COLOUR)
                      : UNASSIGNED_COLOUR

                    return (
                      <Link
                        key={b.id}
                        href={`/admin/bookings/${b.id}`}
                        className={`block rounded border px-2 py-1 text-xs leading-tight hover:opacity-80 transition-opacity ${colourClass}`}
                      >
                        <div className="flex items-center gap-1 mb-0.5">
                          <span
                            className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[b.status] ?? 'bg-gray-400'}`}
                          />
                          <span className="font-medium truncate">{TIME_LABELS[b.timeSlot]}</span>
                        </div>
                        <p className="truncate">{b.name}</p>
                        <p className="truncate text-[10px] opacity-70">
                          {SERVICE_LABELS[b.service] ?? b.service}
                        </p>
                        {b.cleaner && (
                          <p className="truncate text-[10px] font-medium mt-0.5">
                            {b.cleaner.name}
                          </p>
                        )}
                      </Link>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600">
        {/* Status dots */}
        <div className="flex items-center gap-3">
          {Object.entries(STATUS_DOT).map(([status, dot]) => (
            <span key={status} className="flex items-center gap-1">
              <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
              {status.charAt(0) + status.slice(1).toLowerCase()}
            </span>
          ))}
        </div>

        {/* Cleaner colours */}
        {legendCleaners.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-400">Cleaners:</span>
            {legendCleaners.map(c => (
              <span
                key={c.id}
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 border text-[11px] ${cleanerColours[c.id] ?? UNASSIGNED_COLOUR}`}
              >
                {c.name}
              </span>
            ))}
            <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 border text-[11px] ${UNASSIGNED_COLOUR}`}>
              Unassigned
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
