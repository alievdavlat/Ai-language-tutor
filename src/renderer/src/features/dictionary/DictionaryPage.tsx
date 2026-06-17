import { PageHeader } from '../../components/ui'
import { useT } from '../../i18n'
import DictionaryPanel from './DictionaryPanel'

/**
 * Standalone dictionary route (kept for deep-links). The dictionary now also
 * lives as a tab inside Vocabulary — both render the shared DictionaryPanel.
 */
export default function DictionaryPage(): JSX.Element {
  const t = useT()
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6 w-full flex flex-col gap-6">
        <PageHeader
          eyebrow={t('dictionary.eyebrow')}
          title={t('dictionary.title')}
          subtitle={t('dictionary.subtitle')}
        />
        <DictionaryPanel />
      </div>
    </div>
  )
}
