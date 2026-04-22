export default function TypingDots(): JSX.Element {
  return (
    <span className="inline-flex gap-1" aria-label="Assistant is typing">
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-pulse" />
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-pulse [animation-delay:200ms]" />
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-pulse [animation-delay:400ms]" />
    </span>
  )
}
