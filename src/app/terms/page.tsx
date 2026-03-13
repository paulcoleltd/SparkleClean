import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title:       'Terms of Service',
  description: 'Terms and conditions governing use of SparkleClean services.',
}

const EFFECTIVE_DATE = 'January 1, 2025'

export default function TermsPage() {
  return (
    <main>
      <header className="bg-brand-500 py-12 text-center text-white">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-brand-100">Effective {EFFECTIVE_DATE}</p>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="prose prose-gray max-w-none text-sm leading-relaxed text-gray-600 space-y-8">

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
            <p>By booking a service or using this website you agree to these Terms of Service. If you do not agree, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">2. Services</h2>
            <p>SparkleClean provides residential and commercial cleaning services as described on our <Link href="/services" className="text-brand-600 hover:underline">Services page</Link>. We reserve the right to modify, suspend, or discontinue any service at any time with reasonable notice.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Bookings and Payment</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Bookings are confirmed only after full payment via Stripe</li>
              <li>Prices displayed on the site are in USD and include all applicable fees</li>
              <li>We reserve the right to adjust pricing with 14 days notice for recurring schedules</li>
              <li>Payment is handled by Stripe; we do not store card details</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Cancellation Policy</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Cancellations made at least 24 hours before the scheduled time are accepted via your account</li>
              <li>Cancellations within 24 hours of the appointment may be subject to a fee at our discretion</li>
              <li>Recurring schedules may be cancelled by the customer at any time; only future unbilled occurrences are affected</li>
              <li>We reserve the right to cancel or reschedule in cases of emergency, illness, or circumstances beyond our control</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Customer Responsibilities</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Ensure safe and accessible access to the property at the scheduled time</li>
              <li>Secure or remove fragile, irreplaceable, or hazardous items before our team arrives</li>
              <li>Provide accurate information about the property and any special requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Liability</h2>
            <p>SparkleClean carries comprehensive liability insurance. In the unlikely event of damage caused by our staff, please notify us within 48 hours of service completion. Our liability is limited to the cost of repair or replacement up to the value of the service booking.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Satisfaction Guarantee</h2>
            <p>If you are not satisfied with the quality of our service, contact us within 24 hours and we will return to address any concerns at no additional charge.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately at <a href="mailto:info@sparkleclean.com" className="text-brand-600 hover:underline">info@sparkleclean.com</a> if you suspect unauthorised access to your account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">9. Governing Law</h2>
            <p>These terms are governed by the laws of the applicable jurisdiction. Any disputes shall be resolved through good-faith negotiation or, if necessary, binding arbitration.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">10. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of our services constitutes acceptance of the revised terms. For questions, contact us via our <Link href="/contact" className="text-brand-600 hover:underline">contact form</Link>.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
