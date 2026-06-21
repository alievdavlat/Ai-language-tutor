import { describe, it, expect } from 'vitest'
import { localBackend } from './local'

// #B25 — commenting/replying should notify the person whose content was engaged
// with, and never the actor themselves. The local backend caches its db in
// memory, so each test uses distinct user/target ids instead of relying on a
// store reset.
describe('addComment notification producer', () => {
  it('notifies the parent comment author when someone replies', async () => {
    const parent = await localBackend.addComment({
      targetKind: 'course', targetId: 't1', authorId: 'alice1', text: 'great course'
    })
    await localBackend.addComment({
      targetKind: 'course', targetId: 't1', authorId: 'bob1', text: 'agreed!', parentId: parent.id
    })

    const forAlice = await localBackend.listNotifs('alice1')
    expect(forAlice.some((n) => n.kind === 'comment-reply' && n.title === 'New reply')).toBe(true)

    // the replier does not get notified about their own reply
    const forBob = await localBackend.listNotifs('bob1')
    expect(forBob.some((n) => n.kind === 'comment-reply')).toBe(false)
  })

  it('does not notify when replying to your own comment', async () => {
    const parent = await localBackend.addComment({
      targetKind: 'course', targetId: 't2', authorId: 'alice2', text: 'hi'
    })
    await localBackend.addComment({
      targetKind: 'course', targetId: 't2', authorId: 'alice2', text: 'self-reply', parentId: parent.id
    })

    const forAlice = await localBackend.listNotifs('alice2')
    expect(forAlice.filter((n) => n.kind === 'comment-reply')).toHaveLength(0)
  })

  it('a top-level comment on a non-post target notifies nobody', async () => {
    await localBackend.addComment({
      targetKind: 'course', targetId: 't3', authorId: 'bob3', text: 'first!'
    })
    // the course author is not resolvable from the comment alone, so nothing fires
    const forBob = await localBackend.listNotifs('bob3')
    expect(forBob.some((n) => n.kind === 'comment-reply')).toBe(false)
  })
})

describe('follow notification producer', () => {
  it('notifies the followed user on a new follow', async () => {
    await localBackend.follow('carol', 'dave')
    const forDave = await localBackend.listNotifs('dave')
    expect(forDave.some((n) => n.kind === 'follow')).toBe(true)
  })

  it('unfollowing does not raise a notification, and you cannot follow yourself', async () => {
    await localBackend.follow('erin', 'erin') // self — no-op
    const forErin = await localBackend.listNotifs('erin')
    expect(forErin.some((n) => n.kind === 'follow')).toBe(false)

    await localBackend.follow('frank', 'grace') // follow → 1 notif
    await localBackend.follow('frank', 'grace') // toggle off → no extra notif
    const forGrace = await localBackend.listNotifs('grace')
    expect(forGrace.filter((n) => n.kind === 'follow')).toHaveLength(1)
  })
})
