import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignIn, SignUp, useUser } from '@clerk/clerk-react'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { backend } from '../../services/backend'
import * as auth from '../../services/auth'
import { IconMic } from '../../components/icons'

type Mode = 'signin' | 'signup'

// Detects whether Clerk is actually wired up. When the env flag is off we
// fall back to the original in-app email form (still useful for offline dev).
const useClerk = import.meta.env.VITE_USE_CLERK === '1' && !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

export default function SignInPage({ mode: defaultMode = 'signin' }: { mode?: Mode } = {}): JSX.Element {
  const navigate = useNavigate()
  const setAuthenticated = useAppStore((s) => s.setAuthenticated)
  const setRole = useAppStore((s) => s.setRole)
  const setProfile = useAppStore((s) => s.setProfile)
  const profile = useAppStore((s) => s.profile)
  const [mode, setMode] = useState<Mode>(defaultMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Clerk session sync ─────────────────────────────────────────────────
  // When Clerk reports the user is signed in, mirror that into our local
  // store and (if not already) into the backend.users row.
  const clerk = useClerk ? useUser() : null
  useEffect(() => {
    if (!useClerk || !clerk?.isSignedIn || !clerk.user) return
    const sync = async (): Promise<void> => {
      const email = clerk.user!.primaryEmailAddress?.emailAddress || `${clerk.user!.id}@clerk.local`
      const name = [clerk.user!.firstName, clerk.user!.lastName].filter(Boolean).join(' ') || clerk.user!.username || 'Learner'
      let bUser = await backend.signIn(email).catch(() => null)
      const returning = !!bUser
      if (!bUser) {
        bUser = await backend.signUp({ name, email, role: 'student' }).catch(() => null)
      }
      setAuthenticated(true)
      // Returning users adopt the role the SERVER holds (a teacher/admin who
      // signs in via Clerk lands in their own UI, not the default student view).
      if (returning && bUser?.role) setRole(bUser.role)
      // Patch our app-level profile name + photo from Clerk if missing.
      if (profile && bUser && (!profile.name || (!profile.avatarUrl && clerk.user!.imageUrl))) {
        setProfile({
          ...profile,
          name: profile.name || bUser.name,
          avatarUrl: profile.avatarUrl || clerk.user!.imageUrl || undefined,
          updatedAt: new Date().toISOString()
        })
      }
      route()
    }
    void sync()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerk?.isSignedIn])

  const route = (): void => {
    // Read fresh store state — sign-in may have just adopted a server role via
    // setRole(), and the subscribed closure values above would still be stale.
    const s = useAppStore.getState()
    if (!s.roleSelected) navigate('/role', { replace: true })
    else if (!s.onboardingComplete) navigate('/onboarding', { replace: true })
    else navigate(s.role === 'teacher' ? '/teacher' : '/home', { replace: true })
  }

  // Real local/Supabase-row auth (Clerk is unreachable in this region).
  const submitEmail = async (): Promise<void> => {
    setError(null)
    const trimmed = email.trim()
    if (!trimmed || !/.+@.+\..+/.test(trimmed)) {
      setError('Enter a valid email address.')
      return
    }
    setBusy(true)
    try {
      if (mode === 'signup') {
        await auth.signUp({ name, email: trimmed, password: password || undefined })
      } else {
        const user = await auth.signIn({ email: trimmed, password: password || undefined })
        if (!user) {
          // No account yet — create one so the user isn't stuck.
          await auth.signUp({ name, email: trimmed, password: password || undefined })
        }
      }
      route()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'apple'): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      await auth.quickContinue(provider)
      route()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="h-full w-full flex bg-slate-950 overflow-hidden">
      {/* Left visual */}
      <aside className="hidden lg:flex flex-col justify-between flex-1 p-12 relative bg-[radial-gradient(800px_600px_at_30%_20%,rgba(99,102,241,0.35),transparent_60%),radial-gradient(800px_600px_at_70%_80%,rgba(168,85,247,0.30),transparent_60%)] border-r border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-grad-brand flex items-center justify-center shadow-glow">
            <IconMic className="w-6 h-6 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-xl font-black tracking-tight text-white">SpeakAI</p>
            <p className="text-xs text-slate-400">Your coach</p>
          </div>
        </div>

        <div className="max-w-md">
          <p className="text-3xl font-black text-white leading-tight">
            Learn languages by <span className="bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">speaking</span>, not just studying.
          </p>
          <p className="text-sm text-slate-300 mt-4">AI tutors. Native conversation partners. Real teachers. All in one app.</p>
        </div>

        <div className="grid grid-cols-3 gap-3 max-w-md">
          {[
            { v: '12M', l: 'Learners' },
            { v: '4,800+', l: 'Teachers' },
            { v: '32', l: 'Languages' }
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur p-3 text-center">
              <p className="text-xl font-black text-white">{s.v}</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{s.l}</p>
            </div>
          ))}
        </div>
      </aside>

      {/* Right form */}
      <main className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-grad-brand flex items-center justify-center shadow-glow"><IconMic className="w-5 h-5 text-white" /></div>
            <p className="text-lg font-black text-white">SpeakAI</p>
          </div>

          <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.06] p-1 mb-6">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex-1 rounded-lg py-2 text-sm font-bold transition',
                  mode === m ? 'bg-grad-brand text-white shadow-glow' : 'text-slate-400 hover:text-white'
                )}
              >
                {m === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {mode === 'signin' ? 'Pick up where you left off.' : 'Start learning in 30 seconds — free forever for the basics.'}
          </p>

          {/* Real Clerk component when wired, fallback below */}
          {useClerk && (
            <div className="mt-6">
              {mode === 'signin' ? (
                <SignIn routing="virtual" signUpUrl="#" appearance={{ elements: { rootBox: 'w-full', card: 'bg-transparent shadow-none border-0' } }} />
              ) : (
                <SignUp routing="virtual" signInUrl="#" appearance={{ elements: { rootBox: 'w-full', card: 'bg-transparent shadow-none border-0' } }} />
              )}
            </div>
          )}

          {/* Mock OAuth — shown only when Clerk is disabled */}
          {!useClerk && (<>
          {/* OAuth */}
          <div className="flex flex-col gap-2 mt-6">
            <button disabled={busy} onClick={() => void handleOAuth('google')} className="rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition disabled:opacity-50">
              <span className="w-5 h-5 rounded-full bg-white text-slate-900 text-[10px] font-black flex items-center justify-center">G</span>
              Continue with Google
            </button>
            <button disabled={busy} onClick={() => void handleOAuth('apple')} className="rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition disabled:opacity-50">
              <span className="w-5 h-5 rounded-full bg-white text-slate-900 text-sm flex items-center justify-center"></span>
              Continue with Apple
            </button>
          </div>

          <div className="flex items-center gap-3 my-4">
            <span className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">or email</span>
            <span className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Email form */}
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => { e.preventDefault(); void submitEmail() }}
          >
            {mode === 'signup' && (
              <input type="text" placeholder="Full name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            )}
            <input type="email" placeholder="Email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <input type="password" placeholder="Password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            {mode === 'signin' && (
              <button type="button" className="text-[11px] font-semibold text-brand-300 hover:text-brand-200 self-end -mt-1">Forgot password?</button>
            )}
            {error && <p className="text-[12px] text-rose-400 font-medium">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary py-2.5 mt-2 disabled:opacity-60">
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>
          </>)}

          <p className="text-[11px] text-slate-500 text-center mt-6">
            {mode === 'signin' ? (
              <>Don't have an account? <button onClick={() => setMode('signup')} className="text-brand-300 font-semibold hover:text-brand-200">Sign up</button></>
            ) : (
              <>By signing up you agree to our <a className="text-brand-300 hover:text-brand-200">Terms</a> and <a className="text-brand-300 hover:text-brand-200">Privacy</a>.</>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}
