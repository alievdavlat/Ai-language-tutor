import { useState } from 'react'
import type { UserProfile, UserSettings } from '@shared/types'
import { useAppStore } from '../../../store/useAppStore'

interface SettingsPatchHook {
  profile: UserProfile | null
  saving: boolean
  patch: (update: Partial<UserSettings>) => Promise<void>
}

export function useSettingsPatch(): SettingsPatchHook {
  const { profile, setProfile } = useAppStore()
  const [saving, setSaving] = useState(false)

  const patch = async (update: Partial<UserSettings>): Promise<void> => {
    if (!profile) return
    setSaving(true)
    const next: UserProfile = {
      ...profile,
      settings: { ...profile.settings, ...update }
    }
    await window.api.profile.save(next)
    setProfile(next)
    setSaving(false)
  }

  return { profile, saving, patch }
}
