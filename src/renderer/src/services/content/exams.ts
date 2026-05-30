/**
 * Question banks for unit checkpoints (per exam-lesson) and the course final
 * exam. Both are graded client-side; results persist via the content store and
 * gate progression / certificates (see courseModel.ts).
 */

export interface MCQ {
  q: string
  options: string[]
  answer: number // index into options
}

// ── Per-unit checkpoint quizzes (keyed by the exam lesson id) ────────────────

const CHECKPOINTS: Record<string, MCQ[]> = {
  l_everyday_1_4: [
    { q: 'A natural reply to "How are you?" is…', options: ['"How do you do."', '"I\'m good, thanks — how about you?"', '"Yes."', '"Goodbye."'], answer: 1 },
    { q: 'Which is a casual greeting?', options: ['Good morning', 'How do you do', 'Hey, what\'s up?', 'I am pleased to meet you'], answer: 2 },
    { q: 'To introduce yourself you can say…', options: ['"I\'m Sam, nice to meet you."', '"It rains."', '"Where is it?"', '"They were."'], answer: 0 },
    { q: 'Small talk topics usually include…', options: ['Salary and politics', 'The weather and weekend plans', 'Private health details', 'Nothing at all'], answer: 1 }
  ],
  l_everyday_2_4: [
    { q: '"For here or to go?" is asked by…', options: ['A doctor', 'A café worker', 'A pilot', 'A teacher'], answer: 1 },
    { q: 'A polite way to order is…', options: ['"Give me coffee."', '"I\'d like a latte, please."', '"Coffee now."', '"You — coffee."'], answer: 1 },
    { q: '"That\'s all, thanks" means…', options: ['I want more', 'I\'m finished ordering', 'I\'m leaving the country', 'I\'m confused'], answer: 1 }
  ],
  l_ielts_1_4: [
    { q: 'IELTS Speaking Part 1 lasts about…', options: ['30 seconds', '4–5 minutes', '20 minutes', '1 hour'], answer: 1 },
    { q: 'Best Part 1 answer length is…', options: ['One word', '2–3 sentences with a reason', 'A 5-minute speech', 'Silence'], answer: 1 },
    { q: 'Part 1 topics are usually…', options: ['Highly technical', 'Familiar — home, work, hobbies', 'Always about politics', 'Random maths'], answer: 1 }
  ],
  l_ielts_2_3: [
    { q: 'In Part 2 you speak for…', options: ['10 seconds', '1–2 minutes', '15 minutes', 'As long as you like'], answer: 1 },
    { q: 'The cue card gives you…', options: ['The exact words to say', 'A topic and points to cover', 'Your final score', 'A dictionary'], answer: 1 },
    { q: 'Preparation time before Part 2 is…', options: ['None', 'About 1 minute', '10 minutes', '1 hour'], answer: 1 }
  ],
  l_business_1_3: [
    { q: 'A good business email opens with…', options: ['A joke', 'The purpose of the email', 'Your life story', 'Nothing'], answer: 1 },
    { q: 'A polite request phrase is…', options: ['"Do it now."', '"Could you please…"', '"You must."', '"Whatever."'], answer: 1 },
    { q: 'A formal sign-off is…', options: ['"Later!"', '"Best regards"', '"xoxo"', '"k thx"'], answer: 1 }
  ],
  l_business_2_2: [
    { q: 'To interrupt politely in a meeting you say…', options: ['"Shut up."', '"Sorry, may I add something?"', '"No."', 'Nothing, just talk over'], answer: 1 },
    { q: 'A meeting usually ends with…', options: ['A summary and next steps', 'A song', 'A test', 'A meal'], answer: 0 }
  ],
  l_pronun_1_3: [
    { q: 'The "th" in "this" is…', options: ['Voiceless /θ/', 'Voiced /ð/', 'A vowel', 'Silent'], answer: 1 },
    { q: 'For "th" your tongue goes…', options: ['Behind the teeth', 'Between the teeth', 'Up to the roof', 'Outside the lips'], answer: 1 },
    { q: '"think" and "sink" are…', options: ['The same word', 'A minimal pair', 'Both nouns', 'Past tense'], answer: 1 }
  ],
  l_egiu_1_4: [
    { q: 'Choose the present continuous: "Please be quiet, I ___ ."', options: ['work', 'am working', 'worked', 'works'], answer: 1 },
    { q: 'Present simple of "she" + go is…', options: ['she go', 'she goes', 'she going', 'she gone'], answer: 1 },
    { q: '"The earth ___ round the sun."', options: ['is going', 'goes', 'went', 'go'], answer: 1 }
  ],
  l_egiu_2_3: [
    { q: 'Past simple of "go" is…', options: ['goed', 'went', 'gone', 'going'], answer: 1 },
    { q: '"I ___ home when it started to rain."', options: ['was walking', 'walk', 'am walking', 'walks'], answer: 0 },
    { q: 'Past simple regular verbs add…', options: ['-ing', '-ed', '-s', '-er'], answer: 1 }
  ]
}

// ── Course final exams (keyed by courseId) ───────────────────────────────────

const FINALS: Record<string, MCQ[]> = {
  c_everyday: [
    { q: 'Best response to "Nice to meet you"?', options: ['"Nice to meet you too."', '"No."', '"For here."', '"It rains."'], answer: 0 },
    { q: 'Ordering politely:', options: ['"Coffee."', '"I\'d like a coffee, please."', '"Give coffee."', '"You coffee."'], answer: 1 },
    { q: 'Casual greeting:', options: ['"How do you do."', '"Hey!"', '"Good evening, sir."', '"Farewell."'], answer: 1 },
    { q: 'Keep small talk going by…', options: ['Asking a follow-up question', 'Staying silent', 'Walking away', 'Checking your phone'], answer: 0 },
    { q: '"For here or to go?" relates to…', options: ['A flight', 'A café order', 'An exam', 'A greeting'], answer: 1 }
  ],
  c_ielts7: [
    { q: 'Part 1 answers should be…', options: ['One word', 'Extended with reasons', 'Memorised essays', 'In your own language'], answer: 1 },
    { q: 'Part 2 speaking time:', options: ['1–2 minutes', '10 seconds', '30 minutes', 'Unlimited'], answer: 0 },
    { q: 'The cue card provides…', options: ['Your score', 'A topic + points', 'The answers', 'Nothing'], answer: 1 },
    { q: 'Fluency means…', options: ['Speaking with no pauses ever', 'Speaking smoothly and naturally', 'Speaking very fast', 'Using rare words only'], answer: 1 },
    { q: 'A good way to extend an answer:', options: ['Give an example', 'Repeat the question', 'Say "I don\'t know"', 'Change topic'], answer: 0 }
  ],
  c_business: [
    { q: 'Open a business email with…', options: ['The purpose', 'A joke', 'Your weekend', 'Emojis'], answer: 0 },
    { q: 'Polite request:', options: ['"Could you please…"', '"Do it."', '"Now."', '"Whatever."'], answer: 0 },
    { q: 'Interrupt politely:', options: ['"Sorry, may I add…"', '"Stop."', 'Talk over them', 'Leave'], answer: 0 },
    { q: 'Formal sign-off:', options: ['"Best regards"', '"cya"', '"lol"', '"bye now"'], answer: 0 }
  ],
  c_pronun: [
    { q: 'Voiced "th" appears in…', options: ['think', 'this', 'three', 'bath'], answer: 1 },
    { q: 'Tongue position for "th":', options: ['Between teeth', 'Behind teeth', 'Roof of mouth', 'Lips'], answer: 0 },
    { q: 'Word stress changes…', options: ['Meaning and clarity', 'Nothing', 'Only spelling', 'Grammar tense'], answer: 0 }
  ],
  c_egiu: [
    { q: 'Present continuous:', options: ['I work', 'I am working', 'I worked', 'I will work'], answer: 1 },
    { q: 'Present simple (she):', options: ['she go', 'she goes', 'she going', 'she gone'], answer: 1 },
    { q: 'Past simple of "see":', options: ['seed', 'saw', 'seen', 'sawed'], answer: 1 },
    { q: 'Past continuous:', options: ['I walk', 'I was walking', 'I walked', 'I walks'], answer: 1 },
    { q: '"Water ___ at 100°C."', options: ['boil', 'boils', 'is boiling', 'boiled'], answer: 1 }
  ]
}

export function getCheckpointQuiz(lessonId: string): MCQ[] {
  return CHECKPOINTS[lessonId] ?? [
    { q: 'This checkpoint confirms you completed the unit. Ready to continue?', options: ['Yes', 'No'], answer: 0 }
  ]
}

export function getFinalExam(courseId: string): MCQ[] {
  return FINALS[courseId] ?? []
}

export function hasFinalExam(courseId: string): boolean {
  return (FINALS[courseId]?.length ?? 0) > 0
}
