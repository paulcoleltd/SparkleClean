import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const alt         = 'About SparkleClean — Professional Cleaning You Can Trust'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

const PILLARS = [
  { icon: '⭐', label: 'Trusted' },
  { icon: '🕐', label: 'Reliable' },
  { icon: '✅', label: 'Guaranteed' },
  { icon: '💚', label: 'Eco-Friendly' },
]

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:           '100%',
          height:          '100%',
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          justifyContent:  'center',
          backgroundColor: '#4CAF50',
          fontFamily:      'sans-serif',
          position:        'relative',
          overflow:        'hidden',
        }}
      >
        {/* Subtle texture circles */}
        <div
          style={{
            position:        'absolute',
            top:             '-80px',
            left:            '-80px',
            width:           '350px',
            height:          '350px',
            borderRadius:    '50%',
            backgroundColor: 'rgba(255,255,255,0.07)',
          }}
        />
        <div
          style={{
            position:        'absolute',
            bottom:          '-60px',
            right:           '-60px',
            width:           '300px',
            height:          '300px',
            borderRadius:    '50%',
            backgroundColor: 'rgba(255,255,255,0.07)',
          }}
        />

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <span style={{ color: '#ffffff', fontSize: '32px' }}>✦</span>
          <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '24px', fontWeight: '500' }}>
            SparkleClean
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize:     '62px',
            fontWeight:   '700',
            color:        '#ffffff',
            letterSpacing: '-2px',
            marginBottom:  '16px',
            textAlign:     'center',
          }}
        >
          Cleaning You Can Trust
        </div>

        {/* Sub */}
        <div
          style={{
            fontSize:     '26px',
            color:        'rgba(255,255,255,0.85)',
            marginBottom: '52px',
            textAlign:    'center',
          }}
        >
          Family-owned · Fully insured · Satisfaction guaranteed
        </div>

        {/* Pillars */}
        <div style={{ display: 'flex', gap: '32px' }}>
          {PILLARS.map(p => (
            <div
              key={p.label}
              style={{
                display:         'flex',
                flexDirection:   'column',
                alignItems:      'center',
                gap:             '8px',
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderRadius:    '16px',
                padding:         '20px 28px',
              }}
            >
              <span style={{ fontSize: '32px' }}>{p.icon}</span>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff' }}>{p.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
