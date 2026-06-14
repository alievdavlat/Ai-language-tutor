import { PageHeader } from '../../components/ui'
import DictionaryPanel from './DictionaryPanel'

/**
 * Standalone dictionary route (kept for deep-links). The dictionary now also
 * lives as a tab inside Vocabulary — both render the shared DictionaryPanel.
 */
export default function DictionaryPage(): JSX.Element {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow="Offline dictionary"
          title="Dictionary & phrasebook"
          subtitle="Look up any English word — works offline, with definitions and translations."
        />
        <DictionaryPanel />
      </div>
    </div>
  )
}
