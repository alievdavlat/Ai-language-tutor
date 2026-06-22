import { useEffect, useRef, useState } from 'react'
import type { ChatMessage, UserProfile } from '@shared/types'
import { resolveCharacter } from '@shared/constants'
import { characterAvatarUrl } from '@shared/utils/avatar'
import { Card } from '../../../components/ui'
import { cn } from '../../../lib/classnames'
import { useChatStream } from '../../../hooks/useChatStream'
import { buildSystemPrompt } from '../../../services/prompts/buildSystemPrompt'
import { useActiveAI } from '../../../lib/ai'
import { useT } from '../../../i18n'

interface Msg {
  role: 'user' | 'assistant'
  text: string
}

/**
 * A tiny text-only sandbox so the user can feel how the active companion's
 * persona (sliders, speaking style, accent) actually reads before committing to
 * a voice call. Uses the same prompt builder + chat router as the real
 * Speaking page, so what you see here is what you get there.
 */
export default function CompanionPreviewChat({ profile }: { profile: UserProfile }): JSX.Element {
  const t = useT()
  const character = resolveCharacter(profile, profile.settings.characterId)
  const activeAI = useActiveAI()
  const { send, streaming } = useChatStream(profile.settings.llmModel ?? '')
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset the sandbox whenever the active character changes.
  useEffect(() => {
    setMsgs([])
  }, [profile.settings.characterId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [msgs])

  const sendMsg = async (): Promise<void> => {
    const text = draft.trim()
    if (!text || streaming) return
    setDraft('')
    const history: Msg[] = [...msgs, { role: 'user', text }]
    setMsgs([...history, { role: 'assistant', text: '' }])
    const payload: ChatMessage[] = [
      { role: 'system', content: buildSystemPrompt(profile) },
      ...history.map((m) => ({ role: m.role, content: m.text }) as ChatMessage)
    ]
    await send(payload, (_d, full) => {
      setMsgs((cur) => {
        const next = [...cur]
        next[next.length - 1] = { role: 'assistant', text: full }
        return next
      })
    })
  }

  return (
    <Card>
      <div className="flex items-center gap-3 mb-3">
        {character?.avatarSeed ? (
          <img src={characterAvatarUrl(character, 64)} alt={character.name} className="w-10 h-10 rounded-xl ring-1 ring-white/15" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center text-xl">{character?.emoji ?? '🙂'}</div>
        )}
        <div>
          <h2 className="font-semibold text-base">{t('setb.previewChatTitle', { name: character?.name ?? t('setb.companion') })}</h2>
          <p className="text-xs text-slate-500">{t('setb.previewChatSubtitle')}</p>
        </div>
      </div>

      {!activeAI && (
        <p className="text-xs text-amber-300/90 mb-3">
          {t('setb.previewProviderTip')}
        </p>
      )}

      <div ref={scrollRef} className="h-56 overflow-y-auto rounded-xl bg-black/20 border border-white/10 p-3 flex flex-col gap-2">
        {msgs.length === 0 && (
          <p className="text-xs text-slate-500 m-auto text-center px-6">
            {t('setb.previewSayHello', { name: character?.name ?? t('setb.yourCompanion') })}
          </p>
        )}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={cn(
              'rounded-2xl px-3 py-2 text-sm max-w-[85%]',
              m.role === 'user' ? 'bg-brand-500/20 text-brand-50 self-end' : 'bg-white/[0.06] text-slate-200 self-start'
            )}
          >
            {m.text || <span className="text-slate-500 italic">…</span>}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void sendMsg() }}
          placeholder={t('setb.messagePlaceholder', { name: character?.name ?? t('setb.companion') })}
          className="input flex-1"
          disabled={streaming}
        />
        <button onClick={() => void sendMsg()} disabled={streaming || !draft.trim()} className="btn-primary px-4 py-2 text-sm">
          {streaming ? '…' : t('setb.send')}
        </button>
      </div>
    </Card>
  )
}
