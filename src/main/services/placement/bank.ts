import type { PlacementQuestion } from '@shared/types'

export function staticPlacementBank(): PlacementQuestion[] {
  return [
    {
      id: 'q1',
      type: 'multiple-choice',
      levelTarget: 'A1',
      prompt: 'She ___ a student.',
      options: ['am', 'is', 'are', 'be'],
      correctAnswer: 'is',
      topic: 'be-verb'
    },
    {
      id: 'q2',
      type: 'multiple-choice',
      levelTarget: 'A2',
      prompt: 'Yesterday I ___ to the park with my friends.',
      options: ['go', 'went', 'gone', 'going'],
      correctAnswer: 'went',
      topic: 'past-simple'
    },
    {
      id: 'q3',
      type: 'multiple-choice',
      levelTarget: 'A2',
      prompt: 'There ___ much milk left in the fridge.',
      options: ["isn't", "aren't", "doesn't", "haven't"],
      correctAnswer: "isn't",
      topic: 'quantifiers'
    },
    {
      id: 'q4',
      type: 'multiple-choice',
      levelTarget: 'B1',
      prompt: 'If it ___ tomorrow, we will stay at home.',
      options: ['will rain', 'rains', 'rain', 'rained'],
      correctAnswer: 'rains',
      topic: 'first-conditional'
    },
    {
      id: 'q5',
      type: 'multiple-choice',
      levelTarget: 'B1',
      prompt: 'I have lived here ___ five years.',
      options: ['since', 'for', 'during', 'from'],
      correctAnswer: 'for',
      topic: 'present-perfect'
    },
    {
      id: 'q6',
      type: 'multiple-choice',
      levelTarget: 'B2',
      prompt: 'If I had known earlier, I ___ differently.',
      options: ['would act', 'would have acted', 'will act', 'acted'],
      correctAnswer: 'would have acted',
      topic: 'third-conditional'
    },
    {
      id: 'q7',
      type: 'multiple-choice',
      levelTarget: 'B2',
      prompt: 'The report ___ by the committee before the deadline.',
      options: ['reviewed', 'was reviewed', 'has reviewing', 'is review'],
      correctAnswer: 'was reviewed',
      topic: 'passive-voice'
    },
    {
      id: 'q8',
      type: 'multiple-choice',
      levelTarget: 'C1',
      prompt: 'Scarcely ___ the door when the phone rang.',
      options: ['I had opened', 'had I opened', 'I opened', 'did I open'],
      correctAnswer: 'had I opened',
      topic: 'inversion'
    },
    {
      id: 'q9',
      type: 'multiple-choice',
      levelTarget: 'C1',
      prompt: 'He insisted ___ to the meeting himself.',
      options: ['to go', 'on going', 'going', 'that he goes'],
      correctAnswer: 'on going',
      topic: 'prepositions-verbs'
    },
    {
      id: 'q10',
      type: 'open-ended',
      levelTarget: 'B1',
      prompt: 'Tell me briefly about your last weekend. What did you do?',
      topic: 'speaking-sample'
    }
  ]
}
