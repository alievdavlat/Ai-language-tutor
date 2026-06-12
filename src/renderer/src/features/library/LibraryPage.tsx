import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LibraryItem } from '@shared/types'
import { cn } from '../../lib/classnames'
import { Tabs, type TabItem } from '../../components/ui'
import { useTargetLanguage } from '../../lib/language'
import { IconBook, IconBookmark, IconHeadphones, IconHeart, IconPlay, IconPlus, IconVolume, IconX, IconYouTube } from '../../components/icons'
import { useBackendQuery } from '../../services/backend/useBackend'
import { library } from '../../services/library/store'
import { isImageCover } from '../../lib/cover'
import LibraryUploadModal from './LibraryUploadModal'
import { useT } from '../../i18n'

type Tab = 'videos' | 'books' | 'audio'

const LEVEL_TONE: Record<string, string> = {
  A1: 'bg-teal-500/80', A2: 'bg-emerald-500/80', B1: 'bg-amber-500/80', B2: 'bg-rose-500/80', C1: 'bg-violet-500/80', C2: 'bg-fuchsia-500/80'
}

function SaveLike({ id }: { id: string }): JSX.Element {
  const [saved, setSaved] = useState(library.isSaved(id))
  const [liked, setLiked] = useState(library.isLiked(id))
  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <button onClick={async () => setLiked(await library.toggleLike(id))} className={cn('w-7 h-7 rounded-full flex items-center justify-center transition', liked ? 'bg-rose-500/20 text-rose-300' : 'bg-black/40 text-white/80 hover:text-white')} title="Like"><IconHeart className="w-3.5 h-3.5" /></button>
      <button onClick={async () => setSaved(await library.toggleSave(id))} className={cn('w-7 h-7 rounded-full flex items-center justify-center transition', saved ? 'bg-brand-500/25 text-brand-200' : 'bg-black/40 text-white/80 hover:text-white')} title="Save"><IconBookmark className="w-3.5 h-3.5" /></button>
    </div>
  )
}

export default function LibraryPage(): JSX.Element {
  const navigate = useNavigate()
  const t = useT()
  const TABS: TabItem<Tab>[] = [
    { id: 'videos', label: t('library.videos') },
    { id: 'books', label: t('library.books') },
    { id: 'audio', label: t('library.listen') }
  ]
  const [tab, setTab] = useState<Tab>('videos')
  const [adding, setAdding] = useState(false)
  const [video, setVideo] = useState<LibraryItem | null>(null)
  const [track, setTrack] = useState<LibraryItem | null>(null)
  const lang = useTargetLanguage()

  const items = useBackendQuery(() => library.list(undefined, lang.code), [lang.code], [])
  const videos = items.data.filter((i) => i.kind === 'video')
  const books = items.data.filter((i) => i.kind === 'book')
  const audios = items.data.filter((i) => i.kind === 'audio')

  return (
    <div className="h-full overflow-y-auto pb-28">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">{lang.flag} {lang.name}</p>
            <h1 className="text-2xl font-bold tracking-tight mt-0.5">{t('library.title')}</h1>
            <p className="text-sm text-slate-400 mt-1">{t('library.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => navigate('/stories')} className="btn-ghost px-4 py-2 text-sm inline-flex items-center gap-1.5">📖 {t('library.stories')}</button>
            <button onClick={() => setAdding(true)} className="btn-primary px-4 py-2 text-sm inline-flex items-center gap-1.5"><IconPlus className="w-4 h-4" /> {t('library.add')}</button>
          </div>
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {/* VIDEOS */}
        {tab === 'videos' && (
          videos.length === 0 ? <Empty kind="videos" onAdd={() => setAdding(true)} /> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {videos.map((v) => (
                <div key={v.id} onClick={() => setVideo(v)} role="button" tabIndex={0} className="text-left group cursor-pointer">
                  <div className="relative rounded-2xl h-32 overflow-hidden ring-1 ring-white/10">
                    {isImageCover(v.thumbnailUrl) ? <img src={v.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-rose-500 to-pink-700" />}
                    <span className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition flex items-center justify-center">
                      <span className="w-12 h-12 rounded-full bg-white/25 backdrop-blur flex items-center justify-center group-hover:scale-110 transition"><IconPlay className="w-5 h-5 text-white ml-0.5" /></span>
                    </span>
                    {v.level && <span className={cn('absolute top-2 left-2 text-[10px] font-bold text-white rounded px-1.5 py-0.5', LEVEL_TONE[v.level] ?? 'bg-slate-600')}>{v.level}</span>}
                    <span className="absolute top-2 right-2"><SaveLike id={v.id} /></span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-2 leading-tight line-clamp-2">{v.title}</p>
                  {v.author && <p className="text-xs text-slate-400">{v.author}</p>}
                </div>
              ))}
            </div>
          )
        )}

        {/* BOOKS */}
        {tab === 'books' && (
          books.length === 0 ? <Empty kind="books" onAdd={() => setAdding(true)} /> : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {books.map((b) => (
                <div key={b.id} onClick={() => navigate(`/library/book/${b.id}`)} role="button" tabIndex={0} className="text-left group cursor-pointer">
                  <div className="relative rounded-2xl h-40 overflow-hidden ring-1 ring-white/10">
                    {isImageCover(b.thumbnailUrl) ? <img src={b.thumbnailUrl} alt="" className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full bg-gradient-to-br from-sky-600 to-blue-800 flex items-center justify-center"><IconBook className="w-10 h-10 text-white/60" /></div>
                    )}
                    <div aria-hidden className="absolute left-3 top-0 bottom-0 w-px bg-white/20" />
                    {b.level && <span className={cn('absolute top-2 left-4 text-[10px] font-bold text-white rounded px-1.5 py-0.5', LEVEL_TONE[b.level] ?? 'bg-slate-600')}>{b.level}</span>}
                    <span className="absolute top-2 right-2"><SaveLike id={b.id} /></span>
                    <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center gap-2">
                      {b.fullAudioUrl && <IconHeadphones className="w-3.5 h-3.5 text-brand-300" />}
                      <span className="text-[10px] text-white/70">PDF{b.fullAudioUrl ? ' · audio' : ''}{b.fullVideoUrl ? ' · video' : ''}</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white mt-2 leading-tight line-clamp-2">{b.title}</p>
                  {b.author && <p className="text-xs text-slate-400">{b.author}</p>}
                </div>
              ))}
            </div>
          )
        )}

        {/* AUDIO / LISTEN */}
        {tab === 'audio' && (
          audios.length === 0 ? <Empty kind="audio" onAdd={() => setAdding(true)} /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {audios.map((a) => (
                <div key={a.id} onClick={() => setTrack(a)} role="button" tabIndex={0} className={cn('flex items-center gap-3 rounded-2xl border p-3 text-left transition cursor-pointer', track?.id === a.id ? 'border-brand-400/40 bg-brand-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]')}>
                  {isImageCover(a.thumbnailUrl)
                    ? <img src={a.thumbnailUrl} alt="" className="w-14 h-14 rounded-xl object-cover ring-1 ring-white/10 shrink-0" />
                    : <span className="w-14 h-14 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0"><IconHeadphones className="w-6 h-6" /></span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{a.title}</p>
                    <p className="text-xs text-slate-400 truncate">{a.author ?? 'Audio'}{a.durationLabel ? ` · ${a.durationLabel}` : ''}</p>
                  </div>
                  <span className="w-9 h-9 rounded-full bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0"><IconPlay className="w-[18px] h-[18px]" /></span>
                  <span onClick={(e) => e.stopPropagation()}><SaveLike id={a.id} /></span>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Video modal */}
      {video && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setVideo(null)}>
          <div className="w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-white">{video.title}</p>
              <button onClick={() => setVideo(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"><IconX className="w-5 h-5" /></button>
            </div>
            <div className="rounded-2xl overflow-hidden ring-1 ring-white/10 bg-black aspect-video">
              {video.youtubeId
                ? <iframe title={video.title} src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                : <video src={video.videoUrl} controls autoPlay className="w-full h-full" />}
            </div>
          </div>
        </div>
      )}

      {/* Spotify-style bottom audio player */}
      {track && <AudioBar track={track} onClose={() => setTrack(null)} />}

      {adding && <LibraryUploadModal language={lang.code} onClose={() => setAdding(false)} onSaved={(item) => { items.refresh(); if (item.kind === 'book') navigate(`/library/book/${item.id}`) }} />}
    </div>
  )
}

function Empty({ kind, onAdd }: { kind: Tab; onAdd: () => void }): JSX.Element {
  const t = useT()
  const emptyText = kind === 'videos' ? t('library.noVideos') : kind === 'books' ? t('library.noBooks') : t('library.noAudio')
  const addText = kind === 'videos' ? t('library.addVideo') : kind === 'books' ? t('library.addBook') : t('library.addAudio')
  return (
    <div className="rounded-card border border-dashed border-white/15 bg-white/[0.02] p-10 text-center">
      <p className="text-sm text-slate-400">{emptyText}</p>
      <button onClick={onAdd} className="btn-primary px-4 py-2 text-sm mt-3 inline-flex items-center gap-1.5"><IconPlus className="w-4 h-4" /> {addText}</button>
    </div>
  )
}

function AudioBar({ track, onClose }: { track: LibraryItem; onClose: () => void }): JSX.Element {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-900/95 backdrop-blur px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        {isImageCover(track.thumbnailUrl)
          ? <img src={track.thumbnailUrl} alt="" className="w-12 h-12 rounded-lg object-cover ring-1 ring-white/10 shrink-0" />
          : <span className="w-12 h-12 rounded-lg bg-brand-500/15 text-brand-300 flex items-center justify-center shrink-0"><IconVolume className="w-5 h-5" /></span>}
        <div className="min-w-0 w-40 sm:w-52 shrink-0">
          <p className="text-sm font-semibold text-white truncate">{track.title}</p>
          <p className="text-xs text-slate-400 truncate">{track.author ?? 'Audio'}</p>
        </div>
        <audio key={track.id} src={track.audioUrl} controls autoPlay className="flex-1 h-10 min-w-0" />
        <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 shrink-0"><IconX className="w-5 h-5" /></button>
      </div>
    </div>
  )
}
