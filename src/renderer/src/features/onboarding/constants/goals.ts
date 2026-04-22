import type { LearningGoal } from '@shared/types'

export interface GoalOption {
  id: LearningGoal
  emoji: string
  title: string
  desc: string
}

export const GOAL_OPTIONS: readonly GoalOption[] = [
  { id: 'travel', emoji: '✈️', title: 'Travel', desc: 'Order food, ask directions, small talk' },
  { id: 'work', emoji: '💼', title: 'Work / Career', desc: 'Meetings, emails, job interviews' },
  { id: 'ielts', emoji: '📝', title: 'IELTS', desc: 'Test prep, all 4 skills' },
  { id: 'toefl', emoji: '🎓', title: 'TOEFL', desc: 'Academic English, test prep' },
  {
    id: 'immigration',
    emoji: '🛂',
    title: 'Immigration',
    desc: 'Visa, interviews, daily life abroad'
  },
  { id: 'school', emoji: '🏫', title: 'School / Studies', desc: 'Classroom, assignments, essays' },
  { id: 'hobby', emoji: '🎮', title: 'Hobby / Fun', desc: 'Movies, music, casual chats' },
  { id: 'general', emoji: '🌍', title: 'General fluency', desc: 'Overall speaking confidence' }
] as const
