import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #ea2a33 0%, #4a0404 100%)',
          color: '#fff',
          fontSize: 108,
          fontWeight: 800,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        D
      </div>
    ),
    size,
  );
}
