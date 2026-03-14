import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely — use this everywhere className props are combined */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Format pence as a currency string — always use this for displaying prices */
export function formatPrice(pence: number): string {
  return `${(pence / 100).toFixed(2).replace(/\.00$/, '')}`
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
