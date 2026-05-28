import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { IconMic } from '../../components/icons'

type Mode = 'signin' | 'signup'

export default function SignInPage({ mode: defaultMode = 'signin' }: { mode?: Mode } = {}): JSX.Element {
  const navigate = useNavigate()
  const setAuthenticated = useAppStore((s) => s.setAuthenticated)
  const roleSelected = useAppStore((s) => s.roleSelected)
  const onboardingComplete = useAppStore((s) => s.onboardingComplete)
  const role = useAppStore((s) => s.role)
  const [mode, setMode] = useState<Mode>(defaultMode)

  const handleAuth = (): void => {
    setAuthenticated(true)
    if (!roleSelected) {
      navigate('/role', { replace: true })
    } else if (!onboardingComplete) {
      navigate('/onboarding', { replace: true })
    } else {
      navigate(role === 'teacher' ? '/teacher' : '/home', { replace: true })
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

          {/* OAuth */}
          <div className="flex flex-col gap-2 mt-6">
            <button onClick={handleAuth} className="rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition">
              <span className="w-5 h-5 rounded-full bg-white text-slate-900 text-[10px] font-black flex items-center justify-center">G</span>
              Continue with Google
            </button>
            <button onClick={handleAuth} className="rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2 transition">
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
          <div className="flex flex-col gap-3">
            {mode === 'signup' && (
              <input type="text" placeholder="Full name" className="input" />
            )}
            <input type="email" placeholder="Email" className="input" />
            <input type="password" placeholder="Password" className="input" />
            {mode === 'signin' && (
              <button className="text-[11px] font-semibold text-brand-300 hover:text-brand-200 self-end -mt-1">Forgot password?</button>
            )}
            <button
              onClick={handleAuth}
              className="btn-primary py-2.5 mt-2"
            >
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </div>

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
