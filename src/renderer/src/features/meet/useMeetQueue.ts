import { useEffect, useMemo, useRef, useState } from 'react'
import { useRealtimeRoom } from '../../hooks/realtime/useRealtimeRoom'

export interface MeetMatch {
  roomId: string
  partnerName: string
  partnerPeerId: string
}

interface MatchEvent {
  pair: [string, string]
  roomId: string
  names: Record<string, string>
}

/**
 * Decentralised matchmaking for the speaking-partner queue. Everyone looking
 * for a partner joins one presence channel. To avoid a central server, the
 * waiting peer with the lowest id acts as the matchmaker: it pairs itself with
 * the next compatible peer and broadcasts the match; both then jump into a 1:1
 * media room. Works the same over Supabase Realtime or same-machine windows.
 */
export function useMeetQueue(opts: {
  name: string
  level: string
  topic: string
  enabled: boolean
}): { waitingCount: number; match: MeetMatch | null; reset: () => void } {
  const { name, level, topic, enabled } = opts
  const [match, setMatch] = useState<MeetMatch | null>(null)
  const matchedRef = useRef(false)

  const presence = useMemo(
    () => ({ name, level, topic, status: 'waiting' as const }),
    [name, level, topic]
  )
  const { channel, peers, peerId, send, updatePresence } = useRealtimeRoom('meet:queue', presence, {
    enabled
  })

  const compatible = useMemo(() => {
    return peers.filter((p) => {
      if (p.peerId === peerId) return false
      if (p.status !== 'waiting') return false
      // Level: 'Any' matches anyone; otherwise require an exact match.
      const levelOk = level === 'Any' || p.level === 'Any' || p.level === level
      // Topic: 'Free talk' is a wildcard.
      const topicOk = topic === 'Free talk' || p.topic === 'Free talk' || p.topic === topic
      return levelOk && topicOk
    })
  }, [peers, peerId, level, topic])

  // Listen for a match addressed to us.
  useEffect(() => {
    if (!channel) return
    return channel.on('match', (payload) => {
      const m = payload as MatchEvent
      if (matchedRef.current || !peerId) return
      if (!m.pair.includes(peerId)) return
      const partnerPeerId = m.pair.find((id) => id !== peerId)!
      matchedRef.current = true
      updatePresence({ status: 'matched' })
      setMatch({ roomId: m.roomId, partnerName: m.names[partnerPeerId] ?? 'Partner', partnerPeerId })
    })
  }, [channel, peerId, updatePresence])

  // Matchmaker: lowest-id waiting peer pairs up the next compatible peer.
  useEffect(() => {
    if (!enabled || matchedRef.current || !peerId || !channel) return
    const waitingIds = [peerId, ...compatible.map((p) => p.peerId)].sort()
    // I'm the matchmaker only if I'm the lowest waiting id and have a partner.
    if (waitingIds[0] !== peerId || compatible.length === 0) return
    const partner = compatible.slice().sort((a, b) => a.peerId.localeCompare(b.peerId))[0]
    const pair: [string, string] = [peerId, partner.peerId]
    const roomId = `meet:room:${pair.slice().sort().join('-')}`
    const names: Record<string, string> = { [peerId]: name, [partner.peerId]: (partner.name as string) ?? 'Partner' }
    // Small delay lets presence settle before we commit a pairing.
    const t = setTimeout(() => {
      if (matchedRef.current) return
      send('match', { pair, roomId, names } satisfies MatchEvent)
      matchedRef.current = true
      updatePresence({ status: 'matched' })
      setMatch({ roomId, partnerName: (partner.name as string) ?? 'Partner', partnerPeerId: partner.peerId })
    }, 400)
    return () => clearTimeout(t)
  }, [enabled, peerId, channel, compatible, name, send, updatePresence])

  // Reset matched flag when the queue is disabled (left / searching again).
  useEffect(() => {
    if (!enabled) {
      matchedRef.current = false
      setMatch(null)
    }
  }, [enabled])

  const reset = (): void => {
    matchedRef.current = false
    setMatch(null)
    updatePresence({ status: 'waiting' })
  }

  return { waitingCount: compatible.length + (enabled ? 1 : 0), match, reset }
}
