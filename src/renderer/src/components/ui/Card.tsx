import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/classnames'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export default function Card({ children, className, ...rest }: CardProps): JSX.Element {
  return (
    <div
      {...rest}
      className={cn(
        'rounded-2xl bg-white/5 backdrop-blur border border-white/10 p-6 shadow-lg shadow-black/20',
        className
      )}
    >
      {children}
    </div>
  )
}
