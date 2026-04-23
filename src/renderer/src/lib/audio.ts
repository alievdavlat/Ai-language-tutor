import type { UserSettings } from '@shared/types'

export interface MicProcessingPrefs {
  noiseSuppression?: boolean
  echoCancellation?: boolean
  autoGainControl?: boolean
}

/**
 * Build `MediaTrackConstraints` for mic capture from the user's settings. Each
 * flag is opt-in through the browser's built-in WebRTC pipeline (Chromium ships
 * RNNoise-equivalent suppression, AEC3, and AGC2). Missing values default to
 * enabled so profiles saved before Phase 5 keep working.
 */
export function getAudioConstraints(prefs?: MicProcessingPrefs): MediaTrackConstraints {
  return {
    channelCount: 1,
    noiseSuppression: prefs?.noiseSuppression ?? true,
    echoCancellation: prefs?.echoCancellation ?? true,
    autoGainControl: prefs?.autoGainControl ?? true
  }
}

/** Narrow a full UserSettings down to just the mic-processing flags. */
export function micPrefsFromSettings(settings: UserSettings | null | undefined): MicProcessingPrefs {
  return {
    noiseSuppression: settings?.noiseSuppression,
    echoCancellation: settings?.echoCancellation,
    autoGainControl: settings?.autoGainControl
  }
}

/** Convert a raw Float32 PCM buffer (1 channel) to a 16-bit WAV blob at 16 kHz. */
export function pcm16kMonoFloat32ToWav(samples: Float32Array, sampleRate = 16000): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)

  const writeStr = (offset: number, str: string): void => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, samples.length * 2, true)

  let offset = 44
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}
