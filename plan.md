Mana **barcha 141 xususiyat → 68 phase**'ga taqsimlangan to'liq roadmap. Har phase'da aniq qaysi xususiyat yopiladi (ID bilan).

---

# 🗺️ MASTER ROADMAP — 141 xususiyat / 68 phase

## 🏗️ FOUNDATION (alpha, tayyor/tugamoqda)

### ✅ Phase 0 — Setup + Onboarding (1 hafta)
**Features:** `[5.1]` `[5.2]` `[8.1]`
- Electron + Vite + React scaffold, 6-step onboarding
- Placement test, CEFR level detection, Dark/Light mode baseline

### ✅ Phase 1 — Speaking MVP (2-3 hafta)
**Features:** `[4.1]` `[4.2]` `[4.19]` `[4.20]` `[1.13]` `[1.15]` `[1.10]` `[2.1]` `[12.1]`
- Chat + voice switchable, per-character history
- "Typing" indicator, text preview
- Push-to-talk + Always-on, accent selector
- Basic character gallery, end-to-end local AI

### 🔧 Phase 2 — Offline voice pipeline (1.5 hafta) **[hozir]**
**Features:** `[1.14]` `[8.6]` `[8.7]` `[12.1]`
- Tap-to-talk (toggle click)
- Whisper via transformers.js, Silero VAD bundled offline
- LLM model picker with RAM-aware recommendations

---

## 🎙️ VOICE EXPERIENCE CORE → **v1.0 Release target**

### 🆕 Phase 3 — Call mode UI (1.5 hafta) ⭐
**Features:** `[1.1]` `[3.11]` `[3.12]` `[11.1]` `[11.2]` `[11.8]` `[11.9]` `[11.10]`
- Fullscreen voice-only view (Pi AI style)
- Pulsing voice orb (state colour: idle/listen/think/speak)
- Wave visualization of input audio
- Dark-glow theme + emotion gradient background
- "Call" transition animation

### 🆕 Phase 4 — Streaming pipeline (1.5 hafta)
**Features:** `[1.2]` `[1.4]`
- Streaming STT (partial transcripts → LLM)
- Streaming LLM → TTS (first chunk plays while LLM continues)
- Barge-in / interruption (user speaks → TTS cancel, mic on)

### 🆕 Phase 5 — Audio processing (1 hafta)
**Features:** `[1.11]` `[1.16]` `[1.17]` `[1.18]`
- Voice speed (0.5×-2×)
- Noise suppression (RNNoise WASM)
- Echo cancellation + AGC (WebRTC flags)

---

## 🔐 ADMIN PIPELINE → v1.0

### 🆕 Phase 6 — Admin Core (2 hafta)
**Features:** (infrastructure for `[2.3]` `[10.2]` `[10.4]` `[10.5]`)
- Admin auth (Ctrl+Shift+A)
- Content registry + GitHub publisher
- User-side content update checker
- Admin dashboard, model/voice manager

---

## 👥 CHARACTER SYSTEM → v1.0

### 🆕 Phase 7 — Character profile editor (1 hafta)
**Features:** `[2.4]` `[2.5]` `[2.6]` `[2.7]`
- Full profile (name, age, origin, job, backstory)
- Personality sliders (formal↔casual, serious↔playful, introvert↔extrovert)
- Interests/hobbies tags
- Speaking style selector

### 🆕 Phase 8 — Dialogue & greetings (1 hafta)
**Features:** `[2.8]` `[2.9]` `[2.11]` `[2.15]`
- Example dialogue / greeting messages per character
- Custom system prompt editor (advanced)
- Relationship slider (stranger → friend → close)
- Favorites/recent quick access

### 🆕 Phase 9 — Category + filters + switch (1 hafta)
**Features:** `[2.1]` `[2.2]` `[2.14]`
- Category filters (Teacher / Friend / Therapist / Coach / Celebrity)
- Enhanced character gallery (Pi-style)
- Character switching mid-conversation

### 🆕 Phase 10 — Character memory + mood (1 hafta)
**Features:** `[2.10]` `[2.12]`
- Character-specific memory/lore (persistent per character)
- Character mood that changes day-to-day

---

## 🎭 VISUAL / AVATAR → v1.0

### 🆕 Phase 11 — Static portraits gallery (0.5 hafta)
**Features:** `[3.1]`
- Built-in static portraits (anime / realistic / 3D render)
- Portrait licensing/curation

### 🆕 Phase 12 — 3D VRM + lip-sync (2 hafta)
**Features:** `[3.2]` `[3.4]` `[3.6]` `[3.7]`
- TalkingHead.js + VRM loader
- Full-body avatar
- Audio-based lip-sync (ARKit visemes)
- Idle animations (breath, blink)
- Gaze direction (AI looks at user)

### 🆕 Phase 13 — Facial expressions + reactions (1 hafta)
**Features:** `[3.5]` `[3.8]` `[11.3]`
- Facial expressions (smile/concern/surprise) from LLM mood tag
- Animated reactions (nods, hand gestures)
- Avatar blinks while AI "thinking"

### 🆕 Phase 14 — Avatar customization (1.5 hafta)
**Features:** `[3.3]` `[3.9]` `[3.14]`
- Hair, face, clothes, body editor (VRoid Hub integration)
- 2D Live2D rig alternative
- Scene / background customization

---

## 💬 CONVERSATION CONTROLS → v1.0-v1.5

### 🆕 Phase 15 — Message actions (1 hafta)
**Features:** `[4.3]` `[4.4]` `[4.5]` `[4.6]` `[4.7]`
- Search chat history
- Bookmark messages
- Regenerate response (swipe for alt reply)
- Edit AI's last reply
- Copy / share message

### 🆕 Phase 16 — Swipe gestures + read receipts (0.5 hafta)
**Features:** `[11.4]` `[11.5]` `[11.6]`
- Chat bubbles with read receipts
- Swipe to regenerate/delete
- Pull-to-refresh (mobile prep)

### 🆕 Phase 17 — Voice messages + proactive (1 hafta)
**Features:** `[4.12]` `[4.14]` `[4.18]`
- Daily check-ins ("how are you?")
- Follow-up questions (AI keeps convo going — prompt tuning)
- Voice messages (async, WhatsApp-style)

### 🆕 Phase 18 — Topic suggestions (0.5 hafta)
**Features:** `[4.11]`
- Starter prompts pool
- Topic chips above input

---

## ✍️ GRAMMAR LEARNING → v1.5

### 🆕 Phase 19 — LanguageTool self-host (1 hafta)
**Features:** `[5.3]` `[5.4]`
- LT JAR auto-install (OpenJDK portable)
- Real-time inline correction
- "By the way" style toggle

### 🆕 Phase 20 — Grammar explanations (1 hafta)
**Features:** `[5.5]`
- "Why?" expandable cards
- LLM-generated Uzbek explanation per rule
- Rule category colour-coding

### 🆕 Phase 21 — Grammar skill tree (2 hafta)
**Features:** (new `[5.x]` bucket — Duolingo-style)
- 60 built-in units (A1-C1)
- 6 exercise types (MC, fill-in, translate, reorder, listen, speak)
- Progress tracking

### 🆕 Phase 22 — Grammar pack import (1.5 hafta)
**Features:** (book-based learning)
- Lesson pack JSON format
- Community pack repo (GitHub)
- PDF import → LLM parse (Murphy / Cambridge style)

---

## 📚 VOCABULARY → v1.5

### 🆕 Phase 23 — Vocabulary FSRS module (2 hafta)
**Features:** `[5.11]`
- FSRS algorithm (ts-fsrs)
- Built-in decks (Oxford 3000, IELTS AWL, Business, Travel)
- Flashcard UI + 4-button rating
- Daily vocab goal

### 🆕 Phase 24 — Auto-vocab from speaking (1 hafta)
**Features:** `[5.6]` `[5.7]`
- Speaking transcript → LLM extracts new words
- Auto-suggest add to deck
- AI-generated example sentences per word
- Vocabulary suggestion in-chat

### 🆕 Phase 25 — Vocab gamification (0.5 hafta)
**Features:** `[6.6]` (partial — for vocab)
- Mastery % per deck
- Word cloud visualization
- Weakness heatmap

---

## 🎤 TTS UPGRADE → v1.5

### 🆕 Phase 26 — Kokoro TTS sidecar (1.5 hafta)
**Features:** `[1.10]` (upgraded — multi-accent)
- Python bootstrap (portable Python)
- Kokoro daemon (4-accent neural TTS)
- Character-voice mapping

### 🆕 Phase 27 — Voice cloning (XTTS-v2) (1.5 hafta)
**Features:** `[1.12]` `[10.4]`
- Audio sample upload (6-10 sek)
- Per-character custom voice
- Community voice library

### 🆕 Phase 28 — Emotion + style TTS (1 hafta)
**Features:** `[1.5]` `[1.6]` `[1.7]` `[1.8]` `[1.9]`
- SSML tags (excited/calm/sad)
- Human-like fillers ("um", "hmm")
- Mid-sentence self-correction prompt
- Laugh/breath/sigh tokens
- Whisper voice preset (intimate)

---

## 🎯 4-SKILL COVERAGE → v1.5

### 🆕 Phase 29 — Pronunciation scoring (2 hafta)
**Features:** `[5.8]` `[5.9]` `[5.10]`
- wav2vec2-phoneme aligner
- Per-word colour-coded feedback (green/yellow/red)
- Shadowing practice (repeat after AI)
- Slow/normal/fast replay

### 🆕 Phase 30 — Accent training (1 hafta)
**Features:** `[5.20]`
- Target accent selector (RP/GA/AU/IN)
- Phoneme mistake trends
- Minimal pair drills
- Weekly "accent proximity" score

### 🆕 Phase 31 — Listening module (2 hafta)
**Features:** `[5.17]` `[5.10]`
- Podcast library (BBC/VOA RSS feeds)
- Interactive transcript player + word tap
- Dictation mode
- Comprehension questions (LLM)
- Tempo control (0.5-1.5×)

### 🆕 Phase 32 — Reading module (2 hafta)
**Features:** `[5.16]`
- 200+ graded articles
- Double-click word → definition popup
- Highlight above-level words
- "Ask AI" paragraph explanation (Uzbek)
- Reading WPM + summary exercise
- Custom URL/PDF/EPUB import

### 🆕 Phase 33 — Writing module (2 hafta)
**Features:** `[5.18]`
- 100+ IELTS/TOEFL prompts
- 4-criterion AI rubric
- Real-time LT hints + style suggestions
- Email templates (30+)
- Timed mode (IELTS simulator)

---

## 🧩 LESSON MODES + SCENARIOS → v2.0

### 🆕 Phase 34 — Lesson modes (1.5 hafta)
**Features:** `[5.12]` `[5.13]`
- Chat / Sentence / Word / Dialogue modes (TalkPal-style)
- Pre-scripted dialogues (Pimsleur-style)

### 🆕 Phase 35 — Roleplay scenes (2 hafta)
**Features:** `[4.15]` `[5.14]`
- 50+ scenarios (interview, restaurant, airport, dating, complaint, pitch)
- Scene editor (admin)
- Success criteria rubric per scene

### 🆕 Phase 36 — Debate + Group chat (1.5 hafta)
**Features:** `[2.13]` `[4.16]`
- Debate mode (AI takes opposite)
- Multi-character group chat (2-3 AI)
- Turn-taking rules

### 🆕 Phase 37 — Difficulty scaling (1 hafta)
**Features:** `[5.15]`
- Real-time CEFR tracking
- Dynamic prompt difficulty
- Auto-adjustment notifications

---

## 🏆 EXAM PREP → v2.0

### 🆕 Phase 38 — Exam simulators (2-3 hafta)
**Features:** `[5.19]`
- IELTS full test (L+R+W+S)
- TOEFL iBT simulator
- CEFR checkpoint (50-60 Q)
- Band score rubric
- AI examiner (3-part speaking)
- 5+ mock tests per exam

---

## 🧠 AI MEMORY + PERSONALIZATION → v2.0

### 🆕 Phase 39 — Long-term AI memory (1.5 hafta)
**Features:** `[4.8]` `[4.9]` `[4.10]`
- Vector DB (ChromaDB local)
- RAG over past sessions
- Key facts panel (name/job/hobbies)
- Memory editor (view/delete)

### 🆕 Phase 40 — Mood tracking (1 hafta)
**Features:** `[4.13]`
- Daily mood survey
- Mood graph over time
- AI adapts tone to user mood

### 🆕 Phase 41 — Scheduled conversations (0.5 hafta)
**Features:** `[4.17]`
- Schedule AI "calls" at set times
- Pre-conversation reminders

---

## 🎮 GAMIFICATION → v2.0

### 🆕 Phase 42 — Streaks + XP + Levels (1.5 hafta)
**Features:** `[6.1]` `[6.2]` `[6.3]` `[6.4]`
- Daily streak counter
- Streak freeze / repair (rescue missed day)
- XP / points system
- Level progression (A1 → C2 bar)

### 🆕 Phase 43 — Goals + Heatmap + Stats (1 hafta)
**Features:** `[6.5]` `[6.6]` `[6.10]` `[6.11]`
- Weekly goals (minutes/conversations)
- Activity heatmap (GitHub-style)
- Personal bests
- Fluency score (WPM, pause, vocab range)

### 🆕 Phase 44 — Achievements + Unlocks (0.5 hafta)
**Features:** `[6.7]` `[7.5]`
- 30+ badges
- Level-up celebration animations
- "Unlocked new character!" moments

---

## 🔔 ENGAGEMENT → v2.5

### 🆕 Phase 45 — Notifications + reminders (1 hafta)
**Features:** `[7.1]` `[7.4]`
- Push notifications (daily reminder)
- Streak-at-risk alerts
- Desktop toast (Electron)

### 🆕 Phase 46 — Proactive AI messages (0.5 hafta)
**Features:** `[7.2]` `[7.7]`
- "Your AI misses you" messages
- Random icebreaker / topic

### 🆕 Phase 47 — Daily quest + Email digest (1 hafta)
**Features:** `[7.3]` `[7.6]` `[6.9]`
- Daily quest / challenge
- Weekly summary email (PDF export fallback)
- Daily quest completion celebration

---

## 🌐 MARKETPLACE + COMMUNITY → v2.5

### 🆕 Phase 48 — Character marketplace (1.5 hafta)
**Features:** `[2.3]` `[10.2]` `[10.3]`
- Remote catalog (GitHub-hosted)
- Download/install flow
- User submissions via PR
- Character ratings/reviews

### 🆕 Phase 49 — Voice library + Friends (1 hafta)
**Features:** `[10.1]` `[10.4]` `[6.8]`
- Community voice marketplace
- Friend list (local network)
- Leaderboards (friends-only)

### 🆕 Phase 50 — Community forum link (0.5 hafta)
**Features:** `[10.5]`
- In-app link to Discord/GitHub Discussions
- "Report character" / feedback flow

---

## 🛠️ PRODUCTIVITY → v2.5

### 🆕 Phase 51 — Global hotkey + Quick lookup (1 hafta)
**Features:** (utility, complements `[5.6]`)
- Ctrl+Shift+L anywhere → word definition
- Ctrl+Shift+T → clipboard translate
- Offline WordNet + CMU dictionary (~50 MB)

### 🆕 Phase 52 — Browser extension (2 hafta)
**Features:** (extension complement)
- Chrome/Firefox/Edge ext
- Highlight difficult words on any site
- Right-click → "Add to vocab"
- "Explain in Uzbek" tooltip

### 🆕 Phase 53 — Desktop widget (0.5 hafta)
**Features:** (desktop complement)
- Taskbar mini ("Today's 5 words")
- Quick-review mini-window

### 🆕 Phase 54 — Calendar integration (0.5 hafta)
**Features:** (schedule complement)
- iCal / Google Calendar export
- Learning slots visualization

---

## 👪 MULTI-PROFILE + PARENTAL → v2.5

### 🆕 Phase 55 — Multi-profile + Parental (1 hafta)
**Features:** `[8.8]` `[8.9]` `[12.5]`
- Family mode (separate profiles)
- Profile switcher
- Parental controls (time limits, content filters)
- Content safety filter (toxicity)
- Age gate

### 🆕 Phase 56 — Teacher dashboard (1.5 hafta)
**Features:** (edu)
- Student progress view
- Assignment creator
- Local network (mDNS) discovery
- Class-wide analytics

---

## 📱 MOBILE + SYNC → v2.5

### 🆕 Phase 57 — Mobile companion (3 hafta)
**Features:** `[8.5]` `[11.6]` `[11.7]`
- Capacitor build (iOS + Android)
- Flashcard review on mobile
- Voice chat on phone
- Pull-to-refresh + haptic feedback

### 🆕 Phase 58 — Device sync (1 hafta)
**Features:** `[8.5]`
- Local network sync (mDNS)
- Progress / vocab sync (no cloud)
- Handoff across devices

---

## 🔐 PRIVACY + CONTENT SAFETY → v3.0

### 🆕 Phase 59 — Privacy controls (1 hafta)
**Features:** `[8.3]` `[8.4]` `[12.2]` `[12.3]` `[12.4]`
- Export chat (PDF, TXT)
- Delete history (per-character or all)
- Incognito mode (conversations not saved)
- Data export GDPR (everything in JSON)
- In-app content moderation

---

## 💳 MONETIZATION (ixtiyoriy) → v3.0

### 🆕 Phase 60 — Monetization (1.5 hafta)
**Features:** `[9.1]` `[9.2]` `[9.3]` `[9.4]` `[9.5]` `[9.6]`
- Free tier (limited messages/day)
- Monthly subscription tier
- Annual plan discount
- In-app purchases (voice packs, characters, outfits)
- Referral program
- Free trial (7-14 days premium)

---

## 🎨 POLISH + LOCALIZATION → v3.0

### 🆕 Phase 61 — i18n (1 hafta)
**Features:** `[8.10]`
- O'zbek / English / Russian UI
- Native-language rule explanations
- Translation manager (admin)

### 🆕 Phase 62 — Accessibility (1 hafta)
**Features:** `[8.2]`
- Keyboard nav
- Screen reader labels
- Font size controls
- High-contrast mode

### 🆕 Phase 63 — Packaging + Auto-update (1.5 hafta)
**Features:** (release-critical)
- electron-builder NSIS installer
- Auto-update via GitHub Releases
- First-run wizard (Ollama auto-install)
- Code signing (optional)

### 🆕 Phase 64 — Analytics + Error reporting (1 hafta)
**Features:** (ops)
- Opt-in telemetry (anonymous)
- Crash reports (Sentry local)
- "Report issue" one-click
- Performance monitor

---

## 🔮 FRONTIER R&D → v3.0+

### 🆕 Phase 65 — True S2S model (2 hafta)
**Features:** `[1.3]`
- Sesame CSM-1B (GPU variant)
- Moshi / Ultravox option
- Sub-500 ms latency path

### 🆕 Phase 66 — Webcam + Selfies (1.5 hafta)
**Features:** `[3.13]`
- MediaPipe engagement detection
- Stable Diffusion local → AI-generated character selfies

### 🆕 Phase 67 — AR mode (2 hafta)
**Features:** `[3.10]`
- Camera + avatar overlay (Replika-style)
- WebXR spatial

### 🆕 Phase 68 — VR mode (2-3 hafta)
**Features:** `[3.10]`
- Quest / Vision Pro spatial chat
- Room-scale avatar

---

# ✅ Feature coverage table — har xususiyat qaysi phase'da

| Category | Features | Phases |
|---|---|---|
| **1. Voice & Audio** (18) | 1.1→3, 1.2→4, 1.3→65, 1.4→4, 1.5-1.9→28, 1.10→1+26, 1.11→5, 1.12→27, 1.13→1, 1.14→2, 1.15→1, 1.16-1.18→5 |
| **2. Character** (15) | 2.1→1+9, 2.2→9, 2.3→48, 2.4-2.7→7, 2.8→8, 2.9→8, 2.10→10, 2.11→8, 2.12→10, 2.13→36, 2.14→9, 2.15→8 |
| **3. Visual/Avatar** (14) | 3.1→11, 3.2→12, 3.3→14, 3.4→12, 3.5→13, 3.6→12, 3.7→12, 3.8→13, 3.9→14, 3.10→67+68, 3.11→3, 3.12→3, 3.13→66, 3.14→14 |
| **4. Conversation** (20) | 4.1-4.2→1, 4.3-4.7→15, 4.8-4.10→39, 4.11→18, 4.12→17, 4.13→40, 4.14→17, 4.15→35, 4.16→36, 4.17→41, 4.18→17, 4.19-4.20→1 |
| **5. Learning** (20) | 5.1-5.2→0, 5.3→19, 5.4→19, 5.5→20, 5.6→24, 5.7→24, 5.8→29, 5.9→29, 5.10→29+31, 5.11→23, 5.12→34, 5.13→34, 5.14→35, 5.15→37, 5.16→32, 5.17→31, 5.18→33, 5.19→38, 5.20→30 |
| **6. Gamification** (11) | 6.1-6.4→42, 6.5→43, 6.6→43, 6.7→44, 6.8→49, 6.9→47, 6.10-6.11→43 |
| **7. Engagement** (7) | 7.1→45, 7.2→46, 7.3→47, 7.4→45, 7.5→44, 7.6→47, 7.7→46 |
| **8. Settings** (10) | 8.1→0, 8.2→62, 8.3-8.4→59, 8.5→58, 8.6-8.7→2, 8.8-8.9→55, 8.10→61 |
| **9. Monetization** (6) | 9.1-9.6→60 |
| **10. Social** (5) | 10.1→49, 10.2→48, 10.3→48, 10.4→27+49, 10.5→50 |
| **11. UI/UX** (10) | 11.1-11.2→3, 11.3→13, 11.4-11.6→16, 11.7→57, 11.8-11.10→3 |
| **12. Privacy** (5) | 12.1→0+1, 12.2-12.4→59, 12.5→55 |

**Jami:** 141 xususiyat → 68 phase. **Barcha** ro'yxatdagi xususiyatlar qamrab olingan.

---

# 📊 Release calendar

| Release | Phase'lar | Vaqt | Muhim milestone |
|---|---|---|---|
| **v0.1 alpha** | 0-2 | 5 hafta | Basic speaking ishlaydi |
| **v1.0 beta** | 3-18 | 20 hafta | Pi-quality voice companion |
| **v1.5 learning** | 19-33 | 20 hafta | To'liq 4 ko'nikma + grammar/vocab |
| **v2.0 exams** | 34-44 | 15 hafta | IELTS/TOEFL-class + memory + gamification |
| **v2.5 ecosystem** | 45-58 | 17 hafta | Community + mobile + productivity |
| **v3.0 complete** | 59-68 | 15 hafta | Privacy + monetization + frontier |

**Jami:** ~92 hafta = **~22 oy** to'liq dasturni qurish (1 kishi, hafta 20-25 soat).

Agar 40 soat/hafta ishlasangiz — **~11 oy**.

---

# 🎯 Mening tavsiyam

**Tartibni aynan shu tarzda qoldiring** — har phase oldingisiga tayanadi:

- Avval **voice ishlashi kerak** (3, 4, 5) — user asosiy "companion" his-tuyg'usini oladi
- Keyin **character polish** (6-10) — AI "kim" ekanini aniqlaydi  
- **Avatar** (11-14) — visually ishtirokni kuchaytiradi
- **Conversation controls** (15-18) — professional hiskashdirish
- So'ng **learning core** (19-25) — o'rganish uchun asosiy
- **TTS upgrade** (26-28) — ovoz sifati
- **4-skill** (29-33) — to'liq platforma
- Qolgani yuqoridagi kabi

<br>

**Keyingi qadam — bitta komanda:**

> **`START: Phase 3`** — Call mode UI dan boshlash (tavsiya)

Yoki boshqa phase'ni tanlang:
- `START: Phase 4` — streaming pipeline
- `START: Phase 12` — 3D VRM avatar
- `START: Phase 39` — AI memory

Yozing, darhol kodni yozishni boshlayman.

Agar saqlashingizni xohlasangiz, men bu roadmap'ni **memory faylga** ham yozib qo'yaman — yo'qotmaysiz.