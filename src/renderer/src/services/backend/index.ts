/**
 * Single entry point for all platform data. Replace `localBackend` with a
 * Supabase impl (services/backend/supabase.ts) to go live — every renderer
 * page already imports through this file.
 */
import { localBackend } from './local'

export const backend = localBackend
export type { Backend, CourseFilter, ID } from './types'
