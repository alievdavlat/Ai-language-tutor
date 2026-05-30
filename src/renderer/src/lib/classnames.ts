import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Standard `cn` — clsx (handles strings, arrays, objects, conditionals) merged
 * through tailwind-merge so conflicting Tailwind classes resolve correctly
 * (e.g. `px-2 px-4` → `px-4`). Drop-in compatible with the old join-based cn,
 * and required by copy-paste component libraries (shadcn / Aceternity / Magic UI).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
