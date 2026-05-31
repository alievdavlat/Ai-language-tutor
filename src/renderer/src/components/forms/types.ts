/**
 * Shared, schema-driven form library (#A58). A single `SchemaForm` renders a
 * declarative list of `FieldDef`s into a controlled value object, so every
 * authoring surface (Admin CMS, Creator Studio, teacher forms) describes its
 * fields once instead of hand-rolling inputs. Reused by the Admin console's
 * generic resource manager.
 */
import type { ReactNode } from 'react'

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'toggle'
  | 'tags'
  | 'image'
  | 'gradient'
  | 'emoji'
  | 'repeatable'

export interface SelectOption {
  value: string
  label: string
}

export interface FieldDef {
  name: string
  label: string
  type: FieldType
  /** Helper text under the control. */
  help?: string
  placeholder?: string
  required?: boolean
  /** Span both columns of the form grid. */
  full?: boolean
  /** number bounds. */
  min?: number
  max?: number
  step?: number
  /** textarea rows. */
  rows?: number
  /** Static options, or a getter resolved at render (levels/languages registries). */
  options?: SelectOption[] | (() => SelectOption[])
  /** Storage folder prefix for `image` uploads (covers/avatars/library/…). */
  uploadPrefix?: string
  /** Sub-fields for a `repeatable` group. */
  fields?: FieldDef[]
  /** Singular noun for the repeatable "+ Add" button (e.g. "option"). */
  itemLabel?: string
  /** Render the field only when this predicate passes (depends on sibling values). */
  when?: (values: Record<string, unknown>) => boolean
  /** Decorative prefix shown inside the control (e.g. "$"). */
  prefix?: string
}

export type FormValues = Record<string, unknown>

export interface FieldRenderProps {
  def: FieldDef
  value: unknown
  onChange: (value: unknown) => void
}

export type FieldRenderer = (props: FieldRenderProps) => ReactNode
