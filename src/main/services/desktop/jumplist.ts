/**
 * Windows taskbar jump-list (#16) — the menu that appears when you right-click
 * the app's taskbar button or its Start-menu tile. Each task relaunches the exe
 * with a `--route=…` arg; the single-instance handler in the main entry catches
 * that second launch, focuses the existing window, and deep-links the renderer.
 *
 * No-op on non-Windows platforms (jump lists are a Windows shell feature).
 */
import { app } from 'electron'
import { ROUTE_ARG_PREFIX } from './routes.js'

interface JumpTask {
  title: string
  description: string
  route: string
}

const TASKS: readonly JumpTask[] = [
  { title: 'Start speaking', description: 'Open the AI speaking partner', route: '/speaking' },
  { title: 'Vocabulary review', description: 'Review your due words', route: '/vocabulary' },
  { title: 'Today’s progress', description: 'Open your goals & streak', route: '/progress' }
]

export function setupJumpList(): void {
  if (process.platform !== 'win32') return
  try {
    app.setUserTasks(
      TASKS.map((t) => ({
        program: process.execPath,
        arguments: `${ROUTE_ARG_PREFIX}${t.route}`,
        title: t.title,
        description: t.description,
        iconPath: process.execPath,
        iconIndex: 0
      }))
    )
  } catch (err) {
    console.error('[desktop] failed to set jump list', err)
  }
}

/** Clear the jump list (used on quit / when disabling integration). */
export function clearJumpList(): void {
  if (process.platform !== 'win32') return
  try {
    app.setUserTasks([])
  } catch {
    /* best-effort */
  }
}
