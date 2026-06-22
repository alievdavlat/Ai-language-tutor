import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignIn, SignUp, useUser, ClerkLoaded, ClerkLoading } from '@clerk/clerk-react'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { backend } from '../../services/backend'
import * as auth from '../../services/auth'
import { homeForRole } from '@shared/constants'
import { IconMic } from '../../components/icons'
import { useT } from '../../i18n'

type Mode = 'signin' | 'signup'

// Auth mode is decided at boot by main.tsx (Clerk reachability probe) and
// published on window.__SPEAKAI_AUTH_MODE. 'clerk' → mount Clerk's <SignIn>;
// 'fallback' → real Supabase Auth (email/password + OAuth). We read the runtime
// flag (not just the env) so a Clerk instance that's enabled-but-unreachable
// correctly shows the working fallback instead of a dead Clerk widget.
const authMode: 'clerk' | 'fallback' =
  (typeof window !== 'undefined' &&
    (window as unknown as { __SPEAKAI_AUTH_MODE?: 'clerk' | 'fallback' }).__SPEAKAI_AUTH_MODE) ||
  (import.meta.env.VITE_USE_CLERK === '1' && !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
    ? 'clerk'
    : 'fallback')
const useClerk = authMode === 'clerk'

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
  const t = useT()
  const authenticated = useAppStore((s) => s.authenticated)
  // If Clerk's script never initialises (region-blocked), fall back to the
  // always-visible Supabase form so the user is never stuck on a blank panel.
  const [clerkFailed, setClerkFailed] = useState(false)
  const showClerk = useClerk && !clerkFailed

  useEffect(() => {
    if (!useClerk) return
    const t = setTimeout(() => {
      const w = window as unknown as { Clerk?: { loaded?: boolean } }
      if (!w.Clerk?.loaded) setClerkFailed(true)
    }, 6000)
    return () => clearTimeout(t)
  }, [])

  // Fallback (Supabase) path: wire the auth-state listener once so a real
  // email/password OR OAuth session is mirrored into the store, then route as
  // soon as that lands.
  useEffect(() => {
    auth.initSupabaseAuthListener()
  }, [])
  useEffect(() => {
    if (!showClerk && authenticated) route()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, showClerk])

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
    else navigate(homeForRole(s.role), { replace: true })
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
            <p className="text-xs text-slate-400">{t('auth.brandTagline')}</p>
          </div>
        </div>

        <div className="max-w-md">
          <p className="text-3xl font-black text-white leading-tight">
            {t('auth.heroPre')} <span className="bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">{t('auth.heroHi')}</span>{t('auth.heroPost')}
          </p>
          <p className="text-sm text-slate-300 mt-4">{t('auth.heroSub')}</p>
        </div>

        {/* Honest value props (no fabricated learner/teacher counts). */}
        <div className="grid grid-cols-1 gap-2 max-w-md">
          {[t('auth.vp1'), t('auth.vp2'), t('auth.vp3')].map((line) => (
            <div key={line} className="flex items-center gap-2.5 text-sm text-slate-300">
              <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center text-[11px] shrink-0">✓</span>
              {line}
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
                {m === 'signin' ? t('common.signIn') : t('common.signUp')}
              </button>
            ))}
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white">
            {mode === 'signin' ? t('auth.welcomeBack') : t('auth.createAccount')}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {mode === 'signin' ? t('auth.signinSub') : t('auth.signupSub')}
          </p>

          {/* Real Clerk component when wired. Shown behind ClerkLoaded; while
              Clerk's script initialises we show a spinner, and if it never loads
              (region-blocked) the 6s timeout flips showClerk→false and the
              Supabase form below renders instead. */}
          {showClerk && (
            <div className="mt-6">
              <ClerkLoading>
                <div className="py-12 text-center text-sm text-slate-400">{t('auth.loadingSignin')}</div>
              </ClerkLoading>
              <ClerkLoaded>
                {mode === 'signin' ? (
                  <SignIn routing="virtual" signUpUrl="#" appearance={{ elements: { rootBox: 'w-full', card: 'bg-transparent shadow-none border-0 p-0' } }} />
                ) : (
                  <SignUp routing="virtual" signInUrl="#" appearance={{ elements: { rootBox: 'w-full', card: 'bg-transparent shadow-none border-0 p-0' } }} />
                )}
              </ClerkLoaded>
            </div>
          )}

          {/* Supabase email auth — the primary path. Social OAuth was dropped
              (unreliable in Electron without Clerk); email + password only.
              Shown when Clerk is off OR failed to load. */}
          {!showClerk && (<>
          <div className="mt-6" />
          {/* Email form */}
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => { e.preventDefault(); void submitEmail() }}
          >
            {mode === 'signup' && (
              <input type="text" placeholder={t('auth.fullName')} className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            )}
            <input type="email" placeholder={t('auth.email')} className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            <input type="password" placeholder={t('auth.password')} className="input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} />
            {mode === 'signin' && (
              <button type="button" className="text-[11px] font-semibold text-brand-300 hover:text-brand-200 self-end -mt-1">{t('auth.forgot')}</button>
            )}
            {error && <p className="text-[12px] text-rose-400 font-medium">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary py-2.5 mt-2 disabled:opacity-60">
              {busy ? t('auth.pleaseWait') : mode === 'signin' ? t('common.signIn') : t('auth.createAccountBtn')}
            </button>
          </form>
          </>)}

          <p className="text-[11px] text-slate-500 text-center mt-6">
            {mode === 'signin' ? (
              <>{t('auth.noAccount')} <button onClick={() => setMode('signup')} className="text-brand-300 font-semibold hover:text-brand-200">{t('common.signUp')}</button></>
            ) : (
              <>{t('auth.bySigningUp')} <a className="text-brand-300 hover:text-brand-200">{t('auth.terms')}</a> {t('auth.and')} <a className="text-brand-300 hover:text-brand-200">{t('auth.privacy')}</a>.</>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}
