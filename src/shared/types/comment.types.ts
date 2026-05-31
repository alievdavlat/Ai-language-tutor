import type { ID } from './platform.types'

export type CommentTargetKind = 'course' | 'video' | 'lesson' | 'book' | 'post'

/** A YouTube/Instagram-style comment. Top-level when `parentId` is unset;
 *  otherwise it's a reply to that comment. */
export interface Comment {
  id: ID
  targetKind: CommentTargetKind
  targetId: ID
  authorId: ID
  text: string
  parentId?: ID
  createdAt: string
}

/** A comment enriched with like info for the current viewer, returned by the
 *  backend so the UI never has to resolve likes synchronously. */
export interface CommentView extends Comment {
  likeCount: number
  likedByMe: boolean
}
