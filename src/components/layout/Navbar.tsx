'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/',         label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/about',    label: 'About' },
  { href: '/contact',  label: 'Contact' },
  { href: '/account/bookings', label: 'My Account' },
]

export function Navbar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close mobile menu on Escape key (ARIA best practice)
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  return (
    <nav className="bg-white shadow-sm" aria-label="Main navigation">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">

        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold text-brand-500 hover:text-brand-600 transition-colors"
          aria-label="SparkleClean home"
        >
          ✨ SparkleClean
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-6 md:flex" role="list">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-brand-500',
                  pathname === href ? 'text-brand-500' : 'text-gray-600'
                )}
                aria-current={pathname === href ? 'page' : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/booking"
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
            >
              Book Now
            </Link>
          </li>
        </ul>

        {/* Mobile hamburger */}
        <button
          className="flex flex-col gap-1.5 p-1 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(v => !v)}
        >
          <span className={cn('block h-0.5 w-6 bg-gray-700 transition-transform', open && 'translate-y-2 rotate-45')} />
          <span className={cn('block h-0.5 w-6 bg-gray-700 transition-opacity',   open && 'opacity-0')} />
          <span className={cn('block h-0.5 w-6 bg-gray-700 transition-transform', open && '-translate-y-2 -rotate-45')} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div id="mobile-menu" className="border-t border-gray-100 bg-white px-4 pb-4 md:hidden">
          <ul className="mt-3 flex flex-col gap-1" role="list">
            {links.map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    pathname === href
                      ? 'bg-brand-50 text-brand-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                  aria-current={pathname === href ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/booking"
                onClick={() => setOpen(false)}
                className="mt-2 block rounded-md bg-brand-500 px-3 py-2 text-center text-sm font-semibold text-white hover:bg-brand-600"
              >
                Book Now
              </Link>
            </li>
          </ul>
        </div>
      )}
    </nav>
  )
}
