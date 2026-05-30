import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconSearch } from '../../../components/icons'

export default function MegaSearch(): JSX.Element {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const submit = (e: React.FormEvent): void => {
    e.preventDefault()
    const query = q.trim()
    navigate(query ? `/explore?q=${encodeURIComponent(query)}` : '/explore')
  }

  return (
    <form onSubmit={submit} className="relative w-full max-w-md">
      <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search courses, books, teachers…"
        className="w-full rounded-pill bg-white/[0.05] border border-white/10 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:bg-white/[0.07] focus:outline-none transition"
      />
    </form>
  )
}
