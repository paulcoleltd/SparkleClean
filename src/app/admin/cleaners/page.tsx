export const dynamic = 'force-dynamic'

import { getCleaners } from '@/services/cleanerService'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cleaners — SparkleClean Admin' }

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function CleanersPage() {
  const cleaners = await getCleaners()

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cleaners</h1>
          <p className="mt-1 text-sm text-gray-500">{cleaners.length} active staff member{cleaners.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/cleaners/new"
          className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          + Add Cleaner
        </Link>
      </div>

      {cleaners.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="text-gray-500">No cleaners yet.</p>
          <p className="mt-1 text-sm text-gray-400">Add a cleaner to start assigning bookings.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Phone</th>
                <th className="px-6 py-3 text-left">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cleaners.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 text-gray-600">{c.email}</td>
                  <td className="px-6 py-4 text-gray-600">{c.phone ?? '—'}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
