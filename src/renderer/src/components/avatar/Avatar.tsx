import Avatar2D from './Avatar2D'
import Avatar3D from './Avatar3D'
import AvatarVRM from './AvatarVRM'
import type { AvatarDispatcherProps } from './types'

export default function Avatar({ mode, vrmUrl, ...props }: AvatarDispatcherProps): JSX.Element {
  if (mode === '3d') {
    return vrmUrl ? <AvatarVRM {...props} modelUrl={vrmUrl} /> : <Avatar3D {...props} />
  }
  return <Avatar2D {...props} />
}
