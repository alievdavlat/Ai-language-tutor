import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AvatarCircle } from '../../components/ui'
import { IconHeart, IconUsers, IconX } from '../../components/icons'

const CHAT = [
  { name: 'Dilnoza', text: 'Hello from Tashkent! 👋' },
  { name: 'Bekzod', text: 'Can you explain "used to" again?' },
  { name: 'Emma Carter', text: 'Sure! Great question Bekzod.', teacher: true },
  { name: 'Madina', text: 'This is so helpful, thank you!' },
  { name: 'Sardor', text: '🔥🔥🔥' }
]

export default function LiveRoomPage(): JSX.Element {
  const navigate = useNavigate()
  const [msg, setMsg] = useState('')

  return (
    <div className="h-full flex flex-col lg:flex-row bg-black">
      {/* Stage */}
      <div className="flex-1 relative flex items-center justify-center bg-gradient-to-br from-slate-900 to-black min-h-[40vh]">
        <div className="text-center">
          <AvatarCircle name="Emma Carter" size="lg" className="!w-24 !h-24 !text-3xl mx-auto" />
          <p className="text-white font-semibold mt-3">Emma Carter</p>
          <p className="text-slate-400 text-sm">Everyday English: Small Talk</p>
        </div>
        <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest bg-rose-600 text-white rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
        </span>
        <span className="absolute top-4 right-4 inline-flex items-center gap-1 text-xs text-white bg-black/50 rounded-full px-3 py-1.5">
          <IconUsers className="w-3.5 h-3.5" /> 342
        </span>
        <button onClick={() => navigate('/live')} className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm px-4 py-2 transition">
          <IconX className="w-4 h-4" /> Leave
        </button>
        {/* floating reactions */}
        <div className="absolute bottom-4 left-4 flex gap-2">
          {['❤️', '🔥', '👏'].map((e) => (
            <button key={e} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-lg transition">{e}</button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <aside className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 lg:border-l border-white/10 bg-canvas-soft/60 flex flex-col">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <IconHeart className="w-4 h-4 text-rose-400" />
          <span className="text-sm font-semibold text-white">Live chat</span>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
          {CHAT.map((c, i) => (
            <div key={i} className="text-sm">
              <span className={c.teacher ? 'text-brand-300 font-semibold' : 'text-slate-400 font-medium'}>{c.name}</span>{' '}
              <span className="text-slate-200">{c.text}</span>
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-white/10">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            placeholder="Say something…"
            className="w-full rounded-pill bg-white/[0.05] border border-white/10 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none"
          />
        </div>
      </aside>
    </div>
  )
}
