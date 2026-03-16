export const dynamic = 'force-dynamic'

import { getMessages } from '@/services/contactService'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import MarkReadButton from './MarkReadButton'

export const metadata = { title: 'Messages — SparkleClean Admin' }

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; unread?: string }>
}) {
  const { page: pageParam, unread } = await searchParams
  const page       = Math.max(1, Number(pageParam ?? 1))
  const unreadOnly = unread === '1'

  const { messages, total, totalPages } = await getMessages({ page, unreadOnly })

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (unreadOnly) params.set('unread', '1')
    params.set('page', String(p))
    return `/admin/messages?${params.toString()}`
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} {unreadOnly ? 'unread' : 'total'} message{total !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <Link
          href="/admin/messages"
          className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
            !unreadOnly
              ? 'bg-brand-500 text-white border-brand-500'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/messages?unread=1"
          className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-colors ${
            unreadOnly
              ? 'bg-brand-500 text-white border-brand-500'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          Unread
        </Link>
      </div>

      {/* Messages list */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {messages.length === 0 ? (
          <p className="px-4 py-12 text-center text-gray-400">
            {unreadOnly ? 'No unread messages' : 'No messages yet'}
          </p>
        ) : (
          messages.map(m => (
            <div
              key={m.id}
              className={`px-4 py-4 flex items-start gap-4 ${!m.read ? 'bg-blue-50/50' : ''}`}
            >
              {/* Unread dot */}
              <div className="mt-1.5 shrink-0">
                {!m.read
                  ? <span className="block w-2 h-2 rounded-full bg-blue-500" />
                  : <span className="block w-2 h-2" />
                }
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                  <span className="font-semibold text-sm text-gray-900">{m.name}</span>
                  <span className="text-xs text-gray-400">{m.email}</span>
                  {m.phone && <span className="text-xs text-gray-400">{m.phone}</span>}
                  <span className="text-xs text-gray-400 ml-auto">{formatDate(m.createdAt)}</span>
                </div>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{m.subject}</p>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{m.message}</p>
              </div>

              {/* Actions */}
              <div className="shrink-0 flex flex-col gap-2 items-end">
                <a
                  href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}
                  className="px-3 py-1 text-xs rounded-lg bg-brand-500 text-white hover:bg-brand-600 font-medium transition-colors"
                >
                  Reply
                </a>
                {!m.read && <MarkReadButton messageId={m.id} />}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageUrl(page - 1)} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={pageUrl(page + 1)} className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
