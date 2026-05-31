/**
 * Tray icon, generated in-process. The repo ships no icon assets, so rather than
 * depend on a PNG that may or may not be packaged we draw a small brand glyph
 * (an indigo speech bubble with three white dots) straight into a BGRA buffer
 * and hand it to `nativeImage.createFromBitmap`. This works identically in dev
 * and in the packaged build with zero asset plumbing.
 */
import { nativeImage, type NativeImage } from 'electron'

const SIZE = 32

// Brand indigo (#6366F1) — matches the renderer's brand-500 accent.
const BRAND = { r: 0x63, g: 0x66, b: 0xf1 }

function blendPixel(
  buf: Buffer,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a: number
): void {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE || a <= 0) return
  const i = (y * SIZE + x) * 4
  // nativeImage.createFromBitmap expects premultiplied BGRA on every platform.
  const af = a / 255
  buf[i] = Math.round(b * af) // B
  buf[i + 1] = Math.round(g * af) // G
  buf[i + 2] = Math.round(r * af) // R
  buf[i + 3] = a // A
}

/** Build the colored tray icon as a 32×32 NativeImage. */
export function createTrayIcon(): NativeImage {
  const buf = Buffer.alloc(SIZE * SIZE * 4) // transparent

  const pad = 2
  const left = pad
  const right = SIZE - pad - 1
  const top = pad
  const bottom = SIZE - pad - 7 // leave room for the tail
  const radius = 7

  const inRoundRect = (x: number, y: number): boolean => {
    if (x < left || x > right || y < top || y > bottom) return false
    const cxL = left + radius
    const cxR = right - radius
    const cyT = top + radius
    const cyB = bottom - radius
    const r2 = radius * radius
    if (x < cxL && y < cyT) return (x - cxL) ** 2 + (y - cyT) ** 2 <= r2
    if (x > cxR && y < cyT) return (x - cxR) ** 2 + (y - cyT) ** 2 <= r2
    if (x < cxL && y > cyB) return (x - cxL) ** 2 + (y - cyB) ** 2 <= r2
    if (x > cxR && y > cyB) return (x - cxR) ** 2 + (y - cyB) ** 2 <= r2
    return true
  }

  // A little tail under the bottom-left of the bubble.
  const tailX = left + 5
  const inTail = (x: number, y: number): boolean => {
    if (y <= bottom || y >= bottom + 6) return false
    const depth = y - bottom // 1..5
    return x >= tailX && x <= tailX + (7 - depth)
  }

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (inRoundRect(x, y) || inTail(x, y)) {
        blendPixel(buf, x, y, BRAND.r, BRAND.g, BRAND.b, 255)
      }
    }
  }

  // Three white "chat" dots centered in the bubble.
  const cy = Math.round((top + bottom) / 2)
  const dotR = 2.4
  for (const cx of [left + 8, Math.round((left + right) / 2), right - 8]) {
    for (let y = cy - 3; y <= cy + 3; y++) {
      for (let x = cx - 3; x <= cx + 3; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= dotR * dotR) {
          blendPixel(buf, x, y, 255, 255, 255, 255)
        }
      }
    }
  }

  return nativeImage.createFromBitmap(buf, { width: SIZE, height: SIZE })
}
