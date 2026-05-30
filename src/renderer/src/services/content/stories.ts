/**
 * Original graded short stories (text). The reader narrates with the browser's
 * speech synthesis, so "listening" works fully offline — no audio files needed.
 * Each story has parts and a short comprehension check.
 */

export interface StoryPart {
  title: string
  /** Paragraphs of the part. */
  paragraphs: string[]
}

export interface StoryQuestion {
  q: string
  options: string[]
  answer: number
}

export interface Story {
  id: string
  title: string
  emoji: string
  level: string
  kind: 'reading' | 'listening' | 'mixed'
  cover: string
  xp: number
  blurb: string
  parts: StoryPart[]
  questions: StoryQuestion[]
}

export const STORIES: Story[] = [
  {
    id: 's_tokyo',
    title: 'A Day in Tokyo',
    emoji: '🗼',
    level: 'A2',
    kind: 'reading',
    cover: 'from-rose-500 to-orange-500',
    xp: 40,
    blurb: 'Mia spends her first day exploring Tokyo — and gets pleasantly lost.',
    parts: [
      {
        title: 'Morning',
        paragraphs: [
          'Mia woke up early. The sun was bright and the city was already busy. She opened the window of her small hotel room and looked at the streets below.',
          'People were walking fast. Trains were arriving and leaving. "Today I will explore," she said to herself. She put on her shoes and went outside.'
        ]
      },
      {
        title: 'The market',
        paragraphs: [
          'First, Mia went to a famous market. There were so many things to see. She tried hot green tea and a small sweet cake. It was delicious.',
          'A woman at a stall smiled and said, "Welcome!" Mia smiled back. She did not speak much Japanese, but a smile was enough.'
        ]
      },
      {
        title: 'Lost',
        paragraphs: [
          'After lunch, Mia walked and walked. Soon she did not know where she was. The streets all looked the same. She felt a little nervous.',
          'Then she saw a small park with cherry trees. She decided to rest there for a while and enjoy the quiet.'
        ]
      },
      {
        title: 'A kind stranger',
        paragraphs: [
          'An old man was sitting on a bench. He noticed her map and asked, in slow English, "Are you lost?" Mia nodded.',
          'He pointed the way back to her hotel and drew a small map on a piece of paper. "Thank you so much," Mia said. She felt happy again.'
        ]
      },
      {
        title: 'Evening',
        paragraphs: [
          'That night, Mia sat by her window. The city lights were beautiful. She was tired but very happy.',
          'It was only her first day, but she already loved Tokyo. "Tomorrow," she thought, "I will explore again."'
        ]
      }
    ],
    questions: [
      { q: 'When did Mia wake up?', options: ['Late at night', 'Early in the morning', 'At noon', 'In the evening'], answer: 1 },
      { q: 'What did Mia try at the market?', options: ['Coffee and bread', 'Green tea and a sweet cake', 'Pizza', 'Nothing'], answer: 1 },
      { q: 'Why did Mia feel nervous?', options: ['She lost her money', 'She got lost', 'She missed her train', 'It was raining'], answer: 1 },
      { q: 'Who helped Mia find her way?', options: ['A police officer', 'An old man', 'A taxi driver', 'A child'], answer: 1 }
    ]
  },
  {
    id: 's_coffee',
    title: 'The Coffee Mystery',
    emoji: '☕',
    level: 'B1',
    kind: 'mixed',
    cover: 'from-amber-500 to-rose-500',
    xp: 60,
    blurb: 'Every morning, someone leaves a coffee on Leo\'s desk. Who is it?',
    parts: [
      {
        title: 'A surprise',
        paragraphs: [
          'When Leo arrived at the office on Monday, there was a cup of coffee on his desk. It was still warm. There was no note, and nobody said anything.',
          '"Strange," he thought, but he drank it anyway. It was exactly how he liked it — black, with one sugar.'
        ]
      },
      {
        title: 'It happens again',
        paragraphs: [
          'On Tuesday, the same thing happened. And on Wednesday. Every morning, a perfect cup of coffee appeared, and nobody admitted to leaving it.',
          'Leo started to watch his colleagues carefully. Was it Sara from accounting? Or Tom, who always arrived first?'
        ]
      },
      {
        title: 'The plan',
        paragraphs: [
          'On Friday, Leo decided to come in very early. He hid near the kitchen and waited quietly, holding his breath.',
          'At seven o\'clock, the door opened. Footsteps came closer. Leo\'s heart was beating fast.'
        ]
      },
      {
        title: 'The truth',
        paragraphs: [
          'It was Mr. Davies, the quiet man from the security desk. He made coffee for everyone who worked hard, he explained, but he was too shy to say so.',
          'Leo laughed and shook his hand. "Thank you," he said. "It\'s the best coffee in the building." From then on, they had coffee together every morning.'
        ]
      }
    ],
    questions: [
      { q: 'What appeared on Leo\'s desk each morning?', options: ['A note', 'A cup of coffee', 'Flowers', 'Money'], answer: 1 },
      { q: 'How did Leo like his coffee?', options: ['With milk', 'Black with one sugar', 'Very sweet', 'Cold'], answer: 1 },
      { q: 'What did Leo do on Friday?', options: ['Stayed home', 'Came in very early to watch', 'Called the police', 'Quit his job'], answer: 1 },
      { q: 'Who was leaving the coffee?', options: ['Sara', 'Tom', 'Mr. Davies', 'The manager'], answer: 2 }
    ]
  },
  {
    id: 's_astronaut',
    title: 'The Sleepless Astronaut',
    emoji: '🚀',
    level: 'B2',
    kind: 'listening',
    cover: 'from-indigo-500 to-violet-700',
    xp: 80,
    blurb: 'Aboard a quiet space station, Commander Reyes can\'t sleep — and makes a discovery.',
    parts: [
      {
        title: 'Silence',
        paragraphs: [
          'Three hundred kilometres above Earth, the station was silent except for the soft hum of the machines. Commander Reyes floated by the window, unable to sleep.',
          'Below her, the planet turned slowly, a blue marble wrapped in cloud. She had seen it a thousand times, yet it never lost its power to amaze her.'
        ]
      },
      {
        title: 'A strange signal',
        paragraphs: [
          'A small light blinked on the console. It was an unusual reading — a faint, repeating signal that the computer could not identify.',
          'Reyes frowned. In six months aboard the station, she had never seen anything like it. She decided to investigate before waking the others.'
        ]
      },
      {
        title: 'The discovery',
        paragraphs: [
          'After an hour of careful work, she understood. The signal was not a malfunction. It was a reflection — sunlight bouncing off a tiny, forgotten satellite, launched decades before she was born.',
          'She smiled. It was a message from the past, still faithfully circling the Earth. She recorded it, then finally felt ready to rest.'
        ]
      }
    ],
    questions: [
      { q: 'Why couldn\'t the commander sleep?', options: ['She was sick', 'The story doesn\'t say exactly', 'There was an alarm', 'It was too hot'], answer: 1 },
      { q: 'What did the blinking light show?', options: ['A fire', 'An unusual signal', 'A message from home', 'An empty tank'], answer: 1 },
      { q: 'What was the signal, in the end?', options: ['Aliens', 'A reflection off an old satellite', 'A broken computer', 'A new star'], answer: 1 }
    ]
  },
  {
    id: 's_firstjob',
    title: 'My First Job',
    emoji: '💼',
    level: 'A2',
    kind: 'reading',
    cover: 'from-emerald-500 to-teal-700',
    xp: 40,
    blurb: 'Nadia is nervous on the first day of her first job — but the day surprises her.',
    parts: [
      {
        title: 'Nervous',
        paragraphs: [
          'Nadia could not eat breakfast. Today was the first day of her first job, and she was very nervous. She put on her new shirt and checked the mirror three times.',
          '"You can do this," she told herself, and left the house ten minutes early.'
        ]
      },
      {
        title: 'A friendly face',
        paragraphs: [
          'At the shop, a woman named Carla welcomed her warmly. "Don\'t worry," Carla said. "Everyone is nervous on the first day. I\'ll show you everything."',
          'Carla showed her how to use the till and how to greet customers. Slowly, Nadia began to relax.'
        ]
      },
      {
        title: 'A good day',
        paragraphs: [
          'By the afternoon, Nadia was helping customers on her own. One man even thanked her for being so kind and patient.',
          'When she got home, she was tired but proud. Her first day was not scary at all. In fact, it was wonderful.'
        ]
      }
    ],
    questions: [
      { q: 'How did Nadia feel in the morning?', options: ['Bored', 'Nervous', 'Angry', 'Sleepy'], answer: 1 },
      { q: 'Who helped Nadia at the shop?', options: ['Carla', 'Her mother', 'A customer', 'The manager'], answer: 0 },
      { q: 'How did Nadia feel at the end of the day?', options: ['Scared', 'Tired but proud', 'Sad', 'Angry'], answer: 1 }
    ]
  }
]

export function getStory(id: string): Story | undefined {
  return STORIES.find((s) => s.id === id)
}
