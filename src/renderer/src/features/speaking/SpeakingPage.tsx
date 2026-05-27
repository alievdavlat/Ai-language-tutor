import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Tabs, type TabItem } from '../../components/ui'
import ConversationMode from './modes/ConversationMode'
import RoleplayMode from './modes/RoleplayMode'
import PronunciationPage from '../pronunciation/PronunciationPage'

type Mode = 'conversation' | 'roleplay' | 'pronunciation'

const MODES: TabItem<Mode>[] = [
  { id: 'conversation', label: 'Conversation' },
  { id: 'roleplay', label: 'Roleplay' },
  { id: 'pronunciation', label: 'Pronunciation' }
]

export default function SpeakingPage(): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const [mode, setMode] = useState<Mode>('conversation')
  const [topic, setTopic] = useState('')

  if (!profile) {
    return <div className="h-full flex items-center justify-center text-slate-400">Loading…</div>
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-4 pb-3 border-b border-white/10 flex items-center justify-between gap-3 backdrop-blur-xl bg-canvas-soft/40">
        <Tabs items={MODES} active={mode} onChange={setMode} />
        <span className="hidden sm:block text-xs text-slate-500">Practice · speak freely, role-play, or check your pronunciation</span>
      </div>

      <div className="flex-1 overflow-hidden">
        {mode === 'conversation' && <ConversationMode topic={topic} onTopicChange={setTopic} />}
        {mode === 'roleplay' && (
          <RoleplayMode
            onPick={(prompt) => {
              setTopic(prompt)
              setMode('conversation')
            }}
          />
        )}
        {mode === 'pronunciation' && <PronunciationPage />}
      </div>
    </div>
  )
}
