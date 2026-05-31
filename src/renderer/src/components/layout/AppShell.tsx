import { useState } from 'react'
import type { ReactNode } from 'react'
import { useAppStore } from '../../store/useAppStore'
import Sidebar from './Sidebar'
import DockedChat from './DockedChat'
import RetentionNudges from '../../features/retention/RetentionNudges'
import { useDailyReminder } from '../../hooks/useDailyReminder'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps): JSX.Element {
  const profile = useAppStore((s) => s.profile)
  const [collapsed, setCollapsed] = useState(false)
  useDailyReminder()

  return (
    <div className="h-full flex">
      <Sidebar
        profile={profile}
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
      />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">{children}</main>
      <RetentionNudges />
      <DockedChat />
    </div>
  )
}
