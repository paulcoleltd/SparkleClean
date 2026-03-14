'use client'

import { useState } from 'react'

const STARS = [1, 2, 3, 4, 5] as const

export default function ReviewForm({ token, bookingReference }: { token: string; bookingReference: string }) {
  const [rating,   setRating]   = useState(0)
  const [hovered,  setHovered]  = useState(0)
  const [title,    setTitle]    = useState('')
  const [body,     setBody]     = useState('')
  const [state,    setState]    = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setState('loading')

    const res = await fetch('/api/reviews', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, rating, title, body }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setErrorMsg((json as any)?.error?.message ?? 'Something went wrong. Please try again.')
      setState('error')
      return
    }

    setState('success')
  }

  if (state === 'success') {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-4">⭐</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Thank you for your review!</h2>
        <p className="text-gray-500 text-sm">
          Your feedback for <strong>{bookingReference}</strong> has been received.
          We'll publish it after a quick review.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Star rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-1" role="group" aria-label="Rating">
          {STARS.map(star => (
            <button
              key={star}
              type="button"
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-3xl leading-none transition-transform hover:scale-110 focus:outline-none"
            >
              <span className={(hovered || rating) >= star ? 'text-amber-400' : 'text-gray-300'}>
                ★
              </span>
            </button>
          ))}
        </div>
        {rating === 0 && state === 'error' && (
          <p className="text-xs text-red-600 mt-1">Please select a rating</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Summary <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          minLength={3}
          maxLength={200}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          placeholder="e.g. Excellent service, very thorough!"
        />
      </div>

      {/* Body */}
      <div>
        <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
          Your Review <span className="text-red-500">*</span>
        </label>
        <textarea
          id="body"
          value={body}
          onChange={e => setBody(e.target.value)}
          minLength={10}
          maxLength={1000}
          required
          rows={5}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none
                     focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          placeholder="Tell us about your experience…"
        />
        <p className="text-xs text-gray-400 mt-1">{body.length}/1000</p>
      </div>

      {state === 'error' && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'loading' || rating === 0}
        className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-60
                   text-white text-sm font-medium rounded-lg transition-colors"
      >
        {state === 'loading' ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  )
}
