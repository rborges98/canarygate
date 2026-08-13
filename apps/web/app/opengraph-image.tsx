import { ImageResponse } from 'next/og'
import { Plus_Jakarta_Sans } from 'next/font/google'

export const alt =
  'CanaryGate — Feature flags. Deploy on Friday. Sleep on Saturday.'
export const size = {
  width: 1200,
  height: 630
}
export const contentType = 'image/png'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '800']
})

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a0a',
          fontFamily: jakarta.style.fontFamily
        }}
      >
        <div
          style={{
            display: 'flex',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 8,
            backgroundColor: '#6366f1'
          }}
        />
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 800,
            color: '#ffffff',
            letterSpacing: '-0.02em'
          }}
        >
          CanaryGate
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 16,
            fontSize: 36,
            fontWeight: 400,
            color: '#818cf8'
          }}
        >
          Feature flags. Deploy on Friday. Sleep on Saturday.
        </div>
      </div>
    ),
    {
      ...size
    }
  )
}
