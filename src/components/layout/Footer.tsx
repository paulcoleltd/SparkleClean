import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-gray-800 text-gray-300">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">

          {/* Brand */}
          <div>
            <p className="mb-3 text-lg font-bold text-white">✨ SparkleClean</p>
            <p className="text-sm leading-relaxed">
              Professional cleaning services for a cleaner, healthier home.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Quick Links</p>
            <ul className="space-y-2 text-sm" role="list">
              {[
                ['/',         'Home'],
                ['/services', 'Services'],
                ['/about',    'About Us'],
                ['/contact',  'Contact'],
                ['/booking',  'Book Now'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href!} className="hover:text-brand-400 transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Services</p>
            <ul className="space-y-2 text-sm" role="list">
              {['Residential Cleaning', 'Commercial Cleaning', 'Deep Cleaning', 'Specialized Cleaning'].map(s => (
                <li key={s}>
                  <Link href="/services" className="hover:text-brand-400 transition-colors">{s}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Contact</p>
            <ul className="space-y-2 text-sm" role="list">
              <li>
                <a href="mailto:info@sparkleclean.com" className="hover:text-brand-400 transition-colors">
                  info@sparkleclean.com
                </a>
              </li>
              <li>
                <a href="tel:+11234567890" className="hover:text-brand-400 transition-colors">
                  (123) 456-7890
                </a>
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              {['Facebook', 'Instagram', 'Twitter'].map(name => (
                <a
                  key={name}
                  href="#"
                  aria-label={name}
                  className="text-gray-400 hover:text-brand-400 transition-colors"
                >
                  <SocialIcon name={name} />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-700 pt-6 text-center text-xs text-gray-500">
          <p>
            © {new Date().getFullYear()} SparkleClean. All rights reserved.{' '}
            <Link href="/privacy" className="hover:text-brand-400">Privacy Policy</Link>
            {' · '}
            <Link href="/terms" className="hover:text-brand-400">Terms of Service</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}

function SocialIcon({ name }: { name: string }) {
  // Simple text placeholders — replace with lucide-react or SVG icons
  const initials: Record<string, string> = { Facebook: 'f', Instagram: 'ig', Twitter: 'x' }
  return (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-600 text-xs font-bold">
      {initials[name] ?? name[0]}
    </span>
  )
}
