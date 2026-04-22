import { useEffect, useState } from 'react'
import type { Accent } from '@shared/types'
import { ACCENT_TO_LANG } from '@shared/constants'

export interface SystemVoice {
  voiceURI: string
  name: string
  lang: string
  localService: boolean
  isDefault: boolean
}

function toSystemVoice(v: SpeechSynthesisVoice): SystemVoice {
  return {
    voiceURI: v.voiceURI,
    name: v.name,
    lang: v.lang,
    localService: v.localService,
    isDefault: v.default
  }
}

function voicesMatching(voices: SpeechSynthesisVoice[], accent?: Accent): SystemVoice[] {
  if (!accent) return voices.map(toSystemVoice)
  const lang = ACCENT_TO_LANG[accent]
  const prefix = lang.split('-')[0]

  return voices
    .filter((v) => v.lang === lang || v.lang.startsWith(prefix))
    .sort((a, b) => {
      const aExact = a.lang === lang ? -1 : 0
      const bExact = b.lang === lang ? -1 : 0
      return aExact - bExact
    })
    .map(toSystemVoice)
}

/**
 * Subscribes to the browser's SpeechSynthesis voices. Filters by accent when
 * provided (exact match first, then same-language fallback).
 */
export function useSystemVoices(accent?: Accent): SystemVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

  useEffect(() => {
    const load = (): void => setVoices(window.speechSynthesis.getVoices())
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  return voicesMatching(voices, accent)
}

export function previewSystemVoice(voiceURI: string, text = 'Hi there, this is my voice.'): void {
  const all = window.speechSynthesis.getVoices()
  const voice = all.find((v) => v.voiceURI === voiceURI)
  if (!voice) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.voice = voice
  utter.lang = voice.lang
  utter.rate = 1
  window.speechSynthesis.speak(utter)
}
