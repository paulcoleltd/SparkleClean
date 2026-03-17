'use client'

import { useState } from 'react'

export default function ReplyButton({ messageId, toEmail, subject }: {
  messageId: string
  toEmail:   string
  subject:   string
}) {
  const [open,      setOpen]      = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending,   setSending]   = useState(false)
  const [sent,      setSent]      = useState(false)
  const [error,     setError]     = useState<string | null>(null)

  async function send() {
    if (!replyText.trim()) return
    setSending(true)
    setError(null)
    const res = await fetch(`/api/messages/${messageId}/reply`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ replyText }),
    })
    if (res.ok) {
      setSent(true)
      setOpen(false)
      setReplyText('')
    } else {
      setError('Failed to send. Please try again.')
    }
    setSending(false)
  }

  if (sent) {
    return <span className="px-3 py-1 text-xs rounded-lg bg-green-100 text-green-700 font-medium">Sent ✓</span>
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1 text-xs rounded-lg bg-brand-500 text-white hover:bg-brand-600 font-medium transition-colors"
      >
        Reply
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Reply to <span className="text-brand-600">{toEmail}</span>
            </h2>
            <p className="text-xs text-gray-500">Subject: Re: {subject}</p>

            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={6}
              placeholder="Type your reply…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              autoFocus
            />

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setOpen(false); setError(null) }}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={send}
                disabled={sending || !replyText.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 font-medium transition-colors"
              >
                {sending ? 'Sending…' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
