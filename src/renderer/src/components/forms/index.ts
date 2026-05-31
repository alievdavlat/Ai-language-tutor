/**
 * Shared authoring form library (#A58).
 *
 * One import surface for every create/edit form in the app — multi-step wizard,
 * modal shell, configurable repeatable-item lists, rich-text editor, image /
 * media pickers, and bulk import. Consumed by the entity editors (course, exam,
 * story, lesson, exercise, writing task) and by the Admin CMS (#A56) / Creator
 * Studio (#A46), which build their own forms on top of these primitives.
 *
 *   import { FormModal, Field, RepeatableList, ImagePicker, RichTextEditor,
 *            Input, LevelSelect } from '@/components/forms'
 */

// Layout / chrome
export { default as FormModal } from './FormModal'
export { default as FormWizard } from './FormWizard'
export type { WizardStep } from './FormWizard'
export { default as Field } from './Field'

// Controls
export { default as Select } from './Select'
export type { SelectOption } from './Select'
export { default as PillGroup } from './PillGroup'
export type { PillOption } from './PillGroup'
export { default as OptionCards } from './OptionCards'
export type { OptionCard } from './OptionCards'
export { default as ChipInput } from './ChipInput'
export { default as RepeatableList } from './RepeatableList'

// Media
export { default as ImagePicker } from './ImagePicker'
export { default as MediaPicker } from './MediaPicker'

// Rich text
export { default as RichTextEditor } from './RichTextEditor'
export { default as RichText, sanitizeRichText } from './RichText'
// Read-only renderer alias (lesson/course content view, #A46).
export { default as RichTextView } from './RichText'
// Lesson materials (PDF / audio attachments) field (#A46).
export { default as MaterialsField } from './MaterialsField'

// Bulk import
export { default as BulkImportPanel } from './BulkImportPanel'
export type { BulkImportResult } from './BulkImportPanel'

// Re-exported base primitives so consumers have a single import surface.
export { Input, TextArea, Tabs, Chip, Button, Card } from '../ui'
export type { TabItem } from '../ui'
export { default as LevelSelect } from '../ui/LevelSelect'

// Schema-driven form (Admin CMS #A56). `SelectOption` already exported above
// (from ./Select); the schema form uses FieldDef-internal options.
export { default as SchemaForm, FormField, blankValues, defaultFor } from './SchemaForm'
export type { FieldDef, FieldType, FormValues } from './types'
