/**
 * Resolve a catalog icon name (a string stored in the progress catalogs) to its
 * actual icon component. Keeps the serialisable catalogs free of JSX.
 */
import {
  IconBolt,
  IconBook,
  IconBookmark,
  IconChat,
  IconFlame,
  IconHeart,
  IconLive,
  IconMedal,
  IconMic,
  IconStar,
  IconTarget,
  IconTrophy,
  IconUsers,
  type IconProps
} from '../components/icons'

const MAP: Record<string, (p: IconProps) => JSX.Element> = {
  IconBolt,
  IconBook,
  IconBookmark,
  IconChat,
  IconFlame,
  IconHeart,
  IconLive,
  IconMedal,
  IconMic,
  IconStar,
  IconTarget,
  IconTrophy,
  IconUsers
}

export function iconByName(name: string): (p: IconProps) => JSX.Element {
  return MAP[name] ?? IconStar
}
