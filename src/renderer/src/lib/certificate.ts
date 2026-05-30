import type { Certificate } from '../services/content/progress'

/**
 * Render a completion certificate to a canvas and download it as a PNG.
 * Fully client-side (no libraries, no network) so it works offline.
 */
export function downloadCertificate(cert: Certificate): void {
  const W = 1400
  const H = 990
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#0b1020')
  bg.addColorStop(1, '#111a35')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // Border
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 6
  ctx.strokeRect(40, 40, W - 80, H - 80)
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'
  ctx.lineWidth = 2
  ctx.strokeRect(60, 60, W - 120, H - 120)

  const center = W / 2
  ctx.textAlign = 'center'

  ctx.fillStyle = '#93c5fd'
  ctx.font = '600 30px Georgia, serif'
  ctx.fillText('SPEAKAI · CERTIFICATE OF COMPLETION', center, 180)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'italic 34px Georgia, serif'
  ctx.fillText('This is proudly presented to', center, 320)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 76px Georgia, serif'
  ctx.fillText(cert.learnerName, center, 420)

  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(center - 320, 450)
  ctx.lineTo(center + 320, 450)
  ctx.stroke()

  ctx.fillStyle = '#cbd5e1'
  ctx.font = '32px Georgia, serif'
  ctx.fillText('for successfully completing the course', center, 530)

  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 48px Georgia, serif'
  wrapText(ctx, cert.courseTitle, center, 600, W - 320, 56)

  ctx.fillStyle = '#34d399'
  ctx.font = 'bold 40px Georgia, serif'
  ctx.fillText(`Final score: ${cert.score}%`, center, 730)

  const date = new Date(cert.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
  ctx.fillStyle = '#94a3b8'
  ctx.font = '26px Georgia, serif'
  ctx.fillText(`Issued ${date}`, center, 850)

  const a = document.createElement('a')
  a.href = canvas.toDataURL('image/png')
  a.download = `certificate-${cert.courseId}.png`
  a.click()
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): void {
  const words = text.split(' ')
  let line = ''
  let yy = y
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy)
      line = w
      yy += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, yy)
}
