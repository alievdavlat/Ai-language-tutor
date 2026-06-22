import { useAppStore } from '../../store/useAppStore'
import { Card, Spinner, IconBubble } from '../../components/ui'
import { useT } from '../../i18n'

export default function BootPage(): JSX.Element {
  const t = useT()
  const booted = useAppStore((s) => s.booted)
  const bootError = useAppStore((s) => s.bootError)
  const hw = useAppStore((s) => s.hw)

  if (bootError) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Card className="max-w-md">
          <div className="text-3xl mb-2">⚠️</div>
          <h1 className="text-xl font-bold mb-2">{t('spk.startupError')}</h1>
          <p className="text-sm text-slate-400 mb-4">{bootError}</p>
          <p className="text-xs text-slate-500">
            {t('spk.startupErrorHelp')}
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <Card className="max-w-md text-center !p-10 animate-fade-in">
        <div className="mx-auto mb-6 flex items-center justify-center">
          <IconBubble tone="brand" size="lg" className="animate-float">
            🗣
          </IconBubble>
        </div>
        <h1 className="text-3xl font-bold mb-2 tracking-tight">{t('spk.appName')}</h1>
        <p className="text-slate-400 text-sm mb-6">
          {booted ? t('spk.ready') : t('spk.detectingHardware')}
        </p>
        <div className="flex items-center justify-center mb-4">
          <Spinner size="md" />
        </div>
        {hw && (
          <p className="text-xs text-slate-500">
            {hw.cpuModel} · {hw.totalRamGB} GB RAM · {t('spk.mode')}{' '}
            <span className="capitalize text-slate-300">{hw.recommendedMode}</span>
          </p>
        )}
      </Card>
    </div>
  )
}
