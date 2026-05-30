/**
 * Comments store — YouTube/Instagram-style threaded comments + likes for any
 * target (course, video, lesson, book). localStorage today; a `comments` table
 * later. Separate from course "reviews" (which carry a star rating).
 */
import type { Comment, CommentTargetKind, ID } from '@shared/types'
import { backend } from '../backend/useBackend'

const LS_KEY = 'speakai.comments.v1'
const newId = (): ID => `cm_${Math.random().toString(36).slice(2, 10)}`
const now = (): string => new Date().toISOString()
const me = (): ID | null => backend.currentUserId()

interface CommentsDb {
  comments: Comment[]
  likes: { userId: ID; commentId: ID }[]
}

let cache: CommentsDb | null = null
function db(): CommentsDb {
  if (cache) return cache
  if (typeof window === 'undefined' || !window.localStorage) { cache = { comments: [], likes: [] }; return cache }
  try { cache = JSON.parse(window.localStorage.getItem(LS_KEY) || '') as CommentsDb } catch { cache = { comments: [], likes: [] } }
  if (!cache || !Array.isArray(cache.comments)) cache = { comments: [], likes: [] }
  return cache
}
function persist(): void {
  if (cache && typeof window !== 'undefined' && window.localStorage) {
    try { window.localStorage.setItem(LS_KEY, JSON.stringify(cache)) } catch { /* quota */ }
  }
}

export const comments = {
  /** All comments for a target (caller threads them by parentId). */
  async list(kind: CommentTargetKind, targetId: ID): Promise<Comment[]> {
    return db().comments
      .filter((c) => c.targetKind === kind && c.targetId === targetId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  async add(input: { targetKind: CommentTargetKind; targetId: ID; text: string; parentId?: ID }): Promise<Comment | null> {
    const author = me()
    if (!author || !input.text.trim()) return null
    const c: Comment = { id: newId(), targetKind: input.targetKind, targetId: input.targetId, authorId: author, text: input.text.trim(), parentId: input.parentId, createdAt: now() }
    db().comments.unshift(c)
    persist()
    return c
  },
  async remove(id: ID): Promise<void> {
    // remove the comment and any replies to it
    db().comments = db().comments.filter((c) => c.id !== id && c.parentId !== id)
    db().likes = db().likes.filter((l) => l.commentId !== id)
    persist()
  },
  toggleLike(commentId: ID): boolean {
    const u = me(); if (!u) return false
    const i = db().likes.findIndex((l) => l.userId === u && l.commentId === commentId)
    if (i >= 0) { db().likes.splice(i, 1); persist(); return false }
    db().likes.push({ userId: u, commentId }); persist(); return true
  },
  likeCount(commentId: ID): number {
    return db().likes.filter((l) => l.commentId === commentId).length
  },
  isLiked(commentId: ID): boolean {
    const u = me(); if (!u) return false
    return db().likes.some((l) => l.userId === u && l.commentId === commentId)
  },
  canDelete(c: Comment): boolean {
    return me() === c.authorId
  }
}

export type Comments = typeof comments
