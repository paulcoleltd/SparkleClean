export const dynamic = 'force-dynamic'

import Link from 'next/link'
import type { Metadata } from 'next'
import { getPublishedReviews } from '@/services/reviewService'
import { SERVICE_LABELS } from '@/types/booking'
import { formatDate } from '@/lib/utils'

export const metadata: Metadata = {
  title:       'SparkleClean — Professional Cleaning Services',
  description: 'Book professional residential and commercial cleaning services online. Fast, reliable, and fully insured.',
  openGraph: {
    title:       'SparkleClean — Professional Cleaning Services',
    description: 'Book professional residential and commercial cleaning services online. Fast, reliable, and fully insured.',
    url:         '/',
    type:        'website',
  },
  twitter: {
    title:       'SparkleClean — Professional Cleaning Services',
    description: 'Book professional residential and commercial cleaning services online. Fast, reliable, and fully insured.',
  },
}

export default async function HomePage() {
  const reviews = await getPublishedReviews(6)

  return (
    <main>
      {/* Hero */}
      <section className="bg-brand-500 px-4 py-24 text-center text-white">
        <h1 className="text-4xl font-bold sm:text-5xl">Your Home Deserves to Sparkle</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">
          Professional cleaning services tailored to your needs. Fast, reliable, and affordable.
        </p>
        <Link
          href="/booking"
          className="mt-8 inline-block rounded-md bg-white px-8 py-3 font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
        >
          Book a Cleaning Today
        </Link>
      </section>

      {/* Why SparkleClean */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="mb-10 text-center text-2xl font-semibold text-gray-800">Why Choose SparkleClean?</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(f => (
            <div key={f.title} className="rounded-lg border border-gray-100 p-6 text-center shadow-sm">
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="mb-2 font-semibold text-gray-800">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="bg-gray-50 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-semibold text-gray-800">Our Services</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {services.map(s => (
              <div key={s.name} className="rounded-lg bg-white p-6 shadow-sm">
                <div className="mb-3 text-3xl">{s.icon}</div>
                <h3 className="mb-2 font-semibold text-gray-800">{s.name}</h3>
                <p className="mb-4 text-sm text-gray-500">{s.desc}</p>
                <Link href="/booking" className="text-sm font-medium text-brand-600 hover:underline">
                  Book now →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-semibold text-gray-800">What Our Customers Say</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map(r => (
              <div key={r.id} className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm flex flex-col gap-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {'★'.repeat(r.rating)}
                  <span className="text-gray-200">{'★'.repeat(5 - r.rating)}</span>
                </div>
                <p className="font-semibold text-gray-900 text-sm">{r.title}</p>
                <p className="text-sm text-gray-500 flex-1 line-clamp-4">{r.body}</p>
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                  <span className="font-medium text-gray-600">{r.name}</span>
                  <span>{SERVICE_LABELS[r.service as keyof typeof SERVICE_LABELS] ?? r.service}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-brand-500 px-4 py-16 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to Get Your Space Sparkling?</h2>
        <p className="mt-2 text-brand-100">Join hundreds of satisfied customers who trust SparkleClean.</p>
        <Link
          href="/booking"
          className="mt-6 inline-block rounded-md bg-white px-8 py-3 font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
        >
          Get Started Now
        </Link>
      </section>
    </main>
  )
}

const features = [
  { icon: '✅', title: 'Trusted Professionals', desc: 'Our team is thoroughly vetted and trained to deliver exceptional results.' },
  { icon: '🌿', title: 'Eco-Friendly Products', desc: 'We use safe, environmentally friendly cleaning products for your family.' },
  { icon: '🕐', title: 'Flexible Scheduling', desc: 'Book at your convenience. We offer flexible scheduling options.' },
  { icon: '🛡️', title: 'Fully Insured',          desc: 'Your property is protected with our comprehensive insurance coverage.' },
]

const services = [
  { icon: '🏠', name: 'Residential Cleaning', desc: 'Comprehensive home cleaning services designed for busy families.' },
  { icon: '🏢', name: 'Commercial Cleaning',  desc: 'Professional office and commercial space cleaning solutions.' },
  { icon: '🧹', name: 'Deep Cleaning',        desc: 'Intensive cleaning for those hard-to-reach areas and deep grime.' },
]
