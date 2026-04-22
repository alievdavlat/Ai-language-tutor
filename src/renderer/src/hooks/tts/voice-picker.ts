export function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: string
): SpeechSynthesisVoice | null {
  if (!voices.length) return null
  const exact = voices.find((v) => v.lang === lang)
  if (exact) return exact
  const prefix = lang.split('-')[0]
  return (
    voices.find((v) => v.lang.startsWith(prefix + '-')) ??
    voices.find((v) => v.lang.startsWith(prefix)) ??
    voices[0]
  )
}
