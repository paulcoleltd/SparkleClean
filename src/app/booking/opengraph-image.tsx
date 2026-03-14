import { ImageResponse } from 'next/og'

export const runtime     = 'edge'
export const alt         = 'Book a Cleaning — SparkleClean'
export const size        = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:          '100%',
          height:         '100%',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'flex-start',
          justifyContent: 'center',
          background:     'linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
          fontFamily:     'sans-serif',
          padding:        '80px',
        }}
      >
        {/* Accent circle */}
        <div
          style={{
            position:        'absolute',
            top:             '-60px',
            right:           '-60px',
            width:           '400px',
            height:          '400px',
            borderRadius:    '50%',
            backgroundColor: 'rgba(76,175,80,0.15)',
          }}
        />
        <div
          style={{
            position:        'absolute',
            bottom:          '-100px',
            right:           '200px',
            width:           '280px',
            height:          '280px',
            borderRadius:    '50%',
            backgroundColor: 'rgba(76,175,80,0.08)',
          }}
        />

        {/* Brand tag */}
        <div
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             '10px',
            marginBottom:    '32px',
          }}
        >
          <span style={{ color: '#4CAF50', fontSize: '28px' }}>✦</span>
          <span style={{ color: '#9ca3af', fontSize: '22px', fontWeight: '500' }}>SparkleClean</span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize:      '68px',
            fontWeight:    '700',
            color:         '#ffffff',
            lineHeight:    '1.1',
            marginBottom:  '24px',
            letterSpacing: '-2px',
            maxWidth:      '700px',
          }}
        >
          Book Your Cleaning Online
        </div>

        {/* Subtext */}
        <div
          style={{
            fontSize:     '26px',
            color:        '#9ca3af',
            marginBottom: '48px',
            maxWidth:     '600px',
            lineHeight:   '1.4',
          }}
        >
          Fast, simple booking. Instant confirmation. Professional results.
        </div>

        {/* CTA pill */}
        <div
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             '12px',
            backgroundColor: '#4CAF50',
            borderRadius:    '999px',
            padding:         '16px 36px',
          }}
        >
          <span style={{ color: '#ffffff', fontSize: '22px', fontWeight: '600' }}>
            Book Now — Takes 2 Minutes
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
