import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { useT } from '../../i18n'
import type { StringKey } from '../../i18n/strings'
import { AvatarCircle, ListRow, Tabs, type TabItem } from '../../components/ui'
import { IconBook, IconDownload, IconPencil, IconPlay, IconPlus, IconStar, IconVolume, IconX, IconYouTube } from '../../components/icons'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { uploadUrl, uploadAndRecord } from '../../services/backend'
import { studio } from '../../services/studio/store'
import CreateCourseFromPlaylistModal from './CreateCourseFromPlaylistModal'

type Tab = 'courses' | 'videos' | 'books' | 'podcasts' | 'about'

const TABS: TabItem<Tab>[] = [
  { id: 'courses', label: 'Courses' },
  { id: 'videos', label: 'Videos' },
  { id: 'books', label: 'Books' },
  { id: 'podcasts', label: 'Podcasts' },
  { id: 'about', label: 'About' }
]

const COVERS = ['from-sky-500 to-blue-700', 'from-emerald-500 to-teal-700', 'from-violet-500 to-purple-700', 'from-amber-500 to-orange-700', 'from-rose-500 to-pink-700', 'from-indigo-500 to-blue-800']
const coverFor = (seed: string): string => COVERS[Math.abs([...seed].reduce((a, c) => a + c.charCodeAt(0), 0)) % COVERS.length]

/** Owner-only upload tile shown at the top of a media grid/list. */
function UploadTile({ label, accept, onFile, busy }: { label: string; accept: string; onFile: (f: File) => void; busy: boolean }): JSX.Element {
  const t = useT()
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <input ref={input} type="file" accept={accept} className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
      <button
        onClick={() => input.current?.click()}
        disabled={busy}
        className="rounded-2xl border border-dashed border-white/20 bg-white/[0.02] hover:bg-white/[0.05] hover:border-brand-400/40 transition flex flex-col items-center justify-center gap-2 text-slate-300 disabled:opacity-50 py-6 min-h-[7rem]"
      >
        <span className="w-9 h-9 rounded-full bg-brand-500/15 text-brand-300 grid place-items-center"><IconPlus className="w-4 h-4" /></span>
        <span className="text-xs font-semibold">{busy ? 'Uploading…' : label}</span>
      </button>
    </>
  )
}

export default function TeacherChannelPage(): JSX.Element {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [tab, setTab] = useState<Tab>('courses')
  const [following, setFollowing] = useState(false)
  const me = backend.currentUserId()
  // Channel owner comes from ?id= (Explore "View" links pass it); with no id this
  // is the viewer's OWN channel ("My channel"), falling back to a seed only when
  // signed out.
  const channelOwnerId = params.get('id') || me || 'u_emma'
  const isOwner = !!me && me === channelOwnerId

  const owner = useBackendQuery(() => backend.getUser(channelOwnerId), [channelOwnerId], null)
  const courses = useBackendQuery(() => backend.myCourses(channelOwnerId), [channelOwnerId], [])
  const lessons = useBackendQuery(() => studio.listLessons(channelOwnerId), [channelOwnerId], [])
  const books = useBackendQuery(() => backend.listMedia(channelOwnerId, 'pdf'), [channelOwnerId], [])
  const podcasts = useBackendQuery(() => backend.listMedia(channelOwnerId, 'audio'), [channelOwnerId], [])
  const videoMedia = useBackendQuery(() => backend.listMedia(channelOwnerId, 'video'), [channelOwnerId], [])
  const followerCount = useBackendQuery(() => backend.followCounts(channelOwnerId).then((c) => c.followers), [channelOwnerId], 0)

  // Owner edit state
  const [bannerBusy, setBannerBusy] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [mediaBusy, setMediaBusy] = useState(false)
  const [editingAbout, setEditingAbout] = useState(false)
  const [aboutDraft, setAboutDraft] = useState('')
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const bannerInput = useRef<HTMLInputElement>(null)
  const avatarInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!me || isOwner) return
    void backend.isFollowing(me, channelOwnerId).then(setFollowing)
  }, [me, channelOwnerId, isOwner])

  const toggleFollow = async (): Promise<void> => {
    if (!me || isOwner) return
    const res = await backend.follow(me, channelOwnerId)
    setFollowing(res.following)
    followerCount.refresh()
  }

  const ownerData = owner.data
  const isTeacher = ownerData?.role === 'teacher'
  const showChannel = isTeacher || isOwner // owners always get the manager; visitors see teacher channels
  const name = ownerData?.name ?? (isTeacher ? 'Teacher' : 'Learner')
  const handle = '@' + name.toLowerCase().replace(/[^a-z]+/g, '')
  const bio = ownerData?.bio ?? (isTeacher ? 'Language teacher on SpeakAI.' : 'Language learner on SpeakAI.')
  const avgRating = courses.data.length
    ? (courses.data.reduce((a, c) => a + c.rating, 0) / courses.data.length).toFixed(1)
    : '—'

  // ── Owner actions ──────────────────────────────────────────────────────────
  const uploadBanner = async (file?: File): Promise<void> => {
    if (!file || !isOwner) return
    setBannerBusy(true)
    try {
      const url = await uploadUrl(file, 'covers')
      await backend.updateUser(channelOwnerId, { bannerUrl: url })
      owner.refresh()
    } catch { /* too large in local mode */ }
    setBannerBusy(false)
  }
  const uploadAvatar = async (file?: File): Promise<void> => {
    if (!file || !isOwner) return
    setAvatarBusy(true)
    try {
      const url = await uploadUrl(file, 'avatars')
      await backend.updateUser(channelOwnerId, { avatarUrl: url })
      owner.refresh()
    } catch { /* ignore */ }
    setAvatarBusy(false)
  }
  const saveAbout = async (): Promise<void> => {
    if (!isOwner) return
    await backend.updateUser(channelOwnerId, { bio: aboutDraft.trim() })
    setEditingAbout(false)
    owner.refresh()
  }
  const uploadMedia = async (file: File, refresh: () => void): Promise<void> => {
    if (!isOwner) return
    setMediaBusy(true)
    try {
      await uploadAndRecord(file, channelOwnerId)
      refresh()
    } catch { /* too large in local mode */ }
    setMediaBusy(false)
  }
  const deleteMedia = async (id: string, refresh: () => void): Promise<void> => {
    await backend.deleteMedia(id)
    refresh()
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Banner */}
      <div className={cn('relative h-44 group', !ownerData?.bannerUrl && 'bg-gradient-to-r from-brand-700 via-indigo-700 to-slate-900')}>
        {ownerData?.bannerUrl && <img src={ownerData.bannerUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />}
        <div aria-hidden className="absolute -top-10 right-10 w-60 h-60 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        {isOwner && (
          <>
            <input ref={bannerInput} type="file" accept="image/*" className="hidden" onChange={(e) => { void uploadBanner(e.target.files?.[0]); e.target.value = '' }} />
            <button
              onClick={() => bannerInput.current?.click()}
              disabled={bannerBusy}
              className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 backdrop-blur text-white text-xs font-semibold px-3 py-1.5 hover:bg-black/75 transition disabled:opacity-60"
            >
              <IconPencil className="w-3.5 h-3.5" /> {bannerBusy ? 'Uploading…' : 'Edit banner'}
            </button>
          </>
        )}
      </div>

      <div className="px-6 w-full">
        {/* Header */}
        <div className="flex items-end gap-4 -mt-10">
          <div className="ring-4 ring-canvas rounded-full relative group/avatar">
            <AvatarCircle name={name} src={ownerData?.avatarUrl} size="lg" className="!w-20 !h-20 !text-2xl" />
            {isOwner && (
              <>
                <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => { void uploadAvatar(e.target.files?.[0]); e.target.value = '' }} />
                <button
                  onClick={() => avatarInput.current?.click()}
                  disabled={avatarBusy}
                  title="Change photo"
                  className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover/avatar:opacity-100 transition grid place-items-center text-white disabled:opacity-100"
                >
                  <IconPencil className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl font-bold tracking-tight">{name}{isOwner && <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wider rounded-full bg-white/10 text-slate-300 px-2 py-0.5">Your channel</span>}</h1>
            <p className="text-sm text-slate-400">
              {isTeacher
                ? `${handle} · ${followerCount.data.toLocaleString()} followers · ${courses.data.length} courses · ${lessons.data.length} videos`
                : `Learner${ownerData?.country ? ` · ${ownerData.country}` : ''} · Level ${ownerData?.level ?? 'A2'} · ${followerCount.data.toLocaleString()} followers`}
            </p>
          </div>
          {!isOwner ? (
            <button
              onClick={() => void toggleFollow()}
              className={cn(
                'rounded-full px-6 py-2.5 text-sm font-semibold transition shrink-0',
                following ? 'bg-white/[0.08] text-slate-200 border border-white/15' : 'bg-grad-brand text-white shadow-glow-sm'
              )}
            >
              {following ? 'Following ✓' : 'Follow'}
            </button>
          ) : (
            <button onClick={() => navigate('/teacher/youtube')} className="rounded-full px-4 py-2.5 text-sm font-semibold transition shrink-0 inline-flex items-center gap-2 bg-white/[0.06] border border-white/15 text-slate-200 hover:bg-white/[0.1]">
              <IconYouTube className="w-4 h-4 text-red-500" /> YouTube
            </button>
          )}
        </div>

        {showChannel ? (<>
        {/* Tabs */}
        <div className="mt-5 border-b border-white/10">
          <Tabs items={TABS} active={tab} onChange={setTab} className="!bg-transparent !border-0 !p-0 !gap-1" />
        </div>

        <div className="py-6">
          {tab === 'courses' && (<>
            {isOwner && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => navigate('/teacher/course/new')} className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"><IconPlus className="w-3.5 h-3.5" /> New course</button>
                <button onClick={() => setShowPlaylistModal(true)} className="btn-ghost text-xs px-4 py-2 inline-flex items-center gap-1.5"><IconYouTube className="w-3.5 h-3.5 text-red-500" /> From a YouTube playlist</button>
              </div>
            )}
            {courses.data.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">{isOwner ? 'No courses yet — create your first above.' : 'No published courses yet.'}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {courses.data.map((c) => (
                  <button key={c.id} onClick={() => navigate(`/course/${c.id}`)} className="text-left">
                    {c.thumbnailUrl
                      ? <img src={c.thumbnailUrl} alt="" className="rounded-2xl h-28 w-full object-cover ring-1 ring-white/10" />
                      : <div className={cn('rounded-2xl bg-gradient-to-br h-28 ring-1 ring-white/10', c.cover || coverFor(c.title))} />}
                    <p className="text-sm font-semibold text-white mt-2 truncate">{c.title}</p>
                    <p className="text-xs text-slate-400">{c.level}{c.reviewCount > 0 && <> · <span className="text-amber-300">★ {c.rating}</span></>}{!c.publishedAt && <span className="text-slate-500"> · Draft</span>}</p>
                  </button>
                ))}
              </div>
            )}
          </>)}

          {tab === 'videos' && (<>
            {isOwner && (
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => navigate('/teacher/youtube')} className="btn-ghost text-xs px-4 py-2 inline-flex items-center gap-1.5"><IconYouTube className="w-3.5 h-3.5 text-red-500" /> Import from YouTube</button>
                <button onClick={() => navigate('/teacher/new')} className="btn-ghost text-xs px-4 py-2 inline-flex items-center gap-1.5"><IconPlus className="w-3.5 h-3.5" /> New video lesson</button>
              </div>
            )}
            {lessons.data.length === 0 && videoMedia.data.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">{isOwner ? 'No videos yet — import from YouTube or build a lesson.' : 'No interactive video lessons yet.'}</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {isOwner && (
                  <UploadTile label="Upload video" accept="video/*" busy={mediaBusy} onFile={(f) => void uploadMedia(f, videoMedia.refresh)} />
                )}
                {lessons.data.map((v) => (
                  <button key={v.id} onClick={() => navigate(v.shareId ? `/lesson?id=${v.shareId}` : '/library')} className="text-left group">
                    <div className={cn('relative rounded-2xl bg-gradient-to-br h-32 flex items-center justify-center ring-1 ring-white/10', coverFor(v.title))}>
                      <span className="w-11 h-11 rounded-full bg-white/25 backdrop-blur flex items-center justify-center group-hover:scale-110 transition">
                        <IconPlay className="w-4 h-4 text-white ml-0.5" />
                      </span>
                      {v.video && <span className="absolute top-2 left-2"><IconYouTube className="w-5 h-5 text-red-500" /></span>}
                      <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/60 text-white rounded px-1.5 py-0.5">{v.level}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-2 truncate">{v.title}</p>
                    <p className="text-[11px] text-slate-400">{v.views.toLocaleString()} views</p>
                  </button>
                ))}
                {videoMedia.data.map((m) => (
                  <div key={m.id} className="text-left group relative">
                    <video src={m.url} controls className="rounded-2xl h-32 w-full object-cover ring-1 ring-white/10 bg-black" />
                    <p className="text-sm font-semibold text-white mt-2 truncate">{m.name}</p>
                    {isOwner && <button onClick={() => void deleteMedia(m.id, videoMedia.refresh)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition"><IconX className="w-3.5 h-3.5" /></button>}
                  </div>
                ))}
              </div>
            )}
          </>)}

          {tab === 'books' && (<>
            {isOwner && (
              <div className="mb-3"><UploadTile label="Upload a PDF book" accept="application/pdf,.pdf" busy={mediaBusy} onFile={(f) => void uploadMedia(f, books.refresh)} /></div>
            )}
            {books.data.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">{isOwner ? 'No books yet — upload a PDF above.' : 'No downloadable resources yet.'}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {books.data.map((b) => (
                  <ListRow
                    key={b.id}
                    leading={<span className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-300 flex items-center justify-center"><IconBook className="w-5 h-5" /></span>}
                    title={b.name}
                    subtitle={`PDF · ${(b.sizeBytes / 1024 / 1024).toFixed(1)} MB`}
                    trailing={<div className="flex items-center gap-1">
                      <a href={b.url} download className="w-9 h-9 rounded-full bg-white/[0.06] text-slate-300 hover:text-white flex items-center justify-center"><IconDownload className="w-[18px] h-[18px]" /></a>
                      {isOwner && <button onClick={() => void deleteMedia(b.id, books.refresh)} className="w-9 h-9 rounded-full bg-white/[0.06] text-slate-400 hover:text-red-300 flex items-center justify-center"><IconX className="w-4 h-4" /></button>}
                    </div>}
                  />
                ))}
              </div>
            )}
          </>)}

          {tab === 'podcasts' && (<>
            {isOwner && (
              <div className="mb-3"><UploadTile label="Upload audio episode" accept="audio/*" busy={mediaBusy} onFile={(f) => void uploadMedia(f, podcasts.refresh)} /></div>
            )}
            {podcasts.data.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">{isOwner ? 'No episodes yet — upload audio above.' : 'No audio episodes yet.'}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {podcasts.data.map((p) => (
                  <ListRow
                    key={p.id}
                    leading={<span className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center"><IconVolume className="w-5 h-5" /></span>}
                    title={p.name}
                    subtitle="Audio"
                    trailing={<div className="flex items-center gap-1">
                      <a href={p.url} className="w-9 h-9 rounded-full bg-brand-500/15 text-brand-300 flex items-center justify-center"><IconPlay className="w-[18px] h-[18px]" /></a>
                      {isOwner && <button onClick={() => void deleteMedia(p.id, podcasts.refresh)} className="w-9 h-9 rounded-full bg-white/[0.06] text-slate-400 hover:text-red-300 flex items-center justify-center"><IconX className="w-4 h-4" /></button>}
                    </div>}
                  />
                ))}
              </div>
            )}
          </>)}

          {tab === 'about' && (
            <div className="max-w-xl">
              {editingAbout ? (
                <div>
                  <textarea
                    value={aboutDraft}
                    onChange={(e) => setAboutDraft(e.target.value)}
                    rows={4}
                    placeholder="Tell learners about your channel…"
                    className="input w-full resize-y"
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => void saveAbout()} className="btn-primary text-xs px-4 py-2">Save</button>
                    <button onClick={() => setEditingAbout(false)} className="btn-ghost text-xs px-4 py-2">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <p className="text-sm text-slate-300 leading-relaxed flex-1">{bio}</p>
                  {isOwner && (
                    <button onClick={() => { setAboutDraft(ownerData?.bio ?? ''); setEditingAbout(true) }} className="btn-ghost text-xs px-3 py-1.5 inline-flex items-center gap-1.5 shrink-0"><IconPencil className="w-3.5 h-3.5" /> Edit</button>
                  )}
                </div>
              )}
              {courses.data.length > 0 && (
                <div className="flex items-center gap-2 mt-4 text-xs text-amber-300">
                  <IconStar className="w-4 h-4" /> {avgRating} average rating across {courses.data.length} courses
                </div>
              )}
            </div>
          )}
        </div>
        </>) : (
          /* Learner profile (visitor viewing another learner) */
          <div className="mt-6 max-w-xl">
            <p className="text-sm text-slate-300 leading-relaxed">{bio}</p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="text-xl font-black text-white">{ownerData?.level ?? 'A2'}</p>
                <p className="text-[11px] text-slate-400">Level</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="text-xl font-black text-white">{followerCount.data}</p>
                <p className="text-[11px] text-slate-400">Followers</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="text-xl font-black text-white">{ownerData?.country ?? '—'}</p>
                <p className="text-[11px] text-slate-400">Country</p>
              </div>
            </div>
            <button onClick={() => navigate('/meet')} className="btn-ghost px-4 py-2 text-sm mt-4">Practice together →</button>
          </div>
        )}
      </div>

      {showPlaylistModal && (
        <CreateCourseFromPlaylistModal
          ownerId={channelOwnerId}
          targetLanguage={ownerData?.targetLanguage ?? 'en'}
          onClose={() => { setShowPlaylistModal(false); courses.refresh() }}
        />
      )}
    </div>
  )
}
