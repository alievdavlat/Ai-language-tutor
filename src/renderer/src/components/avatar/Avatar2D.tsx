import type { AvatarProps } from './types'

function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value))
}

export default function Avatar2D({ mouthOpen, emotion = 'neutral', name }: AvatarProps): JSX.Element {
  const normalizedOpen = clamp(mouthOpen)
  const surprised = emotion === 'surprised'
  const mouthHeight = (surprised ? 14 : 4) + normalizedOpen * 22
  const mouthWidth = emotion === 'happy' ? 58 : surprised ? 40 : emotion === 'concerned' ? 42 : 48
  const eyeY = emotion === 'thinking' ? 108 : 110
  const eyeRy = surprised ? 11 : 8
  const browLift = emotion === 'concerned' ? -4 : surprised ? 6 : 0

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 240 300" className="w-full max-w-[360px] drop-shadow-2xl">
        <defs>
          <radialGradient id="face-grad" cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#ffd9b8" />
            <stop offset="100%" stopColor="#e0a478" />
          </radialGradient>
          <linearGradient id="hair-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2a1f16" />
            <stop offset="100%" stopColor="#4a3422" />
          </linearGradient>
        </defs>

        <rect x="95" y="215" width="50" height="40" rx="10" fill="#d4936a" />
        <path
          d="M40 300 C 50 260, 100 245, 120 245 C 140 245, 190 260, 200 300 Z"
          fill="#3b4a66"
        />

        <ellipse cx="120" cy="130" rx="72" ry="88" fill="url(#face-grad)" />

        <path
          d="M56 120 C 50 60, 110 40, 120 40 C 130 40, 190 60, 184 120 C 176 95, 160 85, 140 85 C 130 85, 128 98, 120 98 C 112 98, 110 85, 100 85 C 80 85, 64 95, 56 120 Z"
          fill="url(#hair-grad)"
        />

        <g transform={`translate(0 ${browLift})`}>
          <rect x="82" y="100" width="28" height="5" rx="2" fill="#2a1f16" />
          <rect x="130" y="100" width="28" height="5" rx="2" fill="#2a1f16" />
        </g>

        <g className="blink">
          <ellipse cx="96" cy={eyeY} rx="10" ry={eyeRy} fill="white" />
          <ellipse cx="144" cy={eyeY} rx="10" ry={eyeRy} fill="white" />
          <circle cx="96" cy={eyeY} r="5" fill="#1a2b4a" />
          <circle cx="144" cy={eyeY} r="5" fill="#1a2b4a" />
          <circle cx="97.5" cy={eyeY - 1.5} r="1.5" fill="white" />
          <circle cx="145.5" cy={eyeY - 1.5} r="1.5" fill="white" />
        </g>

        <path
          d="M120 128 C 116 148, 114 160, 116 168 C 118 172, 122 172, 124 168 C 126 160, 124 148, 120 128 Z"
          fill="#c98559"
          opacity="0.6"
        />

        <g transform="translate(120 180)">
          <rect
            x={-mouthWidth / 2}
            y={-mouthHeight / 2}
            width={mouthWidth}
            height={mouthHeight}
            rx={Math.min(mouthHeight, 10)}
            fill="#3d1f1a"
          />
          <rect
            x={-mouthWidth / 2 + 4}
            y={-mouthHeight / 2 + 2}
            width={mouthWidth - 8}
            height={Math.max(2, mouthHeight / 4)}
            rx={2}
            fill="#e5e5e5"
            opacity={mouthHeight > 8 ? 1 : 0}
          />
        </g>
      </svg>

      <style>{`
        .blink { transform-origin: center; animation: blink 5s infinite; }
        @keyframes blink {
          0%, 92%, 96%, 100% { transform: scaleY(1); }
          94% { transform: scaleY(0.1); }
        }
      `}</style>

      {name && <p className="text-sm text-slate-400 mt-2">{name}</p>}
    </div>
  )
}
