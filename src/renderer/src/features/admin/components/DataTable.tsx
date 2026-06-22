/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from 'react'
import { useT } from '../../../i18n'
import { cn } from '../../../lib/classnames'

export interface Column {
  key: string
  label: string
  render: (row: any) => ReactNode
  cls?: string
}

interface DataTableProps {
  columns: Column[]
  rows: any[]
  rowId: (row: any) => string
  /** Right-aligned per-row actions revealed on hover. */
  actions?: (row: any) => ReactNode
  onRowClick?: (row: any) => void
  empty?: ReactNode
}

/**
 * Dense, sticky-header table for the Admin console — monospace ids, hover row
 * highlight, hover-revealed actions. Built for scanning hundreds of rows.
 */
export default function DataTable({ columns, rows, rowId, actions, onRowClick, empty }: DataTableProps): JSX.Element {
  const t = useT()
  if (rows.length === 0) {
    return <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.015] py-16 text-center text-sm text-slate-500">{empty ?? t('admc.noRecords')}</div>
  }
  return (
    <div className="rounded-xl border border-white/[0.07] overflow-hidden bg-white/[0.015]">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.07] bg-white/[0.02]">
            {columns.map((c) => (
              <th key={c.key} className={cn('text-left font-semibold text-[10px] uppercase tracking-widest text-slate-500 px-3 py-2.5', c.cls)}>
                {c.label}
              </th>
            ))}
            {actions && <th className="w-px px-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.05]">
          {rows.map((row) => (
            <tr
              key={rowId(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn('group transition-colors', onRowClick && 'cursor-pointer hover:bg-white/[0.035]')}
            >
              {columns.map((c) => (
                <td key={c.key} className={cn('px-3 py-2.5 align-middle text-slate-300', c.cls)}>
                  {c.render(row)}
                </td>
              ))}
              {actions && (
                <td className="px-3 py-2.5 text-right whitespace-nowrap">
                  <div className="inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    {actions(row)}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
