import { ImageResponse } from 'next/og'

export const size = { width: 192, height: 192 }
export const contentType = 'image/png'

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
          backgroundColor: '#059669',
          borderRadius: 32,
          fontSize: 120,
          color: 'white',
          fontFamily: 'serif',
        }}
      >
        ♠
      </div>
    ),
    { ...size }
  )
}
