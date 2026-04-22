import type { ReactNode } from 'react'
import Card from './Card'
import IconBubble, { type IconBubbleTone } from './IconBubble'

interface StatTileProps {
  label: string
  value: ReactNode
  sublabel?: string
  icon?: ReactNode
  tone?: IconBubbleTone
}

export default function StatTile({
  label,
  value,
  sublabel,
  icon,
  tone = 'brand'
}: StatTileProps): JSX.Element {
  return (
    <Card className="flex items-center gap-4">
      {icon && (
        <IconBubble tone={tone} size="lg">
          {icon}
        </IconBubble>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-2xl font-bold truncate">{value}</p>
        {sublabel && <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>}
      </div>
    </Card>
  )
}
