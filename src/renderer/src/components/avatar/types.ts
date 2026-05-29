export type AvatarMode = '2d' | '3d'
export type AvatarEmotion = 'neutral' | 'happy' | 'thinking' | 'concerned'

export interface AvatarAppearance {
  skinTone?: string
  hairColor?: string
  hairStyle?: 'short' | 'long' | 'bun' | 'bald'
  eyeColor?: string
  outfitColor?: string
}

export interface AvatarProps {
  mouthOpen: number // 0..1
  emotion?: AvatarEmotion
  name?: string
  /** Phase 12 fix — drives the procedural 3D avatar so each companion looks distinct. */
  appearance?: AvatarAppearance
}

export interface AvatarDispatcherExtras {
  /**
   * Phase 12 — when set and `mode === '3d'`, render a VRM model instead of the
   * procedural avatar. Falls back to procedural automatically on load failure.
   */
  vrmUrl?: string
}

export interface AvatarDispatcherProps extends AvatarProps, AvatarDispatcherExtras {
  mode: AvatarMode
}
