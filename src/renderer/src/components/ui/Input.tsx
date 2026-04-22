import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/classnames'

type InputProps = InputHTMLAttributes<HTMLInputElement>

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      {...rest}
      className={cn(
        'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm',
        'placeholder:text-slate-500 focus:border-brand-400 focus:outline-none',
        className
      )}
    />
  )
})

export default Input
