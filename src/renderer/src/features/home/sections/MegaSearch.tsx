import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSearch, IconBook, IconHeadphones, IconPlay, IconYouTube } from '../../../components/icons'
import { AvatarCircle } from '../../../components/ui'
import { backend, useBackendQuery } from '../../../services/backend/useBackend'
import { library } from '../../../services/library/store'
import { useTargetLanguageCode } from '../../../lib/language'

interface Hit { id: string; kind: 'course' | 'book' | 'video' | 'audio' | 'person'; title: string; sub: string; img?: string; go: () => void }

export default function MegaSearch(): JSX.Element {
  const navigate = useNavigate()
  const lang = useTargetLanguageCode()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const courses = useBackendQuery(() => backend.listCourses({ language: lang }), [lang], [])
  const lib = useBackendQuery(() => library.list(undefined, lang), [lang], [])
  const people = useBackendQuery(async () => {
    const ids = ['u_emma', 'u_james', 'u_marco', 'u_priya', 'u_wei', 'u_yui']
    const us = await Promise.all(ids.map((id) => backend.getUser(id)))
    return us.filter((u): u is NonNullable<typeof u> => !!u)
  }, [], [])

  const hits = useMemo<Hit[]>(() => {
    const n = q.trim().toLowerCase()
    if (!n) return []
    const out: Hit[] = []
    for (const c of courses.data) {
      if (c.title.toLowerCase().includes(n)) out.push({ id: `c_${c.id}`, kind: 'course', title: c.title, sub: `Course · ${c.level}`, img: c.thumbnailUrl, go: () => navigate(`/course/${c.id}`) })
    }
    for (const it of lib.data) {
      if (it.title.toLowerCase().includes(n) || (it.author ?? '').toLowerCase().includes(n)) {
        out.push({ id: `l_${it.id}`, kind: it.kind, title: it.title, sub: it.kind === 'book' ? 'Book' : it.kind === 'video' ? 'Video' : 'Audio', img: it.thumbnailUrl, go: () => navigate(it.kind === 'book' ? `/library/book/${it.id}` : '/library') })
      }
    }
    for (const u of people.data) {
      if (u.name.toLowerCase().includes(n)) out.push({ id: `u_${u.id}`, kind: 'person', title: u.name, sub: u.role === 'teacher' ? 'Teacher' : 'Learner', img: (u as { avatarUrl?: string }).avatarUrl, go: () => navigate(`/channel?id=${u.id}`) })
    }
    return out.slice(0, 7)
  }, [q, courses.data, lib.data, people.data, navigate])

  const submit = (e: React.FormEvent): void => {
    e.preventDefault()
    const query = q.trim()
    setOpen(false)
    navigate(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore')
  }

  const KindIcon = ({ k }: { k: Hit['kind'] }): JSX.Element => {
    if (k === 'book') return <IconBook className="w-4 h-4 text-rose-300" />
    if (k === 'audio') return <IconHeadphones className="w-4 h-4 text-brand-300" />
    if (k === 'video') return <IconYouTube className="w-4 h-4 text-red-400" />
    return <IconPlay className="w-4 h-4 text-sky-300" />
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-md">
      <IconSearch className="absolute left-3.5 top-[1.15rem] -translate-y-1/2 w-4 h-4 text-slate-500 z-10" />
      <input
        type="text"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search courses, books, teachers…"
        className="w-full rounded-pill bg-white/[0.05] border border-white/10 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:bg-white/[0.07] focus:outline-none transition"
      />
      {open && q.trim() && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/98 backdrop-blur shadow-2xl overflow-hidden">
          {hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">No matches. Press Enter to search everything.</p>
          ) : (
            hits.map((h) => (
              <button key={h.id} type="button" onMouseDown={() => { h.go(); setOpen(false) }} className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.06] transition">
                {h.kind === 'person'
                  ? <AvatarCircle name={h.title} src={h.img} size="sm" />
                  : h.img
                    ? <img src={h.img} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    : <span className="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0"><KindIcon k={h.kind} /></span>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{h.title}</p>
                  <p className="text-[11px] text-slate-400">{h.sub}</p>
                </div>
              </button>
            ))
          )}
          <button type="submit" className="w-full text-center px-4 py-2 text-xs font-semibold text-brand-300 hover:bg-white/[0.04] border-t border-white/[0.06]">
            See all results for “{q.trim()}” →
          </button>
        </div>
      )}
    </form>
  )
}
