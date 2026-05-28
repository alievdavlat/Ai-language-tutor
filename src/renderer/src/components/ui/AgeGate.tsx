import { useState, type ReactNode } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { bandFromDob, computeAge } from '../../lib/age'
import { Card, Button } from './index'

interface AgeGateProps {
  /** What is being gated, used in copy ("companions", "AI tutor", etc). */
  featureName?: string
  /** Minimum age band required to render `children`. */
  required?: 'teen' | 'adult'
  /** Renders this in the gated branch when the user is too young, instead of just hiding. */
  fallback?: ReactNode
  children: ReactNode
}

/**
 * Asks the user for date-of-birth once, stores it in their profile, and gates
 * any age-restricted feature behind it. COPPA-compliant 3-band model:
 *   - `under13`  →  blocked, sees a friendly "kids version" prompt
 *   - `teen`     →  passes through `required="teen"`, blocked from `required="adult"`
 *   - `adult`    →  passes through both
 *
 * We never display the raw DOB back to the user. The component reads from the
 * profile already in the store and persists via `window.api.profile.save`.
 */
export default function AgeGate({ featureName = 'this feature', required = 'teen', fallback, children }: AgeGateProps): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)
  const band = bandFromDob(profile?.dateOfBirth)
  const [dob, setDob] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  if (band === 'adult') return <>{children}</>
  if (band === 'teen' && required === 'teen') return <>{children}</>

  // Blocked.
  if (band === 'under13' || (band === 'teen' && required === 'adult')) {
    return (
      <div className="h-full w-full flex items-center justify-center p-8 bg-slate-950">
        <Card className="max-w-md">
          <div className="text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center text-2xl">🛡️</div>
            <h2 className="font-black text-lg text-white">Reserved for older learners</h2>
            <p className="text-sm text-slate-400">
              {featureName} is available to learners {required === 'adult' ? '18 and over' : '13 and over'}.
              We'll get you set up with a kid-friendly experience instead.
            </p>
            {fallback}
          </div>
        </Card>
      </div>
    )
  }

  // Not yet provided — ask.
  const save = async (): Promise<void> => {
    if (!profile) return
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
      setError('Use the format YYYY-MM-DD.')
      return
    }
    const age = computeAge(dob)
    if (age < 1 || age > 120) {
      setError('Please double-check the date.')
      return
    }
    setSaving(true)
    setError(null)
    const next = { ...profile, dateOfBirth: dob, updatedAt: new Date().toISOString() }
    await window.api.profile.save(next)
    setProfile(next)
    setSaving(false)
  }

  return (
    <div className="h-full w-full flex items-center justify-center p-8 bg-slate-950">
      <Card className="max-w-md">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-black text-lg text-white">Quick age check</h2>
            <p className="text-sm text-slate-400 mt-1">
              Before showing {featureName}, we need to know your age band. We never share this and never show it back.
            </p>
          </div>
          <label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Date of birth</label>
          <input
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
            className="input"
            max={new Date().toISOString().slice(0, 10)}
            min="1900-01-01"
          />
          {error && <p className="text-xs text-rose-300">{error}</p>}
          <Button onClick={() => void save()} disabled={saving || !dob}>
            {saving ? 'Saving…' : 'Continue'}
          </Button>
          <p className="text-[10px] text-slate-500">
            By continuing you confirm the date is accurate. Required by law to keep younger learners safe online.
          </p>
        </div>
      </Card>
    </div>
  )
}
