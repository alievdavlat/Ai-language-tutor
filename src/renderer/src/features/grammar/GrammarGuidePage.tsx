import { useParams } from 'react-router-dom'
import { PageHeader } from '../../components/ui'
import { IconDownload } from '../../components/icons'
import { GUIDES, type GuideId } from './curriculum'
import { downloadCheatsheet } from './cheatsheet'

export default function GrammarGuidePage(): JSX.Element {
  const { topic } = useParams<{ topic: string }>()
  const guide = topic && (topic in GUIDES) ? GUIDES[topic as GuideId] : undefined

  if (!guide) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="px-6 py-6 w-full">
          <PageHeader eyebrow="Guide" title="Guide not found" back="/grammar" crumbs={[{ label: 'Grammar', to: '/grammar' }, { label: 'Guide' }]} />
          <p className="text-sm text-slate-400 mt-4">That guide doesn’t exist. Pick one from the Grammar page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full max-w-3xl flex flex-col gap-6">
        <PageHeader
          eyebrow="Deep-dive guide"
          title={guide.title}
          subtitle={guide.summary}
          back="/grammar"
          crumbs={[{ label: 'Grammar', to: '/grammar' }, { label: guide.title }]}
          action={
            <button onClick={() => downloadCheatsheet(guide)} className="btn-primary text-xs px-3 py-2 inline-flex items-center gap-1.5">
              <IconDownload className="w-3.5 h-3.5" /> Download PDF
            </button>
          }
        />

        {/* Quick-reference table */}
        <div className="rounded-card border border-white/10 bg-white/[0.025] overflow-hidden">
          <div className="px-4 py-2.5 bg-brand-500/10 border-b border-brand-400/20">
            <p className="text-[11px] uppercase tracking-widest text-brand-200 font-bold">Quick reference · CEFR {guide.level}</p>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {guide.cheatRows.map((r) => (
              <div key={r.form} className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1.5fr] gap-1 sm:gap-3 px-4 py-3">
                <p className="text-sm font-bold text-white">{r.form}</p>
                <p className="text-xs text-slate-400 sm:self-center">{r.use}</p>
                <p className="text-xs text-brand-200 italic sm:self-center">{r.example}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="flex flex-col gap-5">
          {guide.sections.map((s) => (
            <div key={s.heading} className="rounded-card border border-white/10 bg-white/[0.025] p-5">
              <h2 className="text-base font-bold text-white border-l-2 border-brand-400 pl-3">{s.heading}</h2>
              <div className="mt-3 flex flex-col gap-2">
                {s.body.map((b, i) => (
                  <p key={i} className="text-sm text-slate-300 leading-relaxed">{b}</p>
                ))}
              </div>
              {s.examples && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {s.examples.map((e, i) => (
                    <li key={i} className="text-sm text-brand-200 italic flex gap-2">
                      <span className="text-brand-400">›</span> {e}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <button onClick={() => downloadCheatsheet(guide)} className="btn-ghost w-full py-3 inline-flex items-center justify-center gap-2">
          <IconDownload className="w-4 h-4" /> Download the {guide.title} cheatsheet (PDF)
        </button>
      </div>
    </div>
  )
}
