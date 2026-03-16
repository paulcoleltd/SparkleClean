import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title:       'About Us',
  description: 'Learn about SparkleClean — our story, values, and the team behind the sparkle.',
  openGraph: {
    title:       'About SparkleClean',
    description: 'Learn about SparkleClean — our story, values, and the team behind the sparkle.',
    url:         '/about',
    type:        'website',
  },
  twitter: {
    title:       'About SparkleClean',
    description: 'Learn about SparkleClean — our story, values, and the team behind the sparkle.',
  },
}

const values = [
  { icon: '🌿', title: 'Eco-Friendly',     desc: 'We use safe, biodegradable cleaning products that protect your family and the environment.' },
  { icon: '✅', title: 'Trusted & Vetted',  desc: 'Every cleaner is background-checked, insured, and trained to our high standards.' },
  { icon: '⭐', title: 'Quality Guaranteed', desc: 'Not happy? We\'ll come back and make it right at no extra charge.' },
  { icon: '🕐', title: 'Always Punctual',   desc: 'We respect your time. Our teams arrive on schedule, every time.' },
]

export default function AboutPage() {
  return (
    <main>
      <header className="bg-brand-500 py-12 text-center text-white">
        <h1 className="text-3xl font-bold">About SparkleClean</h1>
        <p className="mt-2 text-brand-100">Professional, trusted, and dedicated to your satisfaction</p>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">

        {/* Story */}
        <section className="prose prose-gray mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-gray-800">Our Story</h2>
          <p className="mt-4 leading-relaxed text-gray-600">
            SparkleClean was founded with a simple belief: everyone deserves to come home to
            a clean, healthy space. We started with a small team and a big commitment to quality,
            and we've grown by letting our work speak for itself.
          </p>
          <p className="mt-3 leading-relaxed text-gray-600">
            Today, we serve hundreds of homes and businesses across the area, bringing the same
            care and attention to every job — whether it's a weekly tidy or a full deep clean.
          </p>
        </section>

        {/* Values */}
        <section className="mt-14">
          <h2 className="mb-8 text-center text-2xl font-semibold text-gray-800">Our Values</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {values.map(v => (
              <div key={v.title} className="flex gap-4 rounded-lg border border-gray-100 p-5">
                <span className="text-3xl">{v.icon}</span>
                <div>
                  <h3 className="font-semibold text-gray-800">{v.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Stats */}
        <section className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            { number: '500+', label: 'Happy clients' },
            { number: '5+',   label: 'Years of service' },
            { number: '100%', label: 'Satisfaction rate' },
            { number: '24h',  label: 'Confirmation time' },
          ].map(({ number, label }) => (
            <div key={label} className="rounded-lg bg-brand-50 p-5 text-center">
              <p className="text-3xl font-bold text-brand-500">{number}</p>
              <p className="mt-1 text-sm text-gray-600">{label}</p>
            </div>
          ))}
        </section>

        {/* CTA */}
        <div className="mt-14 text-center">
          <h2 className="text-xl font-semibold text-gray-800">Ready to experience the SparkleClean difference?</h2>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/booking"
              className="rounded-md bg-brand-500 px-6 py-3 font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Book a Cleaning
            </Link>
            <Link
              href="/contact"
              className="rounded-md border border-brand-500 px-6 py-3 font-semibold text-brand-600 hover:bg-brand-50 transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
