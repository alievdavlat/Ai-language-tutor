export type AvatarMode = '2d' | '3d'
export type AvatarEmotion = 'neutral' | 'happy' | 'thinking' | 'concerned'

export interface AvatarProps {
  mouthOpen: number // 0..1
  emotion?: AvatarEmotion
  name?: string
}

export interface AvatarDispatcherProps extends AvatarProps {
  mode: AvatarMode
}
