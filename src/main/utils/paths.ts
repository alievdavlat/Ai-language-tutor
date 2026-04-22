import { app } from 'electron'
import path from 'node:path'

export function userDataPath(...segments: string[]): string {
  return path.join(app.getPath('userData'), ...segments)
}

export function profileFilePath(): string {
  return userDataPath('user_profile.json')
}

export function whisperModelsDir(): string {
  return userDataPath('models', 'whisper')
}

export function whisperModelPath(fileName: string): string {
  return path.join(whisperModelsDir(), fileName)
}

export function audioCacheDir(): string {
  return userDataPath('audio-cache')
}
