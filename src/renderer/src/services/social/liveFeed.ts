/**
 * Real data for the Live page + the Explore "Now" bar.
 *
 *  • `resolveLiveStreams()` — `backend.listLiveNow()` joined to each host's
 *    real user record, so cards show the real streamer name, role and avatar
 *    instead of a hardcoded `STREAMS` array.
 *
 *  • `loadAudience()` — the people worth surfacing in the Now bar, in order:
 *      1. your study buddy            (the one you paired with)
 *      2. people you follow           (online first)
 *      3. recent DM partners
 *      4. level / language matches    (fill, so it's never empty)
 *    De-duped, self excluded, each tagged with *why* it's there. Online status
 *    comes from real presence (services/social/presence), not a fixed dot.
 */
import type { LiveStream, PlatformUser, TargetLanguage } from '@shared/types'
import { backend } from '../backend'

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export interface ResolvedStream {
  stream: LiveStream
  host: PlatformUser | null
  hostName: string
  hostRole: 'teacher' | 'student'
  /** Heuristic: small group rooms vs a single host broadcast. */
  group: boolean
  tags: string[]
}

/** Live streams with their host resolved to a real user. */
export async function resolveLiveStreams(language?: string): Promise<ResolvedStream[]> {
  const [streams, users] = await Promise.all([
    backend.listLiveNow(language ? { language } : undefined),
    backend.listUsers()
  ])
  const byId = new Map(users.map((u) => [u.id, u]))
  return streams
    .map<ResolvedStream>((stream) => {
      const host = byId.get(stream.hostId) ?? null
      const group = /group|club|table|roundtable|practice hour/i.test(`${stream.title} ${stream.category}`)
      const tags = [stream.language.toUpperCase()]
      if (host?.level) tags.push(host.level)
      return {
        stream,
        host,
        hostName: host?.name ?? 'Host',
        hostRole: host?.role === 'teacher' ? 'teacher' : 'student',
        group,
        tags
      }
    })
    .sort((a, b) => b.stream.viewerCount - a.stream.viewerCount)
}

export type AudienceReason = 'buddy' | 'following' | 'recent' | 'match'

export interface AudienceMember {
  user: PlatformUser
  reason: AudienceReason
  /** Whether we can open a real DM thread with them (real backend user). */
  canMessage: boolean
}

const REASON_RANK: Record<AudienceReason, number> = { buddy: 0, following: 1, recent: 2, match: 3 }

function levelScore(a?: string, b?: string): number {
  const i = a ? CEFR.indexOf(a) : -1
  const j = b ? CEFR.indexOf(b) : -1
  if (i < 0 || j < 0) return 1
  const gap = Math.abs(i - j)
  return gap === 0 ? 3 : gap === 1 ? 2 : gap === 2 ? 1 : 0
}

/**
 * Compose the ordered Now-bar audience for `me`.
 * `buddyId` comes from the progress store (the paired study buddy).
 */
export async function loadAudience(
  me: string | null,
  opts: { buddyId?: string | null; level?: string; targetLanguage?: TargetLanguage } = {},
  limit = 12
): Promise<AudienceMember[]> {
  if (!me) return []
  const { buddyId, level, targetLanguage } = opts

  const [followingUsers, threads, allUsers] = await Promise.all([
    backend.following(me).catch(() => [] as PlatformUser[]),
    backend.listThreads(me).catch(() => []),
    backend.listUsers().catch(() => [] as PlatformUser[])
  ])
  const byId = new Map(allUsers.map((u) => [u.id, u]))

  const out: AudienceMember[] = []
  const seen = new Set<string>([me])
  const push = (user: PlatformUser | null | undefined, reason: AudienceReason): void => {
    if (!user || seen.has(user.id)) return
    seen.add(user.id)
    out.push({ user, reason, canMessage: user.id.startsWith('u_') || byId.has(user.id) })
  }

  // 1. Study buddy (only real backend users can sit in the bar).
  if (buddyId) push(byId.get(buddyId) ?? (await backend.getUser(buddyId).catch(() => null)), 'buddy')

  // 2. People you follow.
  for (const u of followingUsers) push(u, 'following')

  // 3. Recent DM partners (most recent first).
  const partnerIds = threads
    .slice()
    .sort((a, b) => (b.lastMessageAt ?? '').localeCompare(a.lastMessageAt ?? ''))
    .map((t) => t.participantIds.find((id) => id !== me))
    .filter((id): id is string => !!id)
  for (const id of partnerIds) push(byId.get(id), 'recent')

  // 4. Level / language matches as fill — students learning the same language,
  //    closest level first. Keeps the bar useful for a brand-new account.
  const matches = allUsers
    .filter((u) => u.id !== me && u.role === 'student' && !seen.has(u.id))
    .filter((u) => !targetLanguage || u.targetLanguage === targetLanguage)
    .map((u) => ({ u, score: levelScore(level, u.level) }))
    .sort((a, b) => b.score - a.score)
    .map((x) => x.u)
  for (const u of matches) {
    if (out.length >= limit) break
    push(u, 'match')
  }

  // Stable order by reason priority (online sorting is applied in the view,
  // which knows live presence).
  return out
    .sort((a, b) => REASON_RANK[a.reason] - REASON_RANK[b.reason])
    .slice(0, limit)
}
