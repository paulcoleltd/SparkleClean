import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt     = 'SparkleClean — Professional Cleaning Services'
export const size    = { width: 1200, height: 630 }
export const contentType = 'image/png'

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
        }}
      >
        {/* Decorative background circles */}
        <div
          style={{
            position:        'absolute',
            top:             '-120px',
            right:           '-120px',
            width:           '480px',
            height:          '480px',
            borderRadius:    '50%',
            backgroundColor: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            position:        'absolute',
            bottom:          '-80px',
            left:            '-80px',
            width:           '320px',
            height:          '320px',
            borderRadius:    '50%',
            backgroundColor: 'rgba(255,255,255,0.06)',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            fontSize:   '72px',
            marginBottom: '16px',
          }}
        >
          ✦
        </div>

        {/* Brand name */}
        <div
          style={{
            fontSize:     '80px',
            fontWeight:   '700',
            color:        '#ffffff',
            letterSpacing: '-2px',
            marginBottom:  '16px',
          }}
        >
          SparkleClean
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize:     '32px',
            color:        'rgba(255,255,255,0.85)',
            fontWeight:   '400',
            marginBottom:  '48px',
          }}
        >
          Professional Cleaning Services
        </div>

        {/* Pill badges */}
        <div
          style={{
            display:    'flex',
            gap:        '16px',
          }}
        >
          {['Residential', 'Commercial', 'Deep Clean'].map((label) => (
            <div
              key={label}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius:    '999px',
                padding:         '10px 28px',
                color:           '#ffffff',
                fontSize:        '22px',
                fontWeight:      '500',
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
