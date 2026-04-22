import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/classnames'

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { className, ...rest },
  ref
) {
  return (
    <textarea
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

export default TextArea
