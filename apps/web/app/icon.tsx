import { ImageResponse } from 'next/og'
import { Plus_Jakarta_Sans } from 'next/font/google'

export const size = {
  width: 512,
  height: 512
}
export const contentType = 'image/png'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: '800'
})

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          fontFamily: jakarta.style.fontFamily
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 300,
            fontWeight: 800,
            color: '#ffffff'
          }}
        >
          C
        </div>
      </div>
    ),
    {
      ...size
    }
  )
}
