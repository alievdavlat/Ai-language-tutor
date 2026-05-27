/**
 * Inline SVG icon components — zero external deps, tree-shakeable.
 * All icons share the same `{ className?: string }` prop signature so they
 * can be swapped interchangeably. Default size comes from the className caller.
 */
export type IconProps = { className?: string }

export function IconHome({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h4a1 1 0 001-1v-3h2v3a1 1 0 001 1h4a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
    </svg>
  )
}

export function IconMic({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
    </svg>
  )
}

export function IconBook({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
    </svg>
  )
}

export function IconPencil({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  )
}

export function IconChart({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
    </svg>
  )
}

export function IconGear({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
    </svg>
  )
}

export function IconChevronLeft({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

export function IconChevronRight({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
    </svg>
  )
}

export function IconPhone({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
  )
}

export function IconX({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

export function IconCheck({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

export function IconPlay({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.34-5.89a1.5 1.5 0 000-2.54L6.3 2.84z" clipRule="evenodd" />
    </svg>
  )
}

export function IconVolume({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 5.343a1 1 0 011.414 0A6 6 0 0118 10a6 6 0 01-1.929 4.657 1 1 0 01-1.414-1.414A4 4 0 0016 10a4 4 0 00-1.343-2.243 1 1 0 010-1.414z" />
    </svg>
  )
}

export function IconBookmark({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
    </svg>
  )
}

export function IconStar({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M9.05 2.927c.3-.921 1.6-.921 1.9 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.069 10.8c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.518-4.674z" />
    </svg>
  )
}

export function IconFlame({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
    </svg>
  )
}

export function IconLock({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
    </svg>
  )
}

export function IconPlus({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
  )
}

export function IconArrowRight({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

export function IconSearch({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
  )
}

export function IconHeadphones({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M10 2a7 7 0 00-7 7v4a3 3 0 003 3h1v-6H5V9a5 5 0 0110 0v1h-2v6h1a3 3 0 003-3V9a7 7 0 00-7-7z" />
    </svg>
  )
}

export function IconTrophy({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M4 3a1 1 0 00-1 1v1a3 3 0 002.5 2.96A4.002 4.002 0 009 10.9V13H7a1 1 0 100 2h6a1 1 0 100-2h-2v-2.1a4.002 4.002 0 003.5-2.94A3 3 0 0017 5V4a1 1 0 00-1-1H4zm1 2.83V5h1.17A3.01 3.01 0 005 5.83zM14.83 5H15v.83A3.01 3.01 0 0014.83 5z" />
    </svg>
  )
}

export function IconHeart({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
  )
}

export function IconChat({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-2.69-.41l-3.06 1.04a.5.5 0 01-.64-.64l1.04-3.06A6.45 6.45 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7z" clipRule="evenodd" />
    </svg>
  )
}

export function IconLibrary({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M3 3a1 1 0 011-1h2a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zM8 3a1 1 0 011-1h2a1 1 0 011 1v14a1 1 0 01-1 1H9a1 1 0 01-1-1V3zM13.83 4.4a1 1 0 011.27-.63l1.9.66a1 1 0 01.62 1.27l-3.6 10.38a1 1 0 01-1.27.62l-.74-.25 1.82-12.05.0z" />
    </svg>
  )
}

export function IconTarget({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 2.5a5.5 5.5 0 110 11 5.5 5.5 0 010-11zm0 2.5a3 3 0 100 6 3 3 0 000-6zm0 2a1 1 0 110 2 1 1 0 010-2z" clipRule="evenodd" />
    </svg>
  )
}

export function IconMasks({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M4 3h8a1 1 0 011 1v5a5 5 0 01-10 0V4a1 1 0 011-1zm2.5 3a.75.75 0 100 1.5.75.75 0 000-1.5zm3 0a.75.75 0 100 1.5.75.75 0 000-1.5zM6 9.2c.7.6 1.5.9 2 .9s1.3-.3 2-.9c-.3.7-1.1 1.3-2 1.3s-1.7-.6-2-1.3zM15 7h1a1 1 0 011 1v3a4 4 0 01-4.4 3.98A6 6 0 0015 9V7z" />
    </svg>
  )
}

export function IconBolt({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M11.3 1.046a1 1 0 01.7 1.19L10.4 8h4.6a1 1 0 01.78 1.625l-7 8.75a1 1 0 01-1.76-.86L8.6 12H4a1 1 0 01-.78-1.625l7-8.75a1 1 0 011.08-.579z" clipRule="evenodd" />
    </svg>
  )
}

export function IconMedal({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M6.5 2h7l-2.2 5.2a4 4 0 10-2.6 0L6.5 2zM10 9a3 3 0 100 6 3 3 0 000-6zm0 1.6l.65 1.32 1.46.21-1.05 1.03.25 1.45L10 13.93l-1.31.68.25-1.45-1.05-1.03 1.46-.21L10 10.6z" />
    </svg>
  )
}

export function IconRefresh({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7 7 0 0111.601 2.566 1 1 0 11-1.885.666A5 5 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.184 8.448a1 1 0 01.929 1.07A5 5 0 0014 13.001H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7 7 0 01-11.601-2.566 1 1 0 01.785-1.886z" clipRule="evenodd" />
    </svg>
  )
}

export function IconClipboard({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M8 2a2 2 0 00-2 2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2h-1a2 2 0 00-2-2H8zm0 2h4v1H8V4zm-1 6.5a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm1 2.5a1 1 0 100 2h2a1 1 0 100-2H8z" />
    </svg>
  )
}

export function IconPencilEdit({ className }: IconProps): JSX.Element {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  )
}
