/**
 * Watch & Learn content: real, embeddable YouTube videos paired with a
 * time-coded transcript. The active line follows the real player clock and you
 * can click a line to seek or a word to look it up / save it.
 *
 * Transcripts are hand-aligned excerpts. Live auto-extraction via
 * youtube-transcript-api needs a server proxy (CORS) and lands with the cloud
 * Foundation; the player + sync + lookup here are fully client-side.
 */

export interface TranscriptSegment {
  /** Start time in seconds. */
  start: number
  text: string
}

export interface WatchVideo {
  id: string
  youtubeId: string
  title: string
  channel: string
  level: string
  /** The source video's own public view count on YouTube — NOT in-app engagement. */
  sourceViews: string
  segments: TranscriptSegment[]
}

export const WATCH_VIDEOS: WatchVideo[] = [
  {
    id: 'w_grit',
    youtubeId: 'H14bBuluwB8',
    title: 'Grit: The Power of Passion and Perseverance',
    channel: 'Angela Lee Duckworth',
    level: 'B2',
    sourceViews: '28M',
    segments: [
      { start: 2, text: 'When I was 27 years old, I left a very demanding job in management consulting.' },
      { start: 9, text: 'I left for a job that was even more demanding: teaching.' },
      { start: 15, text: 'I went to teach seventh graders math in the New York City public schools.' },
      { start: 23, text: 'And like any teacher, I made quizzes and tests.' },
      { start: 29, text: 'I gave out homework assignments, and when the work came back, I calculated grades.' },
      { start: 37, text: 'What struck me was that IQ was not the only difference between my best and my worst students.' },
      { start: 46, text: 'Some of my strongest performers did not have stratospheric IQ scores.' },
      { start: 53, text: 'Some of my smartest kids were not doing so well.' },
      { start: 59, text: 'And that got me thinking. What we need in education is a much better understanding of students.' },
      { start: 68, text: 'In one word, this characteristic was grit.' },
      { start: 74, text: 'Grit is passion and perseverance for very long-term goals.' },
      { start: 81, text: 'Grit is having stamina. Grit is sticking with your future, day in, day out.' }
    ]
  },
  {
    id: 'w_vulnerability',
    youtubeId: 'iCvmsMzlF7o',
    title: 'The Power of Vulnerability',
    channel: 'Brené Brown',
    level: 'C1',
    sourceViews: '20M',
    segments: [
      { start: 3, text: "So, I'll start with this: a couple years ago, an event planner called me." },
      { start: 10, text: 'She said, "I\'m really struggling with how to write about you on the little flyer."' },
      { start: 18, text: 'And I thought, well, what\'s the struggle?' },
      { start: 23, text: 'And she said, "Well, I saw you speak, and I\'m going to call you a researcher."' },
      { start: 31, text: 'But I\'m afraid that if I call you a researcher, no one will come.' },
      { start: 38, text: 'So she decided to call me a storyteller.' },
      { start: 44, text: 'And the academic, insecure part of me said, "You\'re going to call me a what?"' },
      { start: 52, text: 'The thing about stories is that I\'m a qualitative researcher. I collect stories.' },
      { start: 60, text: 'Maybe stories are just data with a soul.' },
      { start: 66, text: 'And so I started my career as a young researcher, and the way I was trained was simple.' },
      { start: 75, text: 'If you cannot measure it, it does not exist.' }
    ]
  },
  {
    id: 'w_procrastinator',
    youtubeId: 'arj7oStGLkU',
    title: 'Inside the Mind of a Master Procrastinator',
    channel: 'Tim Urban',
    level: 'B2',
    sourceViews: '70M',
    segments: [
      { start: 2, text: 'So in college, I was a government major.' },
      { start: 7, text: 'Which means I had to write a lot of papers.' },
      { start: 12, text: 'Now, when a normal student writes a paper, they might spread the work out a little like this.' },
      { start: 20, text: 'So, you know, you get started maybe a little slowly.' },
      { start: 26, text: 'But you get enough done in the first week that, with some heavier days later on, everything gets done.' },
      { start: 35, text: 'I wanted to do that, that was the plan. I had it all ready.' },
      { start: 41, text: 'But then, actually, the paper would come along.' },
      { start: 47, text: 'And then I would do this. And that would happen every single paper.' },
      { start: 54, text: 'But then came my 90-page senior thesis.' },
      { start: 60, text: 'A paper you are supposed to spend a year on.' },
      { start: 66, text: 'I knew for a paper like that, my normal work flow was not an option. It was way too big a project.' },
      { start: 75, text: 'So I planned things out, and I decided I kind of had to spread it out.' }
    ]
  }
]

export function getWatchVideo(id: string): WatchVideo | undefined {
  return WATCH_VIDEOS.find((v) => v.id === id)
}

/** Index of the segment active at time `t` (seconds). */
export function activeSegmentIndex(segments: TranscriptSegment[], t: number): number {
  let idx = 0
  for (let i = 0; i < segments.length; i++) {
    if (t >= segments[i].start) idx = i
    else break
  }
  return idx
}
