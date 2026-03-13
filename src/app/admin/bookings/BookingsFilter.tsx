'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'

const STATUSES = [
  { value: '',                label: 'All statuses'      },
  { value: 'PENDING_PAYMENT', label: 'Awaiting Payment'  },
  { value: 'PENDING',         label: 'Pending'           },
  { value: 'CONFIRMED',       label: 'Confirmed'         },
  { value: 'COMPLETED',       label: 'Completed'         },
  { value: 'CANCELLED',       label: 'Cancelled'         },
]

export default function BookingsFilter() {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const currentSearch = searchParams.get('search') ?? ''
  const currentStatus = searchParams.get('status') ?? ''

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // reset to page 1 on filter change
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [searchParams, pathname, router])

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${pending ? 'opacity-60' : ''}`}>
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
        </svg>
        <input
          type="search"
          placeholder="Search name, email or reference…"
          defaultValue={currentSearch}
          onChange={e => update('search', e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      {/* Status filter */}
      <select
        defaultValue={currentStatus}
        onChange={e => update('status', e.target.value)}
        className="py-2 pl-3 pr-8 text-sm border border-gray-300 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      >
        {STATUSES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Clear filters */}
      {(currentSearch || currentStatus) && (
        <button
          onClick={() => startTransition(() => router.push(pathname))}
          className="text-sm text-gray-500 hover:text-gray-800 whitespace-nowrap"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
