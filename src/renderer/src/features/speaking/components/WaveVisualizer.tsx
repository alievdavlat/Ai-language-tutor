import { useEffect, useRef } from 'react'
import { cn } from '../../../lib/classnames'

interface WaveVisualizerProps {
  /** 0..1 — drives the bar heights. Tie to `useAudioLevel`. */
  intensity: number
  /** Dormant when the mic is off. */
  active: boolean
  className?: string
  bars?: number
  color?: string
}

/**
 * Compact bar-spectrum visualiser. Not connected directly to the analyser
 * node — instead we synthesise plausible bar heights from a single intensity
 * value so the caller fully owns the audio plumbing. Looks alive because the
 * draw loop adds per-bar noise + slight trailing smoothing.
 */
export default function WaveVisualizer({
  intensity,
  active,
  className,
  bars = 24,
  color = '#a78bfa'
}: WaveVisualizerProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const smoothedRef = useRef<number[]>(Array.from({ length: bars }, () => 0))
  const rafRef = useRef<number>(0)
  const stateRef = useRef({ intensity, active, color })

  useEffect(() => {
    stateRef.current = { intensity, active, color }
  }, [intensity, active, color])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const resize = (): void => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }
    resize()
    const ro = new ResizeObserver(() => {
      // Reset transform before rescaling so dpr multiplies cleanly.
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      resize()
    })
    ro.observe(canvas)

    const draw = (): void => {
      rafRef.current = requestAnimationFrame(draw)
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      ctx.clearRect(0, 0, width, height)
      const s = stateRef.current
      const inputLevel = s.active ? s.intensity : 0.04
      const barWidth = (width / bars) * 0.55
      const gap = (width / bars) * 0.45
      const midY = height / 2

      for (let i = 0; i < bars; i++) {
        // Mix intensity with a per-bar oscillation so neighbours don't march in lock-step.
        const phase = performance.now() / 120 + i * 0.7
        const wobble = 0.35 + 0.65 * Math.abs(Math.sin(phase))
        const target = inputLevel * wobble
        smoothedRef.current[i] = smoothedRef.current[i] * 0.72 + target * 0.28

        const barHeight = Math.max(2, smoothedRef.current[i] * height * 0.85)
        const x = i * (barWidth + gap) + gap / 2
        const y = midY - barHeight / 2

        ctx.fillStyle = s.color
        ctx.globalAlpha = 0.35 + smoothedRef.current[i] * 0.65
        ctx.fillRect(x, y, barWidth, barHeight)
      }
    }
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
    }
  }, [bars])

  return (
    <canvas
      ref={canvasRef}
      className={cn('w-full h-16 block', className)}
      aria-hidden
    />
  )
}
