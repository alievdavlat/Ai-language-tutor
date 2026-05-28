import { useEffect, useMemo, useRef } from 'react'
import { cn } from '../../lib/classnames'

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking'

interface ParticleOrbProps {
  state: OrbState
  /** Outer diameter in px. The orb scales internally to fit. */
  size?: number
  /** Optional live audio level 0..1 for reactive pulse. */
  audioLevel?: number
  className?: string
}

interface Particle { angle: number; radius: number; r: number; opacity: number }

/**
 * Granular particle sphere matching ielts.gg's examiner avatar.
 *
 * Visual notes (from reference frames v1zoom_003, v1zoom_004, v2_005-006):
 * - Hundreds of small dots arranged on the surface of an imagined sphere,
 *   slightly clustered toward the edge to create a hollow-shell feel.
 * - Soft inner glow + outer halo behind the particle layer.
 * - Tiny bright dot at the exact center (the "highlight").
 * - State-driven color: blue when idle/listening, red/pink while the
 *   examiner speaks, sky when thinking.
 */
export default function ParticleOrb({ state, size = 320, audioLevel = 0, className }: ParticleOrbProps): JSX.Element {
  // Stable particle distribution — generated once per orb.
  const particles = useMemo<Particle[]>(() => {
    const out: Particle[] = []
    const count = 380
    for (let i = 0; i < count; i++) {
      // Cluster particles near the surface (radius 0.78–1.0) for a hollow look.
      // A handful sit inside for depth.
      const inner = Math.random() < 0.12
      const radius = inner ? 0.2 + Math.random() * 0.5 : 0.78 + Math.random() * 0.22
      out.push({
        angle: Math.random() * Math.PI * 2,
        radius,
        r: 0.4 + Math.random() * 1.6,
        opacity: 0.4 + Math.random() * 0.6
      })
    }
    return out
  }, [])

  // Rotation animation via requestAnimationFrame for a steady drift.
  const groupRef = useRef<SVGGElement | null>(null)
  useEffect(() => {
    let raf = 0
    let t0 = performance.now()
    const tick = (t: number): void => {
      const elapsed = (t - t0) / 1000
      // Faster while speaking, slower at rest. State affects the visual energy.
      const speed = state === 'speaking' ? 18 : state === 'listening' ? 8 : 4
      if (groupRef.current) {
        groupRef.current.style.transform = `rotate(${elapsed * speed}deg)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [state])

  // Per-state color scheme. Two stops: hot core, cool periphery.
  const colors: Record<OrbState, { core: string; ring: string; halo: string }> = {
    idle:      { core: 'rgb(96, 165, 250)',  ring: 'rgb(56, 132, 220)',  halo: 'rgba(37,99,235,0.40)' },
    listening: { core: 'rgb(96, 165, 250)',  ring: 'rgb(96, 165, 250)',  halo: 'rgba(59,130,246,0.55)' },
    thinking:  { core: 'rgb(125, 211, 252)', ring: 'rgb(56, 189, 248)',  halo: 'rgba(56,189,248,0.45)' },
    speaking:  { core: 'rgb(244, 114, 182)', ring: 'rgb(236, 72, 153)',  halo: 'rgba(236,72,153,0.55)' }
  }
  const c = colors[state]
  const cx = 200, cy = 200, maxR = 170
  // Audio level pumps the orb's effective radius.
  const pulse = 1 + (state === 'speaking' || state === 'listening' ? audioLevel * 0.06 : 0)

  return (
    <div
      className={cn('relative pointer-events-none select-none', className)}
      style={{ width: size, height: size }}
      aria-label="Examiner orb"
    >
      {/* Outer halo */}
      <div
        className="absolute inset-0 rounded-full blur-2xl transition-colors duration-500"
        style={{ background: `radial-gradient(circle, ${c.halo} 0%, transparent 65%)` }}
      />
      {/* Particle SVG */}
      <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="orb-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={c.core} stopOpacity="0.85" />
            <stop offset="55%" stopColor={c.core} stopOpacity="0.30" />
            <stop offset="100%" stopColor={c.core} stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Soft inner glow disc */}
        <circle cx={cx} cy={cy} r={maxR * 0.95 * pulse} fill="url(#orb-core)" />
        {/* Particle layer (rotates) */}
        <g ref={groupRef} style={{ transformOrigin: '200px 200px' }}>
          {particles.map((p, i) => {
            const r = maxR * p.radius * pulse
            const x = cx + r * Math.cos(p.angle)
            const y = cy + r * Math.sin(p.angle)
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={p.r}
                fill={c.ring}
                opacity={p.opacity}
              />
            )
          })}
        </g>
        {/* Bright center dot — the visual highlight */}
        <circle cx={cx} cy={cy} r={2.5} fill="white" opacity={0.95} />
      </svg>
    </div>
  )
}
