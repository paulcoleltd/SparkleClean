import type { Metadata } from 'next'
import { Providers } from './providers'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import './globals.css'

export const metadata: Metadata = {
  title:        { default: 'SparkleClean', template: '%s | SparkleClean' },
  description:  'Professional cleaning services for residential and commercial properties. Fast, reliable, and affordable.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  openGraph: {
    siteName:    'SparkleClean',
    type:        'website',
    locale:      'en_US',
    title:       { default: 'SparkleClean', template: '%s | SparkleClean' },
    description: 'Professional cleaning services for residential and commercial properties. Fast, reliable, and affordable.',
    images:      [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'SparkleClean — Professional Cleaning Services' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       { default: 'SparkleClean', template: '%s | SparkleClean' },
    description: 'Professional cleaning services for residential and commercial properties. Fast, reliable, and affordable.',
    images:      ['/opengraph-image'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white font-sans text-gray-800 antialiased">
        <Providers>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
