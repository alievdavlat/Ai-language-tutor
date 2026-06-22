# SpeakAI

An AI-powered English-learning desktop app — practise speaking, build vocabulary,
and work through grammar with a personal AI coach, real teachers, and a learning
community.

## What's inside

- **Speaking** — real-time voice conversations with AI companions, an IELTS speaking
  simulator, pronunciation drills, and shadowing.
- **Learn** — courses with lesson paths, an adaptive CEFR level test, exams practice
  (IELTS / TOEFL), a clips fill-in-the-blank listening game, and a writing coach.
- **Vocabulary** — spaced-repetition (FSRS) flashcards with native-language meanings.
- **Community** — feed, groups, challenges, live rooms, direct messages, and
  teacher channels.
- **Roles** — learner, teacher, and admin experiences from one app.

## Tech stack

- **Electron** + **React** + **TypeScript** + **Vite**
- **Tailwind CSS** (dark-first UI)
- Local-first data (localStorage) with an optional **Supabase** cloud backend
- Pluggable AI providers (configured in-app under Settings → AI)
- 13-language interface (English, Uzbek, Russian, and more)

## Getting started

```bash
npm install
npm run dev          # launch the Electron app
```

Other scripts:

```bash
npm run typecheck    # type-check (node + web)
npm test             # run the unit test suite
npm run build:win    # build a Windows installer
```

## Configuration

Cloud features are optional and read from a local `.env.local` (never committed):
Supabase URL/key, AI provider keys, and OAuth client ids. Without them the app runs
fully on the local backend.
