import type { ID } from './platform.types'

export type CommentTargetKind = 'course' | 'video' | 'lesson' | 'book'

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
