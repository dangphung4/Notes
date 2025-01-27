import { ImageResponse } from '@vercel/og'

export const config = {
  runtime: 'edge',
}

export default function handler() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          padding: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src="/src/assets/note.svg"
            alt="Logo"
            width="120"
            height="120"
          />
          <h1
            style={{
              fontSize: 60,
              fontWeight: 'bold',
              color: '#fff',
              marginLeft: 20,
            }}
          >
            Notes
          </h1>
        </div>
        <p
          style={{
            fontSize: 30,
            color: '#888',
            textAlign: 'center',
            marginTop: 20,
          }}
        >
          A Modern Note-Taking App
        </p>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
} 