import type { WhisperModelTag, WhisperTranscription } from '@shared/types'

export interface TranscribeOptions {
  modelTag: WhisperModelTag
  /** Absolute path to a .wav file (16kHz mono recommended). */
  audioFilePath: string
  language?: string
}

/**
 * Main-process Whisper transcription was previously implemented via
 * `nodejs-whisper`, but that package shells out to a `node` binary that does
 * not exist inside Electron's packaged environment (execPath points at the
 * Electron launcher, not a stand-alone Node).
 *
 * Whisper now runs entirely in the renderer through `@huggingface/transformers`
 * — see `src/renderer/src/lib/whisper-client.ts`. This stub is preserved for
 * future Phase 3.8 use (a real whisper.cpp sidecar) and to keep the IPC
 * surface stable. Calling it throws a clear error.
 */
export async function transcribeAudioFile(
  _opts: TranscribeOptions
): Promise<WhisperTranscription> {
  throw new Error(
    'Main-process Whisper is disabled. Transcription runs in the renderer via transformers.js.'
  )
}
