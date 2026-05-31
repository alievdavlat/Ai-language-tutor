/**
 * Admin "find duplicates / merge" tool (#A65). Scans user-generated content for
 * duplicate clusters (by content fingerprint, then fuzzy title) and lets an
 * admin merge library items — keep one, delete the rest, and re-point every
 * save/like onto the survivor. Courses are surfaced as read-only warnings (the
 * backend has no destructive course delete; fix those in the course editor).
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Course, LibraryItem } from '@shared/types'
import { backend } from '../../services/backend/useBackend'
import { library } from '../../services/library/store'
import { findClusters, strategyLabel, type DupCluster } from '../../services/dedup'
import { SectionHeading } from '../../components/ui'
import { cn } from '../../lib/classnames'
import { IconBook, IconCheck, IconChevronRight, IconHeadphones, IconYouTube } from '../../components/icons'

const KIND_ICON: Record<LibraryItem['kind'], (p: { className?: string }) => JSX.Element> = {
  book: IconBook,
  video: IconYouTube,
  audio: IconHeadphones
}

export default function DuplicateFinder(): JSX.Element {
  const navigate = useNavigate()
  const [libClusters, setLibClusters] = useState<DupCluster<LibraryItem>[]>([])
  const [courseClusters, setCourseClusters] = useState<DupCluster<Course>[]>([])
  const [keep, setKeep] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [merged, setMerged] = useState(0)

  const refresh = async (): Promise<void> => {
    const lib = library.findDuplicateClusters()
    const courses = await backend.listCourses()
    const cc = findClusters(courses, {
      getId: (c) => c.id,
      getKey: (c) => c.contentHash,
      getTitle: (c) => c.title
    })
    setLibClusters(lib)
    setCourseClusters(cc)
    // Default "keep" = the oldest item in each cluster (most-established).
    setKeep((prev) => {
      const next = { ...prev }
      for (const cl of lib) {
        if (!next[cl.key] || !cl.items.some((i) => i.id === next[cl.key])) {
          const oldest = [...cl.items].sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0]
          next[cl.key] = oldest.id
        }
      }
      return next
    })
  }

  useEffect(() => {
    void refresh()
  }, [])

  const merge = async (cl: DupCluster<LibraryItem>): Promise<void> => {
    const keepId = keep[cl.key] ?? cl.items[0].id
    const dropIds = cl.items.map((i) => i.id).filter((id) => id !== keepId)
    setBusy(cl.key)
    await library.mergeInto(keepId, dropIds)
    setBusy(null)
    setMerged((m) => m + dropIds.length)
    await refresh()
  }

  const totalDupes =
    libClusters.reduce((n, c) => n + (c.items.length - 1), 0) +
    courseClusters.reduce((n, c) => n + (c.items.length - 1), 0)

  return (
    <div className="flex flex-col gap-5">
      <SectionHeading
        title="Duplicate content"
        subtitle={
          totalDupes === 0
            ? 'No duplicates detected across the library or courses. ✨'
            : `${totalDupes} duplicate item${totalDupes === 1 ? '' : 's'} across ${libClusters.length + courseClusters.length} cluster${libClusters.length + courseClusters.length === 1 ? '' : 's'}`
        }
      />

      {merged > 0 && (
        <p className="text-[12px] text-emerald-300 inline-flex items-center gap-1.5">
          <IconCheck className="w-3.5 h-3.5" /> Merged {merged} duplicate{merged === 1 ? '' : 's'} — saves & likes were moved to the kept copy.
        </p>
      )}

      {/* ── Library clusters (mergeable) ─────────────────────────────────── */}
      {libClusters.map((cl) => (
        <div key={cl.key} className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.04] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-200">
              {cl.reason}
            </span>
            <span className="text-[11px] text-slate-400">{cl.items.length} copies — pick the one to keep</span>
          </div>
          <div className="flex flex-col gap-2">
            {cl.items.map((it) => {
              const Icon = KIND_ICON[it.kind]
              const isKeep = (keep[cl.key] ?? cl.items[0].id) === it.id
              return (
                <button
                  key={it.id}
                  onClick={() => setKeep((k) => ({ ...k, [cl.key]: it.id }))}
                  className={cn(
                    'w-full text-left rounded-xl border p-3 flex items-center gap-3 transition',
                    isKeep ? 'border-emerald-400/40 bg-emerald-500/[0.08]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                  )}
                >
                  <span className={cn('w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center', isKeep ? 'border-emerald-400 bg-emerald-400/20' : 'border-white/25')}>
                    {isKeep && <IconCheck className="w-3 h-3 text-emerald-300" />}
                  </span>
                  {it.thumbnailUrl ? (
                    <img src={it.thumbnailUrl} alt="" className="w-12 h-9 rounded-md object-cover ring-1 ring-white/10 shrink-0" />
                  ) : (
                    <span className="w-12 h-9 rounded-md bg-white/[0.06] flex items-center justify-center shrink-0"><Icon className="w-4 h-4 text-slate-400" /></span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{it.title}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {it.author ? `${it.author} · ` : ''}{it.kind} · added {new Date(it.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {isKeep && <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 shrink-0">Keep</span>}
                </button>
              )
            })}
          </div>
          <div className="flex justify-end mt-3">
            <button
              onClick={() => void merge(cl)}
              disabled={busy === cl.key}
              className="rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-100 px-4 py-2 text-xs font-bold disabled:opacity-50"
            >
              {busy === cl.key ? 'Merging…' : `Merge — remove ${cl.items.length - 1} duplicate${cl.items.length - 1 === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      ))}

      {/* ── Course clusters (read-only warning) ──────────────────────────── */}
      {courseClusters.length > 0 && (
        <div>
          <SectionHeading title="Duplicate courses" subtitle="Rename or unpublish in the course editor — courses aren't auto-merged" className="mt-2" />
          <div className="flex flex-col gap-2">
            {courseClusters.map((cl) => (
              <div key={cl.key} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-2">{strategyLabel(cl.key.startsWith('near:') ? '' : cl.key)} · {cl.items.length} copies</p>
                <div className="flex flex-col gap-1.5">
                  {cl.items.map((c) => (
                    <button key={c.id} onClick={() => navigate(`/course/${c.id}`)} className="w-full text-left rounded-lg px-2 py-1.5 hover:bg-white/[0.05] flex items-center gap-2 text-sm text-slate-200">
                      <IconChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{c.title}</span>
                      <span className="text-[10px] text-slate-500 ml-auto shrink-0">{c.publishedAt ? 'Published' : 'Draft'}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalDupes === 0 && (
        <div className="rounded-card border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
          <p className="text-sm text-slate-300 font-semibold">Everything looks unique 🎉</p>
          <p className="text-[12px] text-slate-500 mt-1">Uploads are fingerprinted on the way in, so exact duplicates are blocked before they land here.</p>
        </div>
      )}
    </div>
  )
}
