import type { Metadata } from 'next'
import { ContactForm } from './ContactForm'

export const metadata: Metadata = {
  title:       'Contact Us',
  description: 'Get in touch with SparkleClean. We\'re here to help with any questions about our cleaning services.',
  openGraph: {
    title:       'Contact SparkleClean',
    description: 'Get in touch with SparkleClean. We\'re here to help with any questions about our cleaning services.',
    url:         '/contact',
    type:        'website',
  },
  twitter: {
    title:       'Contact SparkleClean',
    description: 'Get in touch with SparkleClean. We\'re here to help with any questions about our cleaning services.',
  },
}

export default function ContactPage() {
  return (
    <main>
      <header className="bg-brand-500 py-12 text-center text-white">
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="mt-2 text-brand-100">We'd love to hear from you</p>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">

          {/* Contact info */}
          <div className="space-y-6">
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-800">Get In Touch</h2>
              <p className="text-sm leading-relaxed text-gray-600">
                Have a question about our services? Want to discuss a custom cleaning plan?
                We're here to help.
              </p>
            </div>

            {[
              { label: 'Email', value: 'info@sparkleclean.com', href: 'mailto:info@sparkleclean.com' },
              { label: 'Phone', value: '(123) 456-7890',        href: 'tel:+11234567890' },
            ].map(({ label, value, href }) => (
              <div key={label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</p>
                <a href={href} className="mt-1 text-sm font-medium text-brand-600 hover:underline">
                  {value}
                </a>
              </div>
            ))}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Hours</p>
              <p className="mt-1 text-sm text-gray-600">Mon–Fri: 8:00 AM – 6:00 PM</p>
              <p className="text-sm text-gray-600">Sat: 9:00 AM – 4:00 PM</p>
              <p className="text-sm text-gray-600">Sun: Closed</p>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </div>
    </main>
  )
}
