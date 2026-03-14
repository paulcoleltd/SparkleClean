import { withSentryConfig } from '@sentry/nextjs'

// Build a flat Content-Security-Policy string from a structured object.
function csp(directives) {
  return Object.entries(directives)
    .filter(([, values]) => values.length > 0)
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ')
}

const isDev = process.env.NODE_ENV === 'development'

const contentSecurityPolicy = csp({
  'default-src':     ["'self'"],
  'script-src':      ["'self'", "'unsafe-inline'", 'https://js.stripe.com', ...(isDev ? ["'unsafe-eval'"] : [])],
  'style-src':       ["'self'", "'unsafe-inline'"],
  'img-src':         ["'self'", 'data:', 'blob:'],
  'font-src':        ["'self'"],
  'connect-src':     ["'self'", 'https://api.stripe.com', 'https://checkout.stripe.com', 'https://*.supabase.co'],
  'media-src':       ["'self'"],
  'object-src':      ["'none'"],
  'frame-src':       ['https://js.stripe.com'],
  'frame-ancestors': ["'none'"],
  'base-uri':        ["'self'"],
  'form-action':     ["'self'"],
  'upgrade-insecure-requests': isDev ? [] : [''],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy',  value: contentSecurityPolicy },
          { key: 'X-Frame-Options',          value: 'DENY' },
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
          {
            key:   'Strict-Transport-Security',
            value: isDev ? '' : 'max-age=63072000; includeSubDomains; preload',
          },
        ].filter(h => h.value !== ''),
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  silent:                !process.env.CI,
  disableLogger:         true,
  widenClientFileUpload: true,
  hideSourceMaps:        true,
})
