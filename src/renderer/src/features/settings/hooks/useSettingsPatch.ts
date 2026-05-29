import { useState } from 'react'
import type { UserProfile, UserSettings } from '@shared/types'
import { useAppStore } from '../../../store/useAppStore'

interface SettingsPatchHook {
  profile: UserProfile | null
  saving: boolean
  patch: (update: Partial<UserSettings>) => Promise<void>
  /** Patch top-level profile fields (e.g. `customCharacters`), not just settings. */
  patchProfile: (update: Partial<UserProfile>) => Promise<void>
}

export function useSettingsPatch(): SettingsPatchHook {
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)
  const [saving, setSaving] = useState(false)

  const patch = async (update: Partial<UserSettings>): Promise<void> => {
    // Read the freshest profile from the store (not a render-captured copy) so
    // two rapid writers can't clobber each other's changes — e.g. saving an AI
    // key and then a model pick must both stick.
    const cur = useAppStore.getState().profile
    if (!cur) return
    setSaving(true)
    const next: UserProfile = {
      ...cur,
      settings: { ...cur.settings, ...update }
    }
    await window.api.profile.save(next)
    setProfile(next)
    setSaving(false)
  }

  const patchProfile = async (update: Partial<UserProfile>): Promise<void> => {
    const cur = useAppStore.getState().profile
    if (!cur) return
    setSaving(true)
    const next: UserProfile = { ...cur, ...update }
    await window.api.profile.save(next)
    setProfile(next)
    setSaving(false)
  }

  return { profile, saving, patch, patchProfile }
}
