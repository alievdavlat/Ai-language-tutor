import { useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/classnames'
import { uploadUrl } from '../../services/backend'
import { IconPlus, IconX } from '../icons'
import type { FieldDef, FormValues, SelectOption } from './types'

const COVERS = [
  'from-rose-500 to-pink-700',
  'from-sky-500 to-blue-700',
  'from-violet-500 to-purple-700',
  'from-amber-500 to-orange-700',
  'from-emerald-500 to-teal-700',
  'from-fuchsia-500 to-pink-700',
  'from-cyan-500 to-blue-700',
  'from-indigo-500 to-violet-700'
]

const inputCls =
  'w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none'

function resolveOptions(def: FieldDef): SelectOption[] {
  if (!def.options) return []
  return typeof def.options === 'function' ? def.options() : def.options
}

function Label({ def }: { def: FieldDef }): JSX.Element {
  return (
    <label className="block text-[11px] uppercase tracking-widest text-slate-400 font-bold mb-1.5">
      {def.label}
      {def.required && <span className="text-rose-300 ml-1">*</span>}
    </label>
  )
}

// ─── Individual field renderers ──────────────────────────────────────────────

function TagsInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }): JSX.Element {
  const [draft, setDraft] = useState('')
  const add = (): void => {
    const t = draft.trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setDraft('')
  }
  return (
    <div className="flex flex-wrap gap-1.5 rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1.5">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-md bg-brand-500/20 text-brand-100 text-xs font-semibold px-2 py-0.5">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="text-brand-200/70 hover:text-white">
            <IconX className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            add()
          }
        }}
        onBlur={add}
        placeholder="Type and press Enter"
        className="flex-1 min-w-[8rem] bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none px-1"
      />
    </div>
  )
}

function ImageInput({ def, value, onChange }: { def: FieldDef; value: string; onChange: (v: string) => void }): JSX.Element {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const pick = async (file?: File): Promise<void> => {
    if (!file) return
    setBusy(true)
    try {
      onChange(await uploadUrl(file, def.uploadPrefix ?? 'covers'))
    } catch (err) {
      onChange('')
      window.alert(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 h-14 rounded-lg overflow-hidden border border-white/10 bg-white/[0.04] shrink-0 flex items-center justify-center">
        {value ? <img src={value} alt="" className="w-full h-full object-cover" /> : <span className="text-slate-600 text-xs">none</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 disabled:opacity-50">
            <IconPlus className="w-3.5 h-3.5" /> {busy ? 'Uploading…' : value ? 'Replace' : 'Upload'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')} className="text-xs font-semibold text-rose-300 hover:text-rose-200">
              Remove
            </button>
          )}
        </div>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…or paste an image URL"
          className="mt-1.5 w-full rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-brand-400"
        />
        <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />
      </div>
    </div>
  )
}

function GradientPicker({ value, onChange }: { value: string; onChange: (v: string) => void }): JSX.Element {
  return (
    <div className="flex flex-wrap gap-2">
      {COVERS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn('h-8 w-12 rounded-lg bg-gradient-to-br ring-2 transition', c, value === c ? 'ring-white' : 'ring-transparent hover:ring-white/30')}
          title={c}
        />
      ))}
    </div>
  )
}

function RepeatableField({ def, value, onChange }: { def: FieldDef; value: FormValues[]; onChange: (v: FormValues[]) => void }): JSX.Element {
  const sub = def.fields ?? []
  const blank = (): FormValues => Object.fromEntries(sub.map((f) => [f.name, defaultFor(f)]))
  return (
    <div className="space-y-2">
      {value.map((item, i) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              {def.itemLabel ?? 'Item'} {i + 1}
            </span>
            <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} className="text-slate-500 hover:text-rose-300">
              <IconX className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sub.map((f) => (
              <FormField
                key={f.name}
                def={f}
                value={item[f.name]}
                onChange={(nv) => onChange(value.map((it, k) => (k === i ? { ...it, [f.name]: nv } : it)))}
              />
            ))}
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...value, blank()])} className="text-xs font-bold text-brand-300 hover:text-brand-200 inline-flex items-center gap-1">
        <IconPlus className="w-3.5 h-3.5" /> Add {def.itemLabel ?? 'item'}
      </button>
    </div>
  )
}

export function defaultFor(def: FieldDef): unknown {
  switch (def.type) {
    case 'number':
      return def.min ?? 0
    case 'toggle':
      return false
    case 'tags':
      return []
    case 'repeatable':
      return []
    case 'select':
      return resolveOptions(def)[0]?.value ?? ''
    case 'gradient':
      return COVERS[0]
    default:
      return ''
  }
}

/** Render a single field by its definition. Exported for nested use. */
export function FormField({ def, value, onChange }: { def: FieldDef; value: unknown; onChange: (v: unknown) => void }): JSX.Element | null {
  let control: ReactNode
  switch (def.type) {
    case 'textarea':
      control = (
        <textarea
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
          rows={def.rows ?? 3}
          className={cn(inputCls, 'resize-y')}
        />
      )
      break
    case 'number':
      control = (
        <div className="relative">
          {def.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{def.prefix}</span>}
          <input
            type="number"
            value={value === '' || value === undefined ? '' : (value as number)}
            min={def.min}
            max={def.max}
            step={def.step}
            onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={def.placeholder}
            className={cn(inputCls, def.prefix && 'pl-6')}
          />
        </div>
      )
      break
    case 'select':
      control = (
        <select value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} className={cn(inputCls, 'appearance-none cursor-pointer')}>
          {resolveOptions(def).map((o) => (
            <option key={o.value} value={o.value} className="bg-[#10131f]">
              {o.label}
            </option>
          ))}
        </select>
      )
      break
    case 'toggle':
      control = (
        <button
          type="button"
          onClick={() => onChange(!value)}
          className={cn('relative w-11 h-6 rounded-full transition shrink-0', value ? 'bg-emerald-500' : 'bg-white/15')}
        >
          <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white transition', value ? 'left-[22px]' : 'left-0.5')} />
        </button>
      )
      break
    case 'tags':
      control = <TagsInput value={(value as string[]) ?? []} onChange={onChange} />
      break
    case 'image':
      control = <ImageInput def={def} value={(value as string) ?? ''} onChange={onChange} />
      break
    case 'gradient':
      control = <GradientPicker value={(value as string) ?? COVERS[0]} onChange={onChange} />
      break
    case 'emoji':
      control = (
        <input
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={4}
          placeholder="🙂"
          className="w-16 text-center rounded-lg bg-white/[0.04] border border-white/10 px-2 py-2 text-lg"
        />
      )
      break
    case 'repeatable':
      control = <RepeatableField def={def} value={(value as FormValues[]) ?? []} onChange={(v) => onChange(v)} />
      break
    default:
      control = (
        <input
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={def.placeholder}
          className={inputCls}
        />
      )
  }

  // Toggle reads better with the label inline.
  if (def.type === 'toggle') {
    return (
      <div className={cn(def.full && 'sm:col-span-2')}>
        <div className="flex items-center justify-between rounded-lg bg-white/[0.025] border border-white/10 px-3 py-2.5">
          <div>
            <p className="text-sm font-semibold text-slate-200">{def.label}</p>
            {def.help && <p className="text-[11px] text-slate-500">{def.help}</p>}
          </div>
          {control}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(def.full && 'sm:col-span-2')}>
      <Label def={def} />
      {control}
      {def.help && <p className="text-[11px] text-slate-500 mt-1">{def.help}</p>}
    </div>
  )
}

interface SchemaFormProps {
  fields: FieldDef[]
  value: FormValues
  onChange: (value: FormValues) => void
  className?: string
}

/** Declarative form: renders `fields` into a 2-column grid bound to `value`. */
export default function SchemaForm({ fields, value, onChange, className }: SchemaFormProps): JSX.Element {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-4', className)}>
      {fields
        .filter((f) => !f.when || f.when(value))
        .map((f) => (
          <FormField key={f.name} def={f} value={value[f.name]} onChange={(v) => onChange({ ...value, [f.name]: v })} />
        ))}
    </div>
  )
}

/** Build an initial value object for a field list (used when creating new). */
export function blankValues(fields: FieldDef[]): FormValues {
  return Object.fromEntries(fields.map((f) => [f.name, defaultFor(f)]))
}
