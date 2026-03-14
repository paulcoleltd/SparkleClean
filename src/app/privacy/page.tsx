import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title:       'Privacy Policy',
  description: 'How SparkleClean collects, uses, and protects your personal information.',
}

const EFFECTIVE_DATE = 'January 1, 2025'

export default function PrivacyPage() {
  return (
    <main>
      <header className="bg-brand-500 py-12 text-center text-white">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-brand-100">Effective {EFFECTIVE_DATE}</p>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="prose prose-gray max-w-none text-sm leading-relaxed text-gray-600 space-y-8">

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">1. Information We Collect</h2>
            <p>When you book a cleaning service or contact us, we collect:</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Name, email address, phone number, and service address</li>
              <li>Booking details (service type, date, preferences)</li>
              <li>Payment information — processed securely by Stripe; we never store card details</li>
              <li>Communications you send us via the contact form</li>
              <li>Account credentials if you create a customer account (password is hashed, never stored in plain text)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To schedule, confirm, and fulfil your cleaning bookings</li>
              <li>To send booking confirmations, reminders, and receipts</li>
              <li>To invite you to leave a review after a completed service</li>
              <li>To respond to enquiries submitted through our contact form</li>
              <li>To improve our services and website experience</li>
              <li>To send marketing communications only if you have opted in</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">3. Sharing Your Information</h2>
            <p>We do not sell your personal data. We share information only with:</p>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li><strong>Stripe</strong> — for payment processing</li>
              <li><strong>Resend</strong> — for transactional email delivery</li>
              <li><strong>Supabase / Vercel</strong> — for database hosting and deployment infrastructure</li>
            </ul>
            <p className="mt-2">Each third party is bound by their own privacy policies and applicable data protection law.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">4. Data Retention</h2>
            <p>We retain booking records for up to 7 years for legal and accounting purposes. You may request deletion of your account and associated personal data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">5. Your Rights</h2>
            <p>Depending on your location you may have the right to: access, correct, or delete your personal data; object to or restrict processing; and data portability. To exercise any right, contact us at <a href="mailto:privacy@sparkleclean.com" className="text-brand-600 hover:underline">privacy@sparkleclean.com</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">6. Cookies</h2>
            <p>We use only essential session cookies required for authentication. We do not use advertising or tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">7. Changes to This Policy</h2>
            <p>We may update this policy periodically. Continued use of our services after changes are posted constitutes acceptance. The effective date at the top of this page reflects the most recent revision.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">8. Contact</h2>
            <p>Questions about this policy? Reach us at <a href="mailto:privacy@sparkleclean.com" className="text-brand-600 hover:underline">privacy@sparkleclean.com</a> or via our <Link href="/contact" className="text-brand-600 hover:underline">contact form</Link>.</p>
          </section>
        </div>
      </div>
    </main>
  )
}
