import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const alt         = 'Our Services — SparkleClean'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

const SERVICES = [
  { label: 'Residential', price: '$150', icon: '🏠' },
  { label: 'Commercial',  price: '$200', icon: '🏢' },
  { label: 'Deep Clean',  price: '$300', icon: '✨' },
  { label: 'Specialized', price: '$250', icon: '🔧' },
]

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          '100%',
          height:         '100%',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          fontFamily:      'sans-serif',
          padding:         '60px',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <span style={{ color: '#4CAF50', fontSize: '28px' }}>✦</span>
          <span style={{ color: '#6b7280', fontSize: '20px', fontWeight: '500' }}>SparkleClean</span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize:     '56px',
            fontWeight:   '700',
            color:        '#111827',
            marginBottom: '12px',
            letterSpacing: '-1.5px',
          }}
        >
          Professional Cleaning Services
        </div>
        <div style={{ fontSize: '24px', color: '#6b7280', marginBottom: '52px' }}>
          Residential · Commercial · Deep Clean · Specialized
        </div>

        {/* Service cards */}
        <div style={{ display: 'flex', gap: '20px' }}>
          {SERVICES.map(s => (
            <div
              key={s.label}
              style={{
                display:         'flex',
                flexDirection:   'column',
                alignItems:      'center',
                backgroundColor: '#ffffff',
                borderRadius:    '16px',
                padding:         '28px 32px',
                border:          '2px solid #e5e7eb',
                minWidth:        '200px',
              }}
            >
              <span style={{ fontSize: '36px', marginBottom: '10px' }}>{s.icon}</span>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginBottom: '6px' }}>
                {s.label}
              </span>
              <span style={{ fontSize: '22px', fontWeight: '700', color: '#4CAF50' }}>
                {s.price}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
