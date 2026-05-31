/**
 * Real seed cover images — generated (Pollinations) and uploaded to Supabase
 * Storage by scripts/flush-seed.mjs. NO picsum / placeholders.
 *
 * These public URLs are deterministic (uploads/seed/<name>.jpg) so the local
 * seed and the cloud seed reference the exact same real images.
 */
const BASE = 'https://zswfnhlslohcddxguqhs.supabase.co/storage/v1/object/public/uploads/seed'

export const SEED_IMG = {
  courseThumb: `${BASE}/course-business.jpg`,
  courseBanner: `${BASE}/course-business-banner.jpg`,
  live: `${BASE}/live-business.jpg`,
  announce: `${BASE}/announce-masterclass.jpg`,
  group: `${BASE}/group-business.jpg`,
  challenge: `${BASE}/challenge-streak.jpg`,
  libBook: `${BASE}/lib-book.jpg`,
  libAudio: `${BASE}/lib-audio.jpg`
} as const
