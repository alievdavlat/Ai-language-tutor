import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { YouTubeVideo } from '@shared/types/studio.types'
import type { Course, TargetLanguage } from '@shared/types'
import { backend } from '../../services/backend/useBackend'
import { studio } from '../../services/studio/store'
import { Spinner } from '../../components/ui'
import LevelSelect from '../../components/ui/LevelSelect'
import { IconCheck, IconX, IconYouTube } from '../../components/icons'

/**
 * Build a real course from imported YouTube videos (#A43 "create a course FROM
 * a playlist"). Each selected video becomes a `video` lesson under one unit; the
 * course is published and the teacher is taken straight to it.
 */
export default function CreateCourseFromPlaylistModal({
  ownerId,
  targetLanguage,
  onClose
}: {
  ownerId: string
  targetLanguage: TargetLanguage
  onClose: () => void
}): JSX.Element {
  const navigate = useNavigate()
  const [videos, setVideos] = useState<YouTubeVideo[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [title, setTitle] = useState('')
  const [level, setLevel] = useState('A2')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void studio.listImportedVideos().then((v) => {
      setVideos(v)
      setSelected(new Set(v.map((x) => x.id))) // default: all selected
    })
  }, [])

  const toggle = (id: string): void => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const create = async (): Promise<void> => {
    if (!videos) return
    const picks = videos.filter((v) => selected.has(v.id))
    if (picks.length === 0 || !title.trim()) return
    setSaving(true)

    const courseId = `c_${Math.random().toString(36).slice(2, 10)}`
    const totalMin = picks.reduce((a, v) => a + Math.round((v.durationSec || 300) / 60), 0)
    const course: Course = {
      id: courseId,
      teacherId: ownerId,
      title: title.trim(),
      description: `A ${picks.length}-video course built from a YouTube playlist.`,
      level,
      targetLanguage,
      cover: 'from-rose-500 to-pink-700',
      thumbnailUrl: picks[0]?.thumbnail,
      pricing: { kind: 'free' },
      rating: 0,
      reviewCount: 0,
      enrollmentCount: 0,
      hours: Math.max(1, Math.round(totalMin / 60)),
      publishedAt: new Date().toISOString()
    }
    await backend.upsertCourse(course)

    const unitId = `u_${Math.random().toString(36).slice(2, 10)}`
    await backend.upsertUnit({ id: unitId, courseId, index: 0, title: 'Lessons', about: 'Imported from your YouTube playlist.' })
    for (let i = 0; i < picks.length; i++) {
      const v = picks[i]
      await backend.upsertLesson({
        id: `l_${Math.random().toString(36).slice(2, 10)}`,
        unitId,
        index: i,
        title: v.title,
        kind: 'video',
        videoUrl: `https://www.youtube.com/watch?v=${v.id}`,
        durationMin: Math.max(1, Math.round((v.durationSec || 300) / 60))
      })
      studio.markVideoImported(v.id)
    }

    setSaving(false)
    onClose()
    navigate(`/course/${courseId}`)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-card border border-white/10 bg-canvas shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-canvas">
          <h2 className="text-base font-bold text-white inline-flex items-center gap-2"><IconYouTube className="w-5 h-5 text-red-500" /> Create course from playlist</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 grid place-items-center text-slate-400"><IconX className="w-4 h-4" /></button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-300">Course title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. English through stories" className="input w-full mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300">Level</label>
            <div className="mt-1"><LevelSelect value={level} onChange={setLevel} /></div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-300 mb-2">Videos {videos && `(${selected.size}/${videos.length} selected)`}</p>
            {videos === null ? (
              <div className="py-8 grid place-items-center"><Spinner /></div>
            ) : videos.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">
                No imported videos yet. Connect your channel and import videos first, then come back.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {videos.map((v) => {
                  const on = selected.has(v.id)
                  return (
                    <button
                      key={v.id}
                      onClick={() => toggle(v.id)}
                      className={`flex gap-3 items-center text-left rounded-xl border p-2 transition ${on ? 'border-brand-400/40 bg-brand-500/[0.08]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04]'}`}
                    >
                      <img src={v.thumbnail} alt="" className="w-20 h-12 rounded-md object-cover shrink-0" />
                      <p className="flex-1 min-w-0 text-sm text-white line-clamp-2">{v.title}</p>
                      <span className={`w-5 h-5 rounded-md grid place-items-center shrink-0 ${on ? 'bg-brand-500 text-white' : 'border border-white/20'}`}>
                        {on && <IconCheck className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10 sticky bottom-0 bg-canvas">
          <button onClick={onClose} className="btn-ghost text-sm px-4 py-2">Cancel</button>
          <button
            onClick={() => void create()}
            disabled={saving || !title.trim() || selected.size === 0 || !videos?.length}
            className="btn-primary text-sm px-5 py-2 disabled:opacity-50"
          >
            {saving ? 'Creating…' : `Create course (${selected.size})`}
          </button>
        </div>
      </div>
    </div>
  )
}
