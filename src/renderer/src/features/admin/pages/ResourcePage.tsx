/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react'
import { cn } from '../../../lib/classnames'
import { IconPlus, IconSearch, IconPencil, IconX, IconDownload } from '../../../components/icons'
import { SchemaForm, blankValues, type FormValues } from '../../../components/forms'
import type { ResourceDef } from '../resources'
import DataTable from '../components/DataTable'
import Drawer from '../components/Drawer'
import BulkImportModal from '../components/BulkImportModal'

interface EditState {
  row: any | null
}

export default function ResourcePage({ def }: { def: ResourceDef }): JSX.Element {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<EditState | null>(null)
  const [form, setForm] = useState<FormValues>({})
  const [saving, setSaving] = useState(false)
  const [bulk, setBulk] = useState(false)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const refresh = (): void => {
    setLoading(true)
    Promise.resolve(def.load())
      .then((r) => setRows(r))
      .finally(() => setLoading(false))
  }
  // Reload whenever the active resource changes.
  useEffect(refresh, [def.key]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return rows
    return rows.filter((r) => def.search(r).toLowerCase().includes(term))
  }, [rows, q, def])

  const openNew = (): void => {
    setEdit({ row: null })
    if (def.fields) setForm(blankValues(def.fields))
  }
  const openEdit = (row: any): void => {
    setEdit({ row })
    if (def.fields) setForm(def.toForm ? def.toForm(row) : {})
  }
  const close = (): void => setEdit(null)

  const requiredOk = !def.fields
    ? true
    : def.fields.filter((f) => f.required).every((f) => String(form[f.name] ?? '').trim().length > 0)

  const submit = async (): Promise<void> => {
    if (!def.save || !requiredOk) return
    setSaving(true)
    try {
      await def.save(form, edit?.row ?? null)
      close()
      refresh()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const doDelete = async (row: any): Promise<void> => {
    if (!def.remove) return
    try {
      await def.remove(row)
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'Delete failed')
    }
    setConfirmId(null)
    refresh()
  }

  const builtInCount = def.isBuiltIn ? rows.filter((r) => def.isBuiltIn!(r)).length : 0

  return (
    <div className="flex flex-col gap-5">
      {/* Header + toolbar */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-slate-400">{def.icon}</span> {def.label}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">{def.blurb}</p>
        </div>
        <div className="flex items-center gap-2">
          {def.bulkImport && (
            <button onClick={() => setBulk(true)} className="rounded-lg border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] px-3 py-2 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5">
              <IconDownload className="w-3.5 h-3.5" /> Bulk import
            </button>
          )}
          <button onClick={openNew} className="rounded-lg bg-brand-500 hover:bg-brand-400 px-3.5 py-2 text-xs font-bold text-white inline-flex items-center gap-1.5">
            <IconPlus className="w-3.5 h-3.5" /> New {def.singular}
          </button>
        </div>
      </div>

      {/* Search + count */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${def.label.toLowerCase()}…`}
            className="w-full rounded-lg bg-white/[0.04] border border-white/10 pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-brand-400 focus:outline-none"
          />
        </div>
        <span className="text-xs text-slate-500 tabular-nums">
          {loading ? 'Loading…' : `${filtered.length} of ${rows.length}`}
          {builtInCount > 0 && <span className="text-slate-600"> · {builtInCount} built-in</span>}
        </span>
      </div>

      <DataTable
        columns={def.columns}
        rows={filtered}
        rowId={def.rowId}
        onRowClick={openEdit}
        empty={`No ${def.label.toLowerCase()} yet. Create the first one.`}
        actions={(row) => (
          <>
            <button onClick={() => openEdit(row)} title="Edit" className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white">
              <IconPencil className="w-3.5 h-3.5" />
            </button>
            {def.remove && (
              confirmId === def.rowId(row) ? (
                <span className="inline-flex items-center gap-1">
                  <button onClick={() => void doDelete(row)} className="rounded-md bg-rose-500/20 text-rose-200 px-2 py-1 text-[11px] font-bold">Delete</button>
                  <button onClick={() => setConfirmId(null)} className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-slate-400"><IconX className="w-3.5 h-3.5" /></button>
                </span>
              ) : (
                <button onClick={() => setConfirmId(def.rowId(row))} title="Delete" className="w-7 h-7 rounded-md hover:bg-rose-500/15 flex items-center justify-center text-slate-400 hover:text-rose-300">
                  <IconX className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </>
        )}
      />

      {def.isBuiltIn && builtInCount > 0 && (
        <p className="text-[11px] text-slate-600">
          Built-in seed {def.label.toLowerCase()} re-appear after a reload even if deleted — edit them instead to customize.
        </p>
      )}

      {/* Editor — bespoke modal for nested entities, else schema drawer */}
      {edit && def.customEditor && def.customEditor({ initial: edit.row, onClose: close, onSaved: () => { close(); refresh() } })}
      {edit && !def.customEditor && def.fields && (
        <Drawer
          open
          title={edit.row ? `Edit ${def.singular}` : `New ${def.singular}`}
          subtitle={def.blurb}
          onClose={close}
          width="lg"
          footer={
            <>
              <button onClick={close} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-white/[0.06]">Cancel</button>
              <button onClick={() => void submit()} disabled={!requiredOk || saving} className={cn('rounded-lg px-5 py-2 text-sm font-bold bg-brand-500 text-white hover:bg-brand-400 disabled:opacity-50')}>
                {saving ? 'Saving…' : edit.row ? 'Save changes' : `Create ${def.singular}`}
              </button>
            </>
          }
        >
          <SchemaForm fields={def.fields} value={form} onChange={setForm} />
        </Drawer>
      )}

      {bulk && def.bulkImport && (
        <BulkImportModal singular={def.singular} onImport={def.bulkImport} onClose={() => setBulk(false)} onDone={refresh} />
      )}
    </div>
  )
}
