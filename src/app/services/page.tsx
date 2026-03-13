export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublishedReviews } from '@/services/reviewService'
import { SERVICE_LABELS } from '@/types/booking'

export const metadata: Metadata = {
  title:       'Our Services',
  description: 'Explore our comprehensive cleaning services — residential, commercial, deep cleaning, and more.',
  openGraph: {
    title:       'Our Services — SparkleClean',
    description: 'Explore our comprehensive cleaning services — residential, commercial, deep cleaning, and more.',
    url:         '/services',
    type:        'website',
  },
  twitter: {
    title:       'Our Services — SparkleClean',
    description: 'Explore our comprehensive cleaning services — residential, commercial, deep cleaning, and more.',
  },
}

const services = [
  {
    icon:     '🏠',
    name:     'Residential Cleaning',
    price:    '$150',
    desc:     'Comprehensive home cleaning services designed for busy families.',
    includes: ['Dusting and vacuuming all rooms', 'Kitchen and bathroom sanitisation', 'Floor cleaning and polishing', 'Bed sheet and towel washing', 'Rubbish removal'],
  },
  {
    icon:     '🏢',
    name:     'Commercial Cleaning',
    price:    '$200',
    desc:     'Professional office and commercial space cleaning solutions.',
    includes: ['Workstation and desk cleaning', 'Common area sanitisation', 'Restroom deep cleaning', 'Kitchen and break room cleaning', 'Waste disposal and recycling'],
  },
  {
    icon:     '🧹',
    name:     'Deep Cleaning',
    price:    '$300',
    desc:     'Intensive cleaning for those hard-to-reach areas and built-up grime.',
    includes: ['Inside oven and refrigerator', 'Behind and under appliances', 'Grout scrubbing', 'Window sill and blind cleaning', 'Baseboards and light fixtures'],
  },
  {
    icon:     '⭐',
    name:     'Specialized Cleaning',
    price:    '$250',
    desc:     'Tailored cleaning solutions for unique situations.',
    includes: ['Move-in / move-out cleaning', 'Post-renovation clean-up', 'Event clean-up', 'Seasonal deep cleaning', 'Custom schedule and checklist'],
  },
]

const extras = [
  { name: 'Window cleaning',  price: '+$50' },
  { name: 'Carpet cleaning',  price: '+$75' },
  { name: 'Laundry',          price: '+$40' },
  { name: 'Organisation',     price: '+$60' },
]

export default async function ServicesPage() {
  const reviews = await getPublishedReviews(3)

  return (
    <main>
      <header className="bg-brand-500 py-12 text-center text-white">
        <h1 className="text-3xl font-bold">Our Services</h1>
        <p className="mt-2 text-brand-100">Comprehensive cleaning solutions tailored to your needs</p>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">

        {/* Services */}
        <div className="space-y-8">
          {services.map(s => (
            <article key={s.name} className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="text-4xl">{s.icon}</div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-semibold text-gray-800">{s.name}</h2>
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-600">
                      from {s.price}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
                  <ul className="mt-3 space-y-1">
                    {s.includes.map(item => (
                      <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="text-brand-500">✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Add-ons */}
        <section className="mt-12">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Optional Add-ons</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {extras.map(e => (
              <div key={e.name} className="rounded-lg border border-gray-100 p-4 text-center">
                <p className="text-sm font-medium text-gray-700">{e.name}</p>
                <p className="mt-1 text-lg font-bold text-brand-500">{e.price}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-6 text-xl font-semibold text-gray-800">What Customers Are Saying</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {reviews.map(r => (
                <div key={r.id} className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm flex flex-col gap-2">
                  <div className="text-amber-400 text-sm">
                    {'★'.repeat(r.rating)}<span className="text-gray-200">{'★'.repeat(5 - r.rating)}</span>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">{r.title}</p>
                  <p className="text-sm text-gray-500 flex-1 line-clamp-3">{r.body}</p>
                  <p className="text-xs text-gray-400 pt-1 border-t border-gray-100">
                    <span className="font-medium text-gray-600">{r.name}</span>
                    {' · '}
                    {SERVICE_LABELS[r.service as keyof typeof SERVICE_LABELS] ?? r.service}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="mt-12 rounded-lg bg-brand-500 p-8 text-center text-white">
          <h2 className="text-xl font-bold">Ready to Book?</h2>
          <p className="mt-2 text-brand-100">Get your home sparkling clean today.</p>
          <Link
            href="/booking"
            className="mt-5 inline-block rounded-md bg-white px-8 py-3 font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
          >
            Book Now
          </Link>
        </div>
      </div>
    </main>
  )
}
