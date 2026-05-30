/**
 * Course/content cover helpers. A cover can be a Tailwind gradient class
 * (e.g. "from-sky-500 to-blue-700") or an image (data: URL or remote URL).
 */
export function isImageCover(s?: string): boolean {
  return !!s && /^(https?:|data:|blob:|\/)/.test(s)
}

/** Read a File into a data: URL so it can be stored locally (offline-friendly). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = () => reject(fr.error ?? new Error('read failed'))
    fr.readAsDataURL(file)
  })
}
