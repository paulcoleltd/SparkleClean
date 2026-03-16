'use client'

import { useState } from 'react'

export function CopyCodeButton({ code, label = 'Copy' }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600 transition-colors whitespace-nowrap"
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}
