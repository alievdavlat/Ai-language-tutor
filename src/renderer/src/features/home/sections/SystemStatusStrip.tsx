import { useState } from 'react'
import type { HardwareProfile, ModelRecommendation, OllamaStatus } from '@shared/types'

interface SystemStatusStripProps {
  hw: HardwareProfile | null
  rec: ModelRecommendation | null
  ollama: OllamaStatus | null
}

export default function SystemStatusStrip({
  hw,
  rec,
  ollama
}: SystemStatusStripProps): JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const running = !!ollama?.running
  const modelCount = ollama?.models.length ?? 0

  return (
    <div className="mt-auto pt-4">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-400 transition-colors group"
        aria-expanded={expanded}
      >
        {/* Status dot */}
        <span
          className={[
            'w-2 h-2 rounded-full shrink-0 transition-colors',
            running ? 'bg-emerald-500' : 'bg-amber-500'
          ].join(' ')}
        />
        <span className="group-hover:text-slate-400">
          {running ? `AI ready · ${modelCount} model${modelCount !== 1 ? 's' : ''}` : 'AI offline'}
        </span>
        <svg
          className={['w-3 h-3 transition-transform', expanded ? 'rotate-180' : ''].join(' ')}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-500 space-y-1 animate-fade-in">
          {hw && (
            <p>
              <span className="text-slate-600">CPU</span>{' '}
              <span className="text-slate-400">{hw.cpuModel}</span>
              <span className="text-slate-600 mx-1.5">·</span>
              <span className="text-slate-400">{hw.totalRamGB} GB RAM</span>
              <span className="text-slate-600 mx-1.5">·</span>
              <span className="capitalize text-slate-400">{hw.recommendedMode} mode</span>
            </p>
          )}
          {rec && (
            <p>
              <span className="text-slate-600">LLM</span>{' '}
              <span className="text-slate-400">{rec.llm.name}</span>
            </p>
          )}
          {ollama && (
            <p>
              <span className="text-slate-600">Ollama</span>{' '}
              <span className={running ? 'text-emerald-500' : 'text-amber-500'}>
                {running ? 'running' : 'offline'}
              </span>
              {running && modelCount > 0 && (
                <span className="text-slate-500 ml-1">
                  · {ollama.models.join(', ')}
                </span>
              )}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
