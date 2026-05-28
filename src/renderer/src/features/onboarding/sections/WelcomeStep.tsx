import { Button, Input } from '../../../components/ui'
import { IconBolt, IconBook, IconMic, IconUsers } from '../../../components/icons'

interface WelcomeStepProps {
  name: string
  onNameChange: (value: string) => void
  onNext: () => void
}

const HIGHLIGHTS = [
  { Icon: IconMic, label: 'AI conversation tutor' },
  { Icon: IconUsers, label: 'Live partners & teachers' },
  { Icon: IconBook, label: 'Real courses with certs' },
  { Icon: IconBolt, label: 'Gamified daily lessons' }
]

export default function WelcomeStep({
  name,
  onNameChange,
  onNext
}: WelcomeStepProps): JSX.Element {
  return (
    <div className="relative overflow-hidden rounded-card border border-white/10 bg-gradient-to-br from-brand-500/10 via-violet-500/10 to-fuchsia-500/10 p-10 sm:p-12">
      {/* Decorative blobs */}
      <span className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-brand-500/30 blur-3xl pointer-events-none" />
      <span className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-violet-500/25 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col items-center text-center">
        {/* Logo mark */}
        <div className="w-20 h-20 rounded-3xl bg-grad-brand flex items-center justify-center shadow-2xl ring-4 ring-brand-400/30 mb-6">
          <IconMic className="w-10 h-10 text-white" />
        </div>

        <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">Welcome</p>
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white mt-2 leading-tight">
          Speak. <span className="bg-gradient-to-r from-brand-300 to-violet-300 bg-clip-text text-transparent">Don't just study.</span>
        </h1>
        <p className="text-slate-300 mt-4 max-w-md">
          A personal English coach in your pocket — AI tutors, real teachers, and conversation partners ready 24/7.
        </p>

        {/* Feature row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 w-full max-w-2xl">
          {HIGHLIGHTS.map((h) => (
            <div key={h.label} className="rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur p-3 flex flex-col items-center gap-2">
              <span className="w-9 h-9 rounded-xl bg-brand-500/20 text-brand-200 flex items-center justify-center"><h.Icon className="w-4 h-4" /></span>
              <span className="text-[11px] font-semibold text-slate-200 text-center leading-tight">{h.label}</span>
            </div>
          ))}
        </div>

        {/* Name input */}
        <div className="w-full max-w-sm mt-8 text-left">
          <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-2">What should we call you?</label>
          <Input
            placeholder="Your name (optional)"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') onNext() }}
          />
        </div>

        <Button onClick={onNext} className="!px-10 !py-3 mt-6 text-base">
          Let's begin →
        </Button>

        <p className="text-[10px] text-slate-500 mt-4">Takes 2 minutes · skip anything you want</p>
      </div>
    </div>
  )
}
