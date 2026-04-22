import Avatar2D from './Avatar2D'
import Avatar3D from './Avatar3D'
import type { AvatarDispatcherProps } from './types'

export default function Avatar({ mode, ...props }: AvatarDispatcherProps): JSX.Element {
  return mode === '3d' ? <Avatar3D {...props} /> : <Avatar2D {...props} />
}
