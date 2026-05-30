import puppeteer from 'puppeteer'
import fs from 'node:fs'

const BASE = 'http://localhost:5175'
const OUT = 'C:\\Users\\ACER\\Desktop\\speaking-app-screenshot'
fs.mkdirSync(OUT, { recursive: true })

// Every meaningful route (param/detail routes skipped — capture the hubs).
const ROUTES = [
  '/home', '/speaking', '/speaking/call', '/courses', '/library', '/vocabulary',
  '/grammar', '/progress', '/exams', '/exams/ielts/mock', '/level-test',
  '/companions', '/avatar-studio', '/paths', '/stories', '/shadowing', '/watch',
  '/flashcards', '/feedback', '/tutors', '/ai-tutor', '/leaderboard', '/quests',
  '/achievements', '/profile', '/account', '/notifications', '/inbox', '/explore',
  '/community', '/live', '/quiz/live', '/settings', '/teacher', '/teacher/new',
  '/teacher/analytics', '/teacher/students', '/teacher/monetization', '/teacher/live',
  '/channel', '/signin', '/signup'
]

const fileFor = (r) => (r.replace(/^\//, '').replace(/\//g, '-') || 'root') + '.png'
const sleep = (ms) => new Promise((res) => setTimeout(res, ms))

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 })

// Seed auth + an active AI provider + companion so gated pages render.
await page.goto(BASE + '/', { waitUntil: 'networkidle2', timeout: 30000 })
await sleep(800)
await page.evaluate(async () => {
  localStorage.setItem('speakai.authenticated', 'true')
  localStorage.setItem('speakai.onboardingComplete', 'true')
  localStorage.setItem('speakai.role', 'student')
  try {
    const p = await window.api?.profile?.load?.()
    if (p) {
      p.settings = p.settings || {}
      p.settings.ai = { activeProviderId: 'gemini', tokens: { gemini: 'demo' }, models: {} }
      p.settings.characterId = p.settings.characterId || 'emma'
      await window.api.profile.save(p)
    }
  } catch {}
})

const done = []
for (const route of ROUTES) {
  try {
    await page.goto(BASE + '/#' + route, { waitUntil: 'networkidle2', timeout: 25000 })
    await sleep(1800) // let images (DiceBear) + animations settle
    const file = OUT + '\\' + fileFor(route)
    await page.screenshot({ path: file, fullPage: true })
    done.push(fileFor(route))
    console.log('✓', route)
  } catch (e) {
    console.log('✗', route, String(e).slice(0, 80))
  }
}

await browser.close()
console.log(`\nSaved ${done.length}/${ROUTES.length} screenshots to ${OUT}`)
