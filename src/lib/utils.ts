import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely — use this everywhere className props are combined */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format cents as a currency string — always use this for displaying prices */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`
}

/** Format a date for display */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  })
}

/** Generate a short booking reference from a UUID */
export function toReference(uuid: string): string {
  return `SC-${uuid.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}
