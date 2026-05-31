/**
 * Test library (#A61) — multiple real, gradable test variants per exam family.
 *
 * The built-in `BANKS` carry one canonical test per family. This module adds
 * several more *complete* variants (real passages, tagged questions with answer
 * keys, Locate & Explain content, writing/speaking tasks) so the Exams hub can
 * offer a genuine library — Featured / Recent / Community rails over many tests,
 * not a single mock. Every variant runs through the existing `ExamEngine` and is
 * scored by the family's real `scoreExam`, so nothing here is decorative.
 *
 * Variants are composed deterministically from authored content pools — no
 * Date.now()/random — so ids and ordering are stable across reloads.
 */
import type { ExamBank, ExamSection, MCQItem, MCQSection } from './banks'

/** Library entry = a real ExamBank plus discovery metadata. */
export interface LibraryTest extends ExamBank {
  /** Short tagline shown on the card. */
  blurb: string
  /** Approx difficulty target, for the card badge. */
  band: string
  /** Highlighted on the Featured rail. */
  featured?: boolean
  /** Minutes for the whole test (sum of sections). */
  totalMinutes: number
}

// ─── Authored reading passages + tagged question sets ───────────────────────

interface Passage {
  title: string
  text: string
  items: MCQItem[]
}

const P_OCEANS: Passage = {
  title: 'Mapping the deep ocean',
  text: `For most of human history the deep ocean floor was less well mapped than the surface of the Moon. Sound, not light, is the tool of choice in these dark waters: research vessels emit pulses of sound and time the echo that returns from the seabed, a technique known as echo sounding. Modern multibeam systems fan out hundreds of these pulses at once, building a detailed three-dimensional picture of ridges and trenches. Yet even today only a quarter of the seafloor has been surveyed at high resolution, in part because ships are slow and the oceans are vast. Satellites can help: by measuring tiny bumps in the sea surface caused by the gravity of underwater mountains, they offer a rough global map, though one far too coarse to guide a submarine safely.`,
  items: [
    { id: 'o1', prompt: 'What is the main idea of the passage?', options: ['The Moon is easier to study than the ocean', 'How and how completely the deep seafloor is mapped', 'Submarines are unsafe', 'Satellites have replaced ships'], correct: 1, qtype: 'main-idea', locate: 'For most of human history… only a quarter of the seafloor has been surveyed at high resolution.', explain: 'The passage surveys the methods (echo sounding, multibeam, satellites) and the limited extent of mapping — that is its overall subject, not any single detail.' },
    { id: 'o2', prompt: 'According to the passage, echo sounding works by…', options: ['photographing the seabed', 'timing the echo of sound pulses', 'measuring water temperature', 'using satellite gravity readings'], correct: 1, qtype: 'detail', locate: 'research vessels emit pulses of sound and time the echo that returns from the seabed', explain: 'The text defines echo sounding directly as emitting sound and timing the returning echo.' },
    { id: 'o3', prompt: 'The word "coarse" in the last sentence most nearly means…', options: ['rough / low-detail', 'expensive', 'rude', 'rapid'], correct: 0, qtype: 'vocabulary', locate: 'a rough global map, though one far too coarse to guide a submarine safely', explain: '"Coarse" is paired with "rough" and contrasted with the detail a submarine needs — it means low-resolution.' },
    { id: 'o4', prompt: 'It can be inferred that satellite mapping is…', options: ['more detailed than multibeam', 'useful for a global overview but not precise navigation', 'no longer used', 'only for the Moon'], correct: 1, qtype: 'inference', locate: 'they offer a rough global map, though one far too coarse to guide a submarine safely', explain: 'The passage implies satellites give breadth (a global map) but lack the precision ships provide — an inference, not a stated fact.' },
    { id: 'o5', prompt: 'Why does the author mention the Moon?', options: ['To argue for space travel', 'To stress how little of the ocean was mapped', 'To compare gravity', 'To describe tides'], correct: 1, qtype: 'purpose', locate: 'the deep ocean floor was less well mapped than the surface of the Moon', explain: 'The Moon comparison is a rhetorical device to dramatise the ocean’s lack of mapping.' },
    { id: 'o6', prompt: 'What does "one" refer to in "though one far too coarse"?', options: ['a satellite', 'a ship', 'the global map', 'a submarine'], correct: 2, qtype: 'reference', locate: 'they offer a rough global map, though one far too coarse', explain: '"One" stands in for the immediately preceding noun phrase, "a rough global map".' }
  ]
}

const P_BEES: Passage = {
  title: 'How bees find their way home',
  text: `A foraging honeybee may travel several kilometres from its hive, yet it returns with remarkable accuracy. Experiments show that bees navigate chiefly by the sun, treating it as a moving compass and correcting for its changing position through the day with an internal clock. On overcast days, when the sun is hidden, they switch to reading the pattern of polarised light in patches of blue sky. Landmarks matter too: a bee that has learned a route will follow familiar trees and rivers. Perhaps most striking is the "waggle dance", in which a returning forager traces a figure-of-eight on the comb; the angle of the dance encodes the direction of a food source relative to the sun, and its duration encodes the distance.`,
  items: [
    { id: 'b1', prompt: 'What is the passage mainly about?', options: ['Why bees make honey', 'The methods bees use to navigate', 'The structure of a hive', 'How far bees travel'], correct: 1, qtype: 'main-idea', locate: 'Experiments show that bees navigate chiefly by the sun…', explain: 'Each sentence describes a navigation method; that is the unifying topic.' },
    { id: 'b2', prompt: 'On cloudy days, bees rely on…', options: ['landmarks only', 'polarised light in the sky', 'the waggle dance', 'temperature'], correct: 1, qtype: 'detail', locate: 'they switch to reading the pattern of polarised light in patches of blue sky', explain: 'The text states the cloudy-day backup is polarised light.' },
    { id: 'b3', prompt: 'In the waggle dance, the duration encodes the…', options: ['direction', 'distance', 'danger', 'time of day'], correct: 1, qtype: 'detail', locate: 'its duration encodes the distance', explain: 'Angle = direction; duration = distance, stated explicitly.' },
    { id: 'b4', prompt: 'The phrase "moving compass" suggests the sun is used as a…', options: ['source of heat', 'changing directional reference', 'landmark', 'clock only'], correct: 1, qtype: 'vocabulary', locate: 'treating it as a moving compass and correcting for its changing position', explain: 'A compass gives direction; "moving" reflects the sun’s shifting position — a directional reference that changes.' },
    { id: 'b5', prompt: 'It can be inferred that without an internal clock a bee would…', options: ['fly faster', 'misjudge the sun’s direction over time', 'stop dancing', 'ignore landmarks'], correct: 1, qtype: 'inference', locate: 'correcting for its changing position through the day with an internal clock', explain: 'The clock corrects for the sun’s movement; without it, the sun-compass reading would drift — an inference.' },
    { id: 'b6', prompt: 'Why does the author call the waggle dance "most striking"?', options: ['It is dangerous', 'It communicates precise information through movement', 'It is rare', 'It uses sound'], correct: 1, qtype: 'purpose', locate: 'the angle of the dance encodes the direction… its duration encodes the distance', explain: 'The author highlights the dance because it conveys exact direction and distance — an unusually rich signal.' }
  ]
}

const P_COFFEE: Passage = {
  title: 'The spread of coffee houses',
  text: `When coffee reached the cities of seventeenth-century Europe, it arrived with a reputation for sharpening the mind. The coffee houses that opened to serve it quickly became something more than places to drink: for the price of a cup, anyone could sit, read the latest newssheets, and join a conversation. Merchants struck deals at one table while writers argued at the next. Critics worried that these "penny universities", as some called them, encouraged idleness and loose talk, and more than one government tried to close them. The attempts failed. By the eighteenth century the coffee house had embedded itself in commercial and intellectual life, and several famous institutions—insurance markets and learned societies among them—trace their origins to a particular room above a particular shop.`,
  items: [
    { id: 'cf1', prompt: 'The passage is primarily concerned with…', options: ['how coffee is grown', 'the social role of early coffee houses', 'government taxation', 'the chemistry of caffeine'], correct: 1, qtype: 'main-idea', locate: 'the coffee houses… quickly became something more than places to drink', explain: 'The passage traces what coffee houses meant socially and commercially.' },
    { id: 'cf2', prompt: 'What could a customer do for the price of a cup?', options: ['Buy a newssheet to keep', 'Sit, read the news, and join conversation', 'Open a bank account', 'Take coffee home'], correct: 1, qtype: 'detail', locate: 'for the price of a cup, anyone could sit, read the latest newssheets, and join a conversation', explain: 'The three activities are listed verbatim.' },
    { id: 'cf3', prompt: 'The nickname "penny universities" implies coffee houses were…', options: ['expensive', 'places of cheap learning and debate', 'run by universities', 'only for students'], correct: 1, qtype: 'vocabulary', locate: 'these "penny universities"… encouraged idleness and loose talk', explain: '"Penny" (cheap) + "universities" (learning) → cheap access to ideas and discussion.' },
    { id: 'cf4', prompt: 'What happened to government attempts to close the coffee houses?', options: ['They succeeded', 'They failed', 'They were never made', 'They raised prices'], correct: 1, qtype: 'detail', locate: 'more than one government tried to close them. The attempts failed.', explain: 'Stated directly: the attempts failed.' },
    { id: 'cf5', prompt: 'It can be inferred that some modern institutions…', options: ['banned coffee', 'began in coffee houses', 'replaced coffee houses', 'sold coffee'], correct: 1, qtype: 'inference', locate: 'several famous institutions… trace their origins to a particular room above a particular shop', explain: 'The closing sentence implies real institutions grew out of these rooms.' },
    { id: 'cf6', prompt: 'The author’s attitude toward the critics is best described as…', options: ['agreeing with them', 'noting they were proven wrong', 'fearful', 'uninterested'], correct: 1, qtype: 'purpose', locate: 'The attempts failed. By the eighteenth century the coffee house had embedded itself…', explain: 'By following the critics with "the attempts failed", the author signals the critics did not prevail.' }
  ]
}

// ─── Authored listening dialogues + tagged questions ────────────────────────

const D_CAMPUS: Passage = {
  title: 'Campus orientation',
  text: `STUDENT: Hi, I'm new — where do I get my library card? STAFF: At the front desk on the ground floor. Bring your student ID. STUDENT: Great. And how many books can I borrow? STAFF: Undergraduates can take out eight at a time, for two weeks each, and you can renew online twice. STUDENT: Is there anywhere to study late? STAFF: The third-floor reading room is open until midnight on weekdays, but it closes at six on weekends.`,
  items: [
    { id: 'cl1', prompt: 'Where does the student get a library card?', options: ['Third floor', 'The front desk on the ground floor', 'Online', 'The reading room'], correct: 1, qtype: 'detail', locate: 'At the front desk on the ground floor.', explain: 'The staff member states the location directly.' },
    { id: 'cl2', prompt: 'How many books can an undergraduate borrow at once?', options: ['Two', 'Six', 'Eight', 'Ten'], correct: 2, qtype: 'detail', locate: 'Undergraduates can take out eight at a time', explain: 'The number eight is stated.' },
    { id: 'cl3', prompt: 'How many times can loans be renewed online?', options: ['Once', 'Twice', 'Three times', 'Unlimited'], correct: 1, qtype: 'detail', locate: 'you can renew online twice', explain: 'Renewals are capped at twice.' },
    { id: 'cl4', prompt: 'When does the reading room close on weekends?', options: ['Midnight', 'Six', 'Ten', 'It does not close'], correct: 1, qtype: 'detail', locate: 'it closes at six on weekends', explain: 'Weekend closing time is six.' },
    { id: 'cl5', prompt: 'What must the student bring for the card?', options: ['Cash', 'A passport', 'Their student ID', 'A photo'], correct: 2, qtype: 'detail', locate: 'Bring your student ID.', explain: 'Student ID is the stated requirement.' },
    { id: 'cl6', prompt: 'The staff member’s tone is best described as…', options: ['unhelpful', 'helpful and informative', 'annoyed', 'confused'], correct: 1, qtype: 'inference', locate: 'staff answers each question clearly with specifics', explain: 'The staff gives clear, complete answers — a helpful tone, inferred from manner.' }
  ]
}

const D_BOOKING: Passage = {
  title: 'Booking a tour',
  text: `CALLER: I'd like to book the harbour tour for Saturday. AGENT: Of course. The morning tour leaves at nine and the afternoon one at two. Which would you prefer? CALLER: The afternoon, for two adults and one child. AGENT: That's twenty pounds per adult and ten for the child, so fifty pounds in total. The boat returns by half past four. Please arrive fifteen minutes early at Pier 3. CALLER: Do I pay now? AGENT: A deposit of ten pounds secures the booking; the rest is paid on the day.`,
  items: [
    { id: 'bk1', prompt: 'What time does the afternoon tour leave?', options: ['Nine', 'Two', 'Half past four', 'Fifteen minutes early'], correct: 1, qtype: 'detail', locate: 'the afternoon one at two', explain: 'The afternoon departure is two o’clock.' },
    { id: 'bk2', prompt: 'What is the total cost?', options: ['Thirty pounds', 'Forty pounds', 'Fifty pounds', 'Ten pounds'], correct: 2, qtype: 'detail', locate: 'twenty pounds per adult and ten for the child, so fifty pounds in total', explain: '2×£20 + £10 = £50, stated by the agent.' },
    { id: 'bk3', prompt: 'Where should the caller arrive?', options: ['Pier 1', 'Pier 3', 'The office', 'The harbour gate'], correct: 1, qtype: 'detail', locate: 'arrive fifteen minutes early at Pier 3', explain: 'Pier 3 is the stated meeting point.' },
    { id: 'bk4', prompt: 'How much is the deposit?', options: ['Fifty pounds', 'Twenty pounds', 'Ten pounds', 'Nothing'], correct: 2, qtype: 'detail', locate: 'A deposit of ten pounds secures the booking', explain: 'The deposit is ten pounds.' },
    { id: 'bk5', prompt: 'When does the boat return?', options: ['Two', 'Half past four', 'Nine', 'Midnight'], correct: 1, qtype: 'detail', locate: 'The boat returns by half past four.', explain: 'Return time is half past four.' },
    { id: 'bk6', prompt: 'It can be inferred the rest of the payment is made…', options: ['never', 'on the day of the tour', 'next week', 'by card only'], correct: 1, qtype: 'inference', locate: 'the rest is paid on the day', explain: 'After the deposit, the balance is due on the tour day.' }
  ]
}

// ─── Grammar / usage pools (CEFR-style) ─────────────────────────────────────

const USAGE_B: MCQItem[] = [
  { id: 'u1', prompt: 'She has been working here ___ five years.', options: ['since', 'for', 'during', 'from'], correct: 1, qtype: 'grammar', explain: '"For" + a period of time (five years); "since" takes a point in time.' },
  { id: 'u2', prompt: 'If I ___ you, I would apologise.', options: ['am', 'was', 'were', 'be'], correct: 2, qtype: 'grammar', explain: 'Second conditional uses the subjunctive "were" for hypotheticals.' },
  { id: 'u3', prompt: 'This is the book ___ I told you about.', options: ['who', 'which', 'whose', 'what'], correct: 1, qtype: 'grammar', explain: '"Which" is the relative pronoun for things.' },
  { id: 'u4', prompt: 'He isn’t used to ___ early.', options: ['get up', 'getting up', 'got up', 'gets up'], correct: 1, qtype: 'grammar', explain: '"Be used to" is followed by a gerund (getting up).' },
  { id: 'u5', prompt: 'By next year she ___ her degree.', options: ['finishes', 'will finish', 'will have finished', 'finished'], correct: 2, qtype: 'grammar', explain: 'Future perfect for an action completed before a future point.' },
  { id: 'u6', prompt: 'Neither of the answers ___ correct.', options: ['are', 'is', 'were', 'be'], correct: 1, qtype: 'grammar', explain: '"Neither" is singular → "is".' },
  { id: 'u7', prompt: 'I wish I ___ more time yesterday.', options: ['have', 'had had', 'have had', 'had'], correct: 1, qtype: 'grammar', explain: '"Wish" about the past uses past perfect (had had).' },
  { id: 'u8', prompt: 'The report ___ by Friday.', options: ['must finish', 'must be finished', 'must finishing', 'must to finish'], correct: 1, qtype: 'grammar', explain: 'Passive obligation: must + be + past participle.' },
  { id: 'u9', prompt: 'Hardly ___ when the phone rang.', options: ['I had sat down', 'had I sat down', 'I sat down', 'did I sit down'], correct: 1, qtype: 'grammar', explain: 'Negative adverb "hardly" at the front triggers inversion.' },
  { id: 'u10', prompt: 'She speaks English ___ than her brother.', options: ['more fluent', 'fluently', 'more fluently', 'most fluently'], correct: 2, qtype: 'grammar', explain: 'Comparative of the adverb "fluently" is "more fluently".' },
  { id: 'u11', prompt: 'I look forward to ___ from you.', options: ['hear', 'hearing', 'heard', 'hears'], correct: 1, qtype: 'grammar', explain: '"Look forward to" + gerund.' },
  { id: 'u12', prompt: 'It’s high time we ___ home.', options: ['go', 'went', 'will go', 'have gone'], correct: 1, qtype: 'grammar', explain: '"It’s high time" + past tense for present urgency.' }
]

const USAGE_A: MCQItem[] = [
  { id: 'a1', prompt: 'They ___ to the cinema yesterday.', options: ['go', 'goes', 'went', 'gone'], correct: 2, qtype: 'grammar', explain: 'Past simple of "go" is "went".' },
  { id: 'a2', prompt: 'There ___ some apples on the table.', options: ['is', 'are', 'be', 'am'], correct: 1, qtype: 'grammar', explain: 'Plural "apples" → "are".' },
  { id: 'a3', prompt: 'She is taller ___ her sister.', options: ['then', 'than', 'that', 'from'], correct: 1, qtype: 'grammar', explain: 'Comparison uses "than".' },
  { id: 'a4', prompt: 'I ___ like coffee.', options: ["don't", "doesn't", 'not', 'no'], correct: 0, qtype: 'grammar', explain: 'First person negative present uses "don’t".' },
  { id: 'a5', prompt: 'We ___ watching a film now.', options: ['is', 'are', 'am', 'be'], correct: 1, qtype: 'grammar', explain: 'Present continuous with "we" → "are".' },
  { id: 'a6', prompt: 'Can you give me ___ water?', options: ['some', 'many', 'a', 'few'], correct: 0, qtype: 'grammar', explain: '"Some" with uncountable "water".' },
  { id: 'a7', prompt: 'He ___ his homework every day.', options: ['do', 'does', 'doing', 'done'], correct: 1, qtype: 'grammar', explain: 'Third person present of "do" is "does".' },
  { id: 'a8', prompt: 'This is ___ interesting book.', options: ['a', 'an', 'the', '—'], correct: 1, qtype: 'grammar', explain: '"An" before a vowel sound (interesting).' },
  { id: 'a9', prompt: 'They have lived here ___ 2010.', options: ['for', 'since', 'from', 'at'], correct: 1, qtype: 'grammar', explain: '"Since" + a point in time (2010).' },
  { id: 'a10', prompt: 'I ___ ever been to Japan.', options: ['have never', "haven't never", 'never have', 'have ever'], correct: 0, qtype: 'grammar', explain: 'Present perfect with "never": have never been.' },
  { id: 'a11', prompt: 'Look! It ___.', options: ['rains', 'is raining', 'rain', 'rained'], correct: 1, qtype: 'grammar', explain: 'Action happening now → present continuous.' },
  { id: 'a12', prompt: 'My brother is good ___ maths.', options: ['in', 'at', 'on', 'for'], correct: 1, qtype: 'grammar', explain: 'Collocation: good at something.' }
]

// ─── Math pool (SAT-style) ──────────────────────────────────────────────────

const MATH_B: MCQItem[] = [
  { id: 'mb1', prompt: 'If 4x − 7 = 21, then x = ?', options: ['5', '6', '7', '14'], correct: 2, qtype: 'math', explain: '4x = 28 → x = 7.' },
  { id: 'mb2', prompt: 'A jacket costs $90 after a 25% discount. Original price?', options: ['$110', '$112.50', '$120', '$115'], correct: 2, qtype: 'math', explain: '90 / 0.75 = 120.' },
  { id: 'mb3', prompt: 'The mean of 6, 10, x is 9. x = ?', options: ['9', '10', '11', '12'], correct: 2, qtype: 'math', explain: '6+10+x = 27 → x = 11.' },
  { id: 'mb4', prompt: 'A circle has radius 5. Its area is…', options: ['10π', '25π', '5π', '50π'], correct: 1, qtype: 'math', explain: 'Area = πr² = 25π.' },
  { id: 'mb5', prompt: 'Line through (0,2) with slope 3: y when x = 4?', options: ['12', '13', '14', '11'], correct: 2, qtype: 'math', explain: 'y = 3x + 2 = 14.' },
  { id: 'mb6', prompt: 'If 2/5 of a number is 18, the number is…', options: ['36', '40', '45', '90'], correct: 2, qtype: 'math', explain: 'n = 18 × 5/2 = 45.' },
  { id: 'mb7', prompt: 'Simplify: 3(x + 2) − 2x', options: ['x + 6', 'x + 2', '5x', 'x − 6'], correct: 0, qtype: 'math', explain: '3x + 6 − 2x = x + 6.' },
  { id: 'mb8', prompt: 'A right triangle has legs 6 and 8. Hypotenuse?', options: ['10', '12', '14', '48'], correct: 0, qtype: 'math', explain: '√(36+64) = √100 = 10.' }
]

// ─── Writing / speaking task pools ──────────────────────────────────────────

const WRITING_TASKS = [
  'Some people believe that working from home benefits everyone, while others think it harms teamwork. Discuss both views and give your own opinion. Write at least 250 words.',
  'In many countries the use of cash is declining. Is this a positive or negative development? Write at least 250 words.',
  'Some argue that governments should fund the arts; others say public money should go only to essential services. Discuss both sides. Write at least 250 words.'
]

const SPEAKING_SETS = [
  [
    { id: 's1', part: 'Part 1', prompt: 'Let’s talk about your daily routine. What is a typical day like for you?' },
    { id: 's2', part: 'Part 2', prompt: 'Describe a place you enjoy visiting. Say where it is, what you do there, and why you like it.' },
    { id: 's3', part: 'Part 3', prompt: 'Do you think people have enough free time today? Why or why not?' }
  ],
  [
    { id: 's1', part: 'Part 1', prompt: 'Tell me about the kind of music you enjoy and when you listen to it.' },
    { id: 's2', part: 'Part 2', prompt: 'Describe a person who has influenced you. Say who they are and how they influenced you.' },
    { id: 's3', part: 'Part 3', prompt: 'How has the way people listen to music changed over the years?' }
  ]
]

// ─── Variant composers ──────────────────────────────────────────────────────

function readingSection(p: Passage, minutes: number): MCQSection {
  return { id: 'reading', label: 'Reading', kind: 'mcq', minutes, passage: p.text, items: p.items }
}

function listeningSection(p: Passage, minutes: number): MCQSection {
  return { id: 'listening', label: 'Listening', kind: 'mcq', minutes, audioTranscript: p.text, items: p.items }
}

function ielts(n: number, reading: Passage, listening: Passage, writingIdx: number, speakingIdx: number, featured?: boolean): LibraryTest {
  const sections: ExamSection[] = [
    listeningSection(listening, 30),
    readingSection(reading, 60),
    { id: 'writing', label: 'Writing', kind: 'writing', minutes: 60, prompt: WRITING_TASKS[writingIdx], minWords: 250 },
    { id: 'speaking', label: 'Speaking', kind: 'speaking', minutes: 14, prompts: SPEAKING_SETS[speakingIdx] }
  ]
  return {
    id: `ielts-t${n}`, kind: 'ielts', title: `IELTS Academic · Test ${n}`, scaleLabel: 'Overall band',
    blurb: `${reading.title} · ${listening.title}`, band: 'Target 6.5–7.5', featured,
    totalMinutes: 164, sections
  }
}

function toefl(n: number, reading: Passage, listening: Passage, writingIdx: number, featured?: boolean): LibraryTest {
  const sections: ExamSection[] = [
    readingSection(reading, 54),
    listeningSection(listening, 41),
    { id: 'speaking', label: 'Speaking', kind: 'speaking', minutes: 17, prompts: SPEAKING_SETS[(n) % SPEAKING_SETS.length] },
    { id: 'writing', label: 'Writing', kind: 'writing', minutes: 50, prompt: WRITING_TASKS[writingIdx], minWords: 300 }
  ]
  return {
    id: `toefl-t${n}`, kind: 'toefl', title: `TOEFL iBT · Test ${n}`, scaleLabel: 'Total score',
    blurb: `${reading.title} · ${listening.title}`, band: 'Target 90–105', featured,
    totalMinutes: 162, sections
  }
}

function cefr(n: number, usage: MCQItem[], reading: Passage, featured?: boolean): LibraryTest {
  const sections: ExamSection[] = [
    { id: 'usage', label: 'Grammar & vocabulary', kind: 'mcq', minutes: 20, items: usage },
    readingSection(reading, 20)
  ]
  return {
    id: `cefr-t${n}`, kind: 'cefr', title: `CEFR placement · Test ${n}`, scaleLabel: 'Your level',
    blurb: `Grammar, vocabulary & reading · ${reading.title}`, band: 'A1–C2', featured,
    totalMinutes: 40, sections
  }
}

/**
 * The full authored library. Stable order; the first of each family is
 * featured so the Featured rail has a real spread.
 */
export const TEST_LIBRARY: LibraryTest[] = [
  ielts(1, P_OCEANS, D_CAMPUS, 0, 0, true),
  ielts(2, P_BEES, D_BOOKING, 1, 1),
  ielts(3, P_COFFEE, D_CAMPUS, 2, 0),
  toefl(1, P_BEES, D_BOOKING, 1, true),
  toefl(2, P_COFFEE, D_CAMPUS, 2),
  cefr(1, USAGE_A, P_OCEANS, true),
  cefr(2, USAGE_B, P_COFFEE),
  // A SAT-style variant using the math + reading pools.
  {
    id: 'sat-t1', kind: 'sat', title: 'SAT · Practice Test 1', scaleLabel: 'Total score',
    blurb: 'Reading & Writing + Math', band: '400–1600', featured: true, totalMinutes: 134,
    sections: [
      readingSection(P_COFFEE, 64),
      { id: 'math', label: 'Math', kind: 'mcq', minutes: 70, items: MATH_B }
    ]
  }
]

export function testsForFamily(kind: string): LibraryTest[] {
  return TEST_LIBRARY.filter((t) => t.kind === kind)
}

export function featuredTests(): LibraryTest[] {
  return TEST_LIBRARY.filter((t) => t.featured)
}
