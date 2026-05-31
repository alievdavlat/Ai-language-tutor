import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cn } from '../../lib/classnames'
import { PageHeader } from '../../components/ui'
import { IconBook, IconChevronLeft, IconChevronRight, IconHeadphones, IconVolume } from '../../components/icons'
import { getStory } from '../../services/stories/store'
import { useContentState, setStoryProgress, getStoryProgress } from '../../services/content/progress'
import { backend } from '../../services/backend/useBackend'
import { logActivity } from '../../services/activity'
import { useAppStore } from '../../store/useAppStore'
import WordText, { type WordPick } from '../../components/content/WordText'
import DictionaryPopover from '../../components/content/DictionaryPopover'
import { isWordSaved } from '../../services/content/progress'
import ExamRunner from '../courses/ExamRunner'

type Mode = 'read' | 'listen'

export default function StoryReaderPage(): JSX.Element {
  const navigate = useNavigate()
  const { storyId = '' } = useParams()
  const story = getStory(storyId)
  const nativeLang = useAppStore((s) => s.profile?.nativeLanguage ?? 'uz')
  const userId = backend.currentUserId()
  useContentState()

  const initial = getStoryProgress(storyId)?.part ?? 0
  const [part, setPart] = useState(initial)
  const [mode, setMode] = useState<Mode>(story?.kind === 'listening' ? 'listen' : 'read')
  const [quiz, setQuiz] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [pick, setPick] = useState<WordPick | null>(null)

  // Persist the current part as the resume point.
  useEffect(() => {
    if (story) setStoryProgress(storyId, part, getStoryProgress(storyId)?.completed ?? false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part, storyId])

  useEffect(() => () => window.speechSynthesis?.cancel(), [])

  if (!story) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <p className="text-slate-400">Story not found.</p>
        <button onClick={() => navigate('/stories')} className="btn-primary px-5 py-2">All stories</button>
      </div>
    )
  }

  const p = story.parts[Math.min(part, story.parts.length - 1)]
  const isLast = part === story.parts.length - 1

  function narrate(): void {
    if (!('speechSynthesis' in window)) return
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    const u = new SpeechSynthesisUtterance(p.paragraphs.join(' '))
    u.lang = 'en-US'
    u.rate = 0.95
    u.onend = () => setSpeaking(false)
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
    setSpeaking(true)
  }

  function onQuizComplete(score: number): void {
    setStoryProgress(storyId, story!.parts.length - 1, true)
    if (userId) logActivity({ userId, kind: 'practice_session', xp: story!.xp, meta: { storyId, score } }).catch(() => {})
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full max-w-2xl mx-auto flex flex-col gap-5">
        <PageHeader
          eyebrow={`${story.level} · ${story.kind}`}
          title={`${story.emoji} ${story.title}`}
          subtitle={story.blurb}
          back="/stories"
          crumbs={[{ label: 'Library', to: '/library' }, { label: 'Stories', to: '/stories' }, { label: story.title }]}
        />

        {/* Mode toggle + progress */}
        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button onClick={() => setMode('read')} className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition', mode === 'read' ? 'bg-brand-500/20 text-brand-100' : 'text-slate-400')}>
              <IconBook className="w-3.5 h-3.5" /> Read
            </button>
            <button onClick={() => setMode('listen')} className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition', mode === 'listen' ? 'bg-brand-500/20 text-brand-100' : 'text-slate-400')}>
              <IconHeadphones className="w-3.5 h-3.5" /> Listen
            </button>
          </div>
          <span className="text-xs text-slate-400">Part {part + 1} of {story.parts.length}</span>
        </div>

        {quiz ? (
          <ExamRunner
            title={`${story.title} · Comprehension`}
            subtitle="Check what you understood."
            questions={story.questions}
            passMark={50}
            onComplete={onQuizComplete}
            onExit={() => navigate('/stories')}
          />
        ) : (
          <>
            {/* Part body */}
            <article className="rounded-card border border-white/10 bg-white/[0.025] p-6">
              <h2 className="text-lg font-bold text-white mb-4">{p.title}</h2>
              {mode === 'listen' && (
                <button onClick={narrate} className={cn('mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition', speaking ? 'bg-brand-500/30 text-brand-100' : 'bg-brand-500/15 text-brand-200 hover:bg-brand-500/25')}>
                  <IconVolume className="w-4 h-4" /> {speaking ? 'Stop narration' : 'Play narration'}
                </button>
              )}
              <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-slate-200">
                {p.paragraphs.map((para, i) => (
                  <p key={i}>
                    <WordText text={para} onPick={setPick} isSaved={(w) => isWordSaved(w, 'en')} active={pick?.word} />
                  </p>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-4">Tip: click or press-and-hold any word to translate and save it.</p>
            </article>

            {/* Nav */}
            <div className="flex items-center justify-between">
              <button onClick={() => setPart((i) => Math.max(0, i - 1))} disabled={part === 0} className="btn-ghost px-4 py-2 inline-flex items-center gap-1.5 disabled:opacity-40">
                <IconChevronLeft className="w-4 h-4" /> Prev
              </button>
              {!isLast ? (
                <button onClick={() => { window.speechSynthesis?.cancel(); setSpeaking(false); setPart((i) => i + 1) }} className="btn-primary px-5 py-2 inline-flex items-center gap-1.5">
                  Next part <IconChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={() => { window.speechSynthesis?.cancel(); setQuiz(true) }} className="btn-primary px-5 py-2 inline-flex items-center gap-1.5">
                  Comprehension check <IconChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {pick && (
        <DictionaryPopover
          word={pick.word}
          lang="en"
          nativeLang={nativeLang}
          source={`Story · ${story.title}`}
          anchor={{ left: pick.rect.left, top: pick.rect.top, bottom: pick.rect.bottom }}
          onClose={() => setPick(null)}
        />
      )}
    </div>
  )
}
