import type { ReactNode } from 'react'
import { useAppStore } from '../../store/useAppStore'
import Sidebar from './Sidebar'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps): JSX.Element {
  const profile = useAppStore((s) => s.profile)

  return (
    <div className="h-full flex">
      <Sidebar profile={profile} />
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">{children}</main>
    </div>
  )
}
