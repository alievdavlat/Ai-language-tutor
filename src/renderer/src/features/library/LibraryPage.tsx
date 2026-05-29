import { useState } from 'react'
import { cn } from '../../lib/classnames'
import { ListRow, Tabs, type TabItem } from '../../components/ui'
import { useTargetLanguage } from '../../lib/language'
import { getLibraryForLanguage } from '../../lib/contentByLanguage'
import { IconBook, IconHeadphones, IconPlay, IconVolume } from '../../components/icons'

type Tab = 'videos' | 'books' | 'podcasts'

const TABS: TabItem<Tab>[] = [
  { id: 'videos', label: 'Videos' },
  { id: 'books', label: 'Books' },
  { id: 'podcasts', label: 'Podcasts' }
]

// Per-level chip color used by the language-aware video cards below.
const LEVEL_TONE: Record<string, string> = {
  A2: 'bg-emerald-500/80',
  B1: 'bg-amber-500/80',
  B2: 'bg-rose-500/80'
}

export default function LibraryPage(): JSX.Element {
  const [tab, setTab] = useState<Tab>('videos')
  const lang = useTargetLanguage()
  const langLibrary = getLibraryForLanguage(lang.code)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full w-full flex flex-col gap-6">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">{lang.flag} {lang.name}</p>
          <h1 className="text-2xl font-bold tracking-tight mt-0.5">Library</h1>
          <p className="text-sm text-slate-400 mt-1">
            Watch, read and listen — graded to your level, in {lang.name}.
          </p>
        </div>

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {tab === 'videos' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {langLibrary.videos.map((v, i) => (
                <button key={v.title} className="text-left group">
                  <div className={cn('relative rounded-2xl bg-gradient-to-br h-32 flex items-center justify-center overflow-hidden', v.cover)}>
                    <span className="w-12 h-12 rounded-full bg-white/25 backdrop-blur flex items-center justify-center group-hover:scale-110 transition">
                      <IconPlay className="w-5 h-5 text-white ml-0.5" />
                    </span>
                    <span className="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/50 text-white rounded px-1.5 py-0.5">{v.duration}</span>
                    <span className={cn('absolute top-2 left-2 text-[10px] font-bold text-white rounded px-1.5 py-0.5', LEVEL_TONE[i % 3 === 0 ? 'A2' : i % 3 === 1 ? 'B1' : 'B2'])}>
                      {i % 3 === 0 ? 'A2' : i % 3 === 1 ? 'B1' : 'B2'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-2 leading-tight">{v.title}</p>
                  <p className="text-xs text-slate-400">{v.author}</p>
                </button>
              ))}
            </div>
            {langLibrary.videos.length < 3 && (
              <p className="text-xs text-slate-500 text-center">More {lang.name} videos arriving soon.</p>
            )}
          </>
        )}

        {tab === 'books' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {langLibrary.books.map((b) => (
              <button key={b.title} className="text-left group">
                <div className={cn('relative rounded-2xl bg-gradient-to-br h-40 p-4 flex flex-col justify-between overflow-hidden', b.cover)}>
                  <div aria-hidden className="absolute left-3 top-0 bottom-0 w-px bg-white/20" />
                  <IconBook className="w-6 h-6 text-white/70" />
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">{b.title}</p>
                    <p className="text-[11px] text-white/70 mt-0.5">{b.author}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 px-0.5">
                  <span className="text-xs text-slate-400">{b.pages ?? 0} pages</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === 'podcasts' && (
          <div className="flex flex-col gap-2">
            {langLibrary.podcasts.map((p) => (
              <ListRow
                key={p.title}
                leading={
                  <span className="w-11 h-11 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center">
                    <IconHeadphones className="w-5 h-5" />
                  </span>
                }
                title={p.title}
                subtitle={`${p.author} · ${p.duration ?? ''} · transcript`}
                trailing={
                  <button className="w-9 h-9 rounded-full bg-brand-500/15 text-brand-300 flex items-center justify-center hover:bg-brand-500/25 transition">
                    <IconVolume className="w-[18px] h-[18px]" />
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
