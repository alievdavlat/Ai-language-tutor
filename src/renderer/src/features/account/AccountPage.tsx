import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { CEFRLevel, Course, MediaAsset, Post, TargetLanguage, UserProfile } from '@shared/types'
import { SUPPORTED_LANGUAGES, ROLES, ROLE_META } from '@shared/constants'
import { cn } from '../../lib/classnames'
import { useAppStore } from '../../store/useAppStore'
import { useTargetLanguage } from '../../lib/language'
import { bandFromDob, BAND_LABEL } from '../../lib/age'
import { AvatarCircle, Input, Tabs, type TabItem } from '../../components/ui'
import { backend, useBackendQuery } from '../../services/backend/useBackend'
import { uploadUrl } from '../../services/backend'
import { useRef } from 'react'
import DangerZoneSection from '../settings/sections/DangerZoneSection'

const LEVELS: readonly CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
import {
  IconBook,
  IconPlay,
  IconPlus,
  IconVolume,
  IconYouTube
} from '../../components/icons'

type Tab = 'saved' | 'likes' | 'uploads' | 'help'
const TABS: TabItem<Tab>[] = [
  { id: 'saved', label: 'Saved' },
  { id: 'likes', label: 'Likes' },
  { id: 'uploads', label: 'Uploads' },
  { id: 'help', label: 'Help' }
]

const HELP = [
  'How do I download a book?',
  'How does the level test work?',
  'How do I go live or join a group?',
  'How do I upload a resource?',
  'Contact support'
]

const COVERS = ['from-rose-500 to-pink-700', 'from-sky-500 to-blue-700', 'from-violet-500 to-purple-700', 'from-emerald-500 to-teal-700', 'from-amber-500 to-orange-700']
const coverFor = (seed: string): string => COVERS[Math.abs([...seed].reduce((a, c) => a + c.charCodeAt(0), 0)) % COVERS.length]

interface Tile { kind: 'course' | 'video' | 'book' | 'podcast' | 'post'; title: string; sub: string; cover: string }

function MediaTile({ item }: { item: Tile }): JSX.Element {
  const Icon = item.kind === 'book' ? IconBook : item.kind === 'podcast' ? IconVolume : IconPlay
  return (
    <div className="text-left">
      <div className={cn('relative rounded-2xl bg-gradient-to-br h-28 ring-1 ring-white/10 flex items-center justify-center', item.cover)}>
        <span className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"><Icon className="w-4 h-4 text-white" /></span>
        {item.kind === 'video' && <span className="absolute top-2 left-2"><IconYouTube className="w-4 h-4 text-red-500" /></span>}
      </div>
      <p className="text-sm font-semibold text-white mt-2 truncate">{item.title}</p>
      <p className="text-xs text-slate-400 truncate">{item.sub}</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }): JSX.Element {
  return <p className="col-span-full text-sm text-slate-400 text-center py-10">{text}</p>
}

function ProfileEditModal({ profile, onClose }: { profile: UserProfile; onClose: () => void }): JSX.Element {
  const setProfile = useAppStore((s) => s.setProfile)
  const [name, setName] = useState(profile.name ?? '')
  const [dob, setDob] = useState(profile.dateOfBirth ?? '')
  const [level, setLevel] = useState<CEFRLevel>(profile.level)
  const [target, setTarget] = useState<TargetLanguage>(profile.targetLanguage)
  const [nativeLang, setNativeLang] = useState(profile.nativeLanguage ?? '')
  const [saving, setSaving] = useState(false)
  const band = bandFromDob(dob)

  const save = async (): Promise<void> => {
    setSaving(true)
    const next: UserProfile = {
      ...profile,
      name: name.trim() || undefined,
      dateOfBirth: /^\d{4}-\d{2}-\d{2}$/.test(dob) ? dob : profile.dateOfBirth,
      level,
      targetLanguage: target,
      nativeLanguage: nativeLang.trim() || profile.nativeLanguage,
      updatedAt: new Date().toISOString()
    }
    await window.api.profile.save(next)
    setProfile(next)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 animate-fade-in" onClick={onClose}>
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <header className="sticky top-0 bg-slate-900/95 backdrop-blur px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit profile</h2>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost text-sm px-3 py-1.5">Cancel</button>
            <button onClick={() => void save()} disabled={saving} className="btn-primary text-sm px-4 py-1.5 disabled:opacity-60">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </header>
        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Date of birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              min="1900-01-01"
              className="input"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              🛡️ {band ? BAND_LABEL[band] : 'Not set — companions & AI tutor stay locked until confirmed.'}
            </p>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">English / target level</label>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((lv) => (
                <button key={lv} onClick={() => setLevel(lv)}
                  className={cn('rounded-full px-4 py-1.5 text-xs font-bold border transition', level === lv ? 'bg-brand-500/20 border-brand-400/40 text-brand-100' : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]')}>
                  {lv}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Learning language</label>
            <div className="flex flex-wrap gap-2">
              {SUPPORTED_LANGUAGES.map((l) => (
                <button key={l.code} onClick={() => setTarget(l.code)}
                  className={cn('rounded-full px-3 py-1.5 text-xs font-semibold border transition', target === l.code ? 'bg-brand-500/20 border-brand-400/40 text-brand-100' : 'bg-white/[0.04] border-white/10 text-slate-300 hover:bg-white/[0.08]')}>
                  {l.flag} {l.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">Native language</label>
            <Input value={nativeLang} onChange={(e) => setNativeLang(e.target.value)} placeholder="e.g. Uzbek" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AccountPage(): JSX.Element {
  const navigate = useNavigate()
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)
  const lang = useTargetLanguage()
  const [tab, setTab] = useState<Tab>('saved')
  const [editing, setEditing] = useState(false)
  const avatarInput = useRef<HTMLInputElement>(null)

  const uploadAvatar = async (file?: File): Promise<void> => {
    if (!file || !profile) return
    if (file.size > 4 * 1024 * 1024) return
    const url = await uploadUrl(file, 'avatars')
    const next = { ...profile, avatarUrl: url, updatedAt: new Date().toISOString() }
    await window.api.profile.save(next)
    setProfile(next)
  }
  const displayName = profile?.name?.trim() || 'You'
  const level = profile?.level ?? 'B1'
  const band = bandFromDob(profile?.dateOfBirth)
  const me = backend.currentUserId()

  // ── Real account data ──────────────────────────────────────────────────
  const stats = useBackendQuery(() => (me ? backend.getStats(me) : Promise.resolve(null)), [me], null)
  const counts = useBackendQuery(() => (me ? backend.followCounts(me) : Promise.resolve({ followers: 0, following: 0 })), [me], { followers: 0, following: 0 })

  // Saved courses + posts resolved to renderable tiles.
  const saved = useBackendQuery(async (): Promise<Tile[]> => {
    if (!me) return []
    const rows = await backend.listSaved(me)
    const out = await Promise.all(rows.map(async (s): Promise<Tile | null> => {
      if (s.target.kind === 'course') {
        const c = await backend.getCourse(s.target.id)
        return c ? { kind: 'course', title: c.title, sub: `${c.level} · ★ ${c.rating}`, cover: c.cover || coverFor(c.title) } : null
      }
      return { kind: 'post', title: 'Saved community post', sub: 'Tap to open in Community', cover: coverFor(s.target.id) }
    }))
    return out.filter((x): x is Tile => x !== null)
  }, [me], [])

  // Likes resolved against the feed so we can show the actual post text.
  const likes = useBackendQuery(async (): Promise<Tile[]> => {
    if (!me) return []
    const [likeRows, feed] = await Promise.all([backend.listLikes(me), backend.listFeed({ limit: 200 })])
    const byId = new Map<string, Post>(feed.map((p) => [p.id, p]))
    return likeRows.map((l): Tile => {
      const p = byId.get(l.postId)
      return {
        kind: p?.resource?.kind === 'audio' ? 'podcast' : p?.resource?.kind === 'youtube' ? 'video' : 'post',
        title: p ? (p.text.slice(0, 60) || 'Community post') : 'Liked post',
        sub: p?.resource?.title || 'Community',
        cover: coverFor(l.postId)
      }
    })
  }, [me], [])

  const uploads = useBackendQuery(() => (me ? backend.listMedia(me) : Promise.resolve([] as MediaAsset[])), [me], [] as MediaAsset[])

  const xp = stats.data?.xp ?? 0
  const streak = stats.data?.streak ?? 0

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            <AvatarCircle name={displayName} src={profile?.avatarUrl} size="lg" className="!w-20 !h-20 !text-2xl" />
            <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={(e) => void uploadAvatar(e.target.files?.[0])} />
            <button onClick={() => avatarInput.current?.click()} className="absolute inset-0 rounded-full bg-black/55 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] font-bold text-white" title="Change photo">
              Change
            </button>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
            <p className="text-sm text-slate-400">Level {level} · learning {lang.name} {lang.flag}</p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
              <span><b className="text-white">{counts.data.following}</b> following</span>
              <span><b className="text-white">{counts.data.followers}</b> followers</span>
              <span><b className="text-white">{xp.toLocaleString()}</b> XP</span>
              <span><b className="text-amber-300">🔥 {streak}</b> day streak</span>
            </div>
          </div>
          <button onClick={() => setEditing(true)} className="btn-ghost px-4 py-2 text-sm shrink-0">Edit profile</button>
        </div>

        {/* Age-band nudge (editing happens in Edit profile). */}
        {!band && (
          <button
            onClick={() => setEditing(true)}
            className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.06] px-4 py-3 flex items-center gap-3 text-left hover:bg-amber-500/[0.1] transition"
          >
            <span className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-300 flex items-center justify-center shrink-0">🛡️</span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-white">Confirm your age</span>
              <span className="block text-xs text-slate-400">Companions & AI tutor stay locked until you add your date of birth.</span>
            </span>
            <span className="text-xs text-amber-300 font-semibold shrink-0">Set →</span>
          </button>
        )}

        <Tabs items={TABS} active={tab} onChange={setTab} className="self-start" />

        {tab === 'saved' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {saved.data.length === 0
              ? <EmptyState text="Nothing saved yet. Tap the bookmark on any course or post to keep it here." />
              : saved.data.map((i, idx) => (
                <button key={idx} onClick={() => navigate(i.kind === 'course' ? '/courses' : '/community')} className="text-left">
                  <MediaTile item={i} />
                </button>
              ))}
          </div>
        )}
        {tab === 'likes' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {likes.data.length === 0
              ? <EmptyState text="No likes yet. Like posts in the Community to find them later." />
              : likes.data.map((i, idx) => <MediaTile key={idx} item={i} />)}
          </div>
        )}
        {tab === 'uploads' && (
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 flex flex-col items-center text-center gap-2">
              <span className="w-10 h-10 rounded-full bg-brand-500/15 text-brand-300 flex items-center justify-center"><IconPlus className="w-5 h-5" /></span>
              <p className="text-sm font-semibold text-white">Share a resource</p>
              <p className="text-xs text-slate-400">Post a PDF, audio or a YouTube link to the Community.</p>
              <button onClick={() => navigate('/community')} className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full bg-white/[0.05] border border-white/10 px-3 py-1.5 text-slate-300 hover:bg-white/10 mt-1">
                <IconPlus className="w-3.5 h-3.5" /> New post
              </button>
            </div>
            {uploads.data.length === 0
              ? <EmptyState text="No uploads yet." />
              : uploads.data.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center', u.kind === 'pdf' ? 'bg-rose-500/15 text-rose-300' : 'bg-brand-500/15 text-brand-300')}>
                    {u.kind === 'pdf' ? <IconBook className="w-5 h-5" /> : u.kind === 'audio' ? <IconVolume className="w-5 h-5" /> : <IconPlay className="w-5 h-5" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.kind.toUpperCase()} · {(u.sizeBytes / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                </div>
              ))}
          </div>
        )}
        {tab === 'help' && (
          <div className="flex flex-col gap-2">
            {HELP.map((h) => (
              <button key={h} className="flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.03] px-4 py-3 text-left text-sm text-slate-200 hover:bg-white/[0.06] transition">
                {h} <span className="text-slate-500">→</span>
              </button>
            ))}
          </div>
        )}

        {/* Role switcher — test the Student / Teacher / Owner (admin) views. */}
        <RoleSwitcher />

        {/* Data & reset (moved here from the old Conversation settings tab). */}
        <div className="mt-2">
          <DangerZoneSection />
        </div>
      </div>

      {editing && profile && <ProfileEditModal profile={profile} onClose={() => setEditing(false)} />}
    </div>
  )
}

/** Dev/testing helper: switch between the four roles in the hierarchy
 *  (Student < Teacher < Admin < Owner). Role is the same flag used across the
 *  app; switching navigates to that role's home shell so you can review each
 *  view. Real role assignment is owner-gated (`canAssignRole`) once auth lands
 *  (#A54) — this switcher deliberately bypasses that for testing. */
function RoleSwitcher(): JSX.Element {
  const navigate = useNavigate()
  const role = useAppStore((s) => s.role)
  const setRole = useAppStore((s) => s.setRole)

  return (
    <div className="rounded-card border border-white/10 bg-white/[0.025] p-5">
      <h2 className="text-sm font-bold text-white">Switch role (testing)</h2>
      <p className="text-xs text-slate-400 mt-0.5 mb-3">View the app as any role in the hierarchy. Admin &amp; Owner open the platform console, not a learner home. You can also press <kbd className="font-mono text-[11px] bg-white/10 border border-white/15 rounded px-1 py-0.5">Ctrl+Shift+A</kbd> to jump to Admin.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ROLES.map((id) => {
          const meta = ROLE_META[id]
          return (
            <button
              key={id}
              onClick={() => { setRole(id); navigate(meta.home) }}
              className={cn('rounded-2xl border p-4 text-left transition', role === id ? 'border-brand-400/50 bg-brand-500/10 ring-1 ring-brand-400/30' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]')}
            >
              <p className="text-sm font-bold text-white">{meta.label}{role === id ? ' ✓' : ''}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{meta.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
