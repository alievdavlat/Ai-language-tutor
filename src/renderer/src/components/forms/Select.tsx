import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '../../lib/classnames'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  options: readonly SelectOption[]
  /** Placeholder shown as a disabled first option when value is empty. */
  placeholder?: string
}

/** Dark-styled native select, matching the shared Input chrome. (#A58) */
const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, placeholder, className, ...rest },
  ref
) {
  return (
    <select
      ref={ref}
      {...rest}
      className={cn(
        'w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white',
        'focus:border-brand-400 focus:outline-none',
        className
      )}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#14182a] text-white">
          {o.label}
        </option>
      ))}
    </select>
  )
})

export default Select
