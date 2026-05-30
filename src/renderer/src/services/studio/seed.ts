/**
 * Seed data for the studio store so teacher/admin pages feel populated on first
 * launch. Ids reference the backend seed (u_emma/u_james/u_marco teachers,
 * c_ielts7/c_everyday/c_business/c_pronun courses, u_priya/u_wei/u_yui students).
 */
import type {
  DownloadItem,
  FeaturedSlot,
  InteractiveLesson,
  Order,
  Payout,
  Report,
  ShortClip,
  Subscription
} from '@shared/types/studio.types'

const t = (mins = 0): string => new Date(Date.now() - mins * 60_000).toISOString()
const days = (d: number): string => t(d * 60 * 24)

export const SEED_LESSONS: InteractiveLesson[] = [
  {
    id: 'lsn_pasttense',
    teacherId: 'u_emma',
    courseId: 'c_everyday',
    title: 'How storytellers use the past simple',
    targetLanguage: 'en',
    level: 'A2',
    video: { source: 'youtube', youtubeId: 'oRdxUFDoQe0', startSec: 12, endSec: 240, title: 'The power of storytelling' },
    letsBegin:
      'Great stories pull you in with vivid past events. In this lesson we will notice how speakers use the **past simple** to narrate — and you will tell a short story of your own.',
    think: [
      {
        id: 'q1',
        kind: 'mcq',
        prompt: 'Which sentence is in the past simple?',
        options: ['I am walking to school.', 'I walked to school.', 'I will walk to school.', 'I have been walking.'],
        answerIndex: 1,
        hint: 'Past simple = base verb + -ed (for regular verbs).'
      },
      {
        id: 'q2',
        kind: 'mcq',
        prompt: 'What is the past simple of "to go"?',
        options: ['goed', 'gone', 'went', 'going'],
        answerIndex: 2,
        hint: '"Go" is irregular.'
      },
      {
        id: 'q3',
        kind: 'open',
        prompt: 'Write two sentences about something you did yesterday, using the past simple.',
        sampleAnswer: 'Yesterday I cooked dinner for my family. After that, I watched a movie.'
      }
    ],
    digDeeper:
      'Regular verbs add **-ed**. Common irregulars: go→went, have→had, see→saw, make→made, take→took.\n\nWatch how natives drop into the past simple the moment a story begins.',
    discuss: 'Tell the group about the best trip you ever took. What happened? Use at least five past-simple verbs.',
    andFinally: 'Record a 60-second story about your weekend and post it to the community for feedback.',
    targetVocab: ['went', 'saw', 'took', 'made', 'arrived', 'decided'],
    grammarFocus: 'Past simple (regular + irregular)',
    fillBlank: {
      text: 'Last summer we [[traveled]] to the coast. We [[swam]] every morning and [[ate]] fresh seafood.',
      instructions: 'Fill the blanks with the correct past-simple verb.'
    },
    status: 'published',
    shareId: 'lx_pasttense',
    createdAt: days(20),
    updatedAt: days(6),
    views: 1840,
    completions: 1210
  },
  {
    id: 'lsn_ieltscue',
    teacherId: 'u_james',
    courseId: 'c_ielts7',
    title: 'IELTS Part 2: structure a 2-minute talk',
    targetLanguage: 'en',
    level: 'B1',
    video: { source: 'youtube', youtubeId: 'V7wseiR5xtw', startSec: 0, endSec: 180, title: 'IELTS Speaking Part 2 model' },
    letsBegin: 'The cue card scares everyone. We will break a 2-minute talk into four moves you can reuse for any topic.',
    think: [
      {
        id: 'q1',
        kind: 'mcq',
        prompt: 'How long should you speak in Part 2?',
        options: ['30 seconds', '1–2 minutes', '5 minutes', 'As long as possible'],
        answerIndex: 1
      },
      {
        id: 'q2',
        kind: 'open',
        prompt: 'Describe a person who influenced you. Use the four-move structure (who → what → why → reflection).'
      }
    ],
    digDeeper: 'Four moves: **set the scene → key details → why it matters → a closing reflection.** Buy time with "Well, let me think…".',
    discuss: 'Swap cue cards with a partner and give each other a 2-minute talk. Score with the band descriptors.',
    andFinally: 'Book a mock with the AI examiner and aim for a band-7 fluency note.',
    targetVocab: ['memorable', 'influential', 'in hindsight', 'looking back', 'genuinely'],
    grammarFocus: 'Discourse markers for fluency',
    status: 'draft',
    createdAt: days(3),
    updatedAt: days(1),
    views: 0,
    completions: 0
  }
]

export const SEED_ORDERS: Order[] = [
  { id: 'ord_1', buyerId: 'u_priya', teacherId: 'u_james', courseId: 'c_ielts7', kind: 'course', amountUsd: 29, provider: 'payme', status: 'paid', createdAt: days(2) },
  { id: 'ord_2', buyerId: 'u_wei', teacherId: 'u_james', courseId: 'c_ielts7', kind: 'course', amountUsd: 29, provider: 'click', status: 'paid', createdAt: days(9) },
  { id: 'ord_3', buyerId: 'u_yui', teacherId: 'u_emma', courseId: 'c_business', kind: 'subscription', amountUsd: 15, provider: 'stripe', status: 'paid', createdAt: days(5) },
  { id: 'ord_4', buyerId: 'u_wei', teacherId: 'u_emma', courseId: 'c_business', kind: 'subscription', amountUsd: 15, provider: 'stripe', status: 'paid', createdAt: days(18) },
  { id: 'ord_5', buyerId: 'u_priya', teacherId: 'u_marco', courseId: 'c_pronun', kind: 'course', amountUsd: 19, provider: 'payme', status: 'paid', createdAt: days(22) },
  { id: 'ord_6', buyerId: 'u_yui', teacherId: 'u_emma', kind: 'tip', amountUsd: 5, provider: 'payme', status: 'paid', note: 'Thank you for the free course!', createdAt: days(1) },
  { id: 'ord_7', buyerId: 'u_wei', teacherId: 'u_james', courseId: 'c_ielts7', kind: 'course', amountUsd: 29, provider: 'click', status: 'pending', createdAt: t(40) }
]

export const SEED_SUBSCRIPTIONS: Subscription[] = [
  { id: 'sub_1', subscriberId: 'u_yui', teacherId: 'u_emma', courseId: 'c_business', usdPerMo: 15, status: 'active', startedAt: days(5), renewsAt: days(-25) },
  { id: 'sub_2', subscriberId: 'u_wei', teacherId: 'u_emma', courseId: 'c_business', usdPerMo: 15, status: 'active', startedAt: days(18), renewsAt: days(-12) }
]

export const SEED_PAYOUTS: Payout[] = [
  { id: 'po_1', teacherId: 'u_emma', amountUsd: 2210, provider: 'payme', status: 'paid', requestedAt: days(60), paidAt: days(58) },
  { id: 'po_2', teacherId: 'u_emma', amountUsd: 1860, provider: 'payme', status: 'paid', requestedAt: days(90), paidAt: days(88) },
  { id: 'po_3', teacherId: 'u_james', amountUsd: 980, provider: 'click', status: 'paid', requestedAt: days(30), paidAt: days(28) }
]

export const SEED_REPORTS: Report[] = [
  {
    id: 'rep_1',
    reporterId: 'u_priya',
    target: { kind: 'post', id: 'p_2', preview: 'How I memorize 20 words a day — my exact routine 👇' },
    reason: 'spam',
    status: 'open',
    createdAt: t(120),
    reportCount: 3
  },
  {
    id: 'rep_2',
    reporterId: 'u_wei',
    target: { kind: 'comment', id: 'cmt_x', preview: 'This course is a scam, do not buy it!!!' },
    reason: 'harassment',
    status: 'open',
    createdAt: t(300),
    reportCount: 5
  },
  {
    id: 'rep_3',
    reporterId: 'u_yui',
    target: { kind: 'stream', id: 's_1', preview: 'Coffee chat · free talk' },
    reason: 'inappropriate',
    status: 'open',
    createdAt: t(600),
    reportCount: 1
  }
]

export const SEED_FEATURED: FeaturedSlot[] = [
  { id: 'feat_1', kind: 'course', refId: 'c_everyday', title: 'Everyday Conversation', cover: 'from-sky-500 to-blue-700', position: 0, active: true },
  { id: 'feat_2', kind: 'course', refId: 'c_ielts7', title: 'IELTS Speaking Bootcamp', cover: 'from-rose-500 to-pink-700', position: 1, active: true },
  { id: 'feat_3', kind: 'ad', title: 'Cambridge Dictionary Premium', cover: 'from-amber-500 to-orange-700', position: 2, active: false, sponsor: 'Cambridge', priceWeekUsd: 99 }
]

export const SEED_SHORTS: ShortClip[] = [
  { id: 'sh_1', teacherId: 'u_james', source: { source: 'youtube', youtubeId: 'V7wseiR5xtw', title: 'IELTS Part 2 model' }, title: '5 IELTS speaking traps to avoid', caption: 'Stop losing band points 👇', startSec: 40, endSec: 98, aspect: '9:16', status: 'published', views: 12_400, createdAt: days(4) },
  { id: 'sh_2', teacherId: 'u_james', source: { source: 'live', streamId: 's_2', title: 'IELTS Part 2 practice room' }, title: 'Most common pronunciation mistake', startSec: 600, endSec: 642, aspect: '9:16', status: 'published', views: 8_400, createdAt: days(8) },
  { id: 'sh_3', teacherId: 'u_james', source: { source: 'youtube', youtubeId: 'oRdxUFDoQe0' }, title: 'Quick past simple vs past perfect', startSec: 120, endSec: 170, aspect: '9:16', status: 'draft', views: 0, createdAt: days(1) }
]

export const SEED_DOWNLOADS: DownloadItem[] = [
  { id: 'dl_1', kind: 'course', refId: 'c_ielts7', title: 'IELTS Speaking Bootcamp', sizeMb: 248, status: 'ready', progress: 100, addedAt: days(2), expiresAt: days(-28) },
  { id: 'dl_2', kind: 'lesson', refId: 'lsn_pasttense', title: 'How storytellers use the past simple', sizeMb: 64, status: 'ready', progress: 100, addedAt: days(1) }
]
