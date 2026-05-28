# Companion / Character system — full requirements (resume later)

> **Status (2026-05-28):** Captured from user requests across 4 messages.
> Implementation deferred — user said "kein gaplashamiz" (we'll talk
> later). This doc is the single brief to resume from.

## 1 · What the user asked for

Across 2 messages, the user described a comprehensive overhaul of the
companion / character system. Verbatim asks:

- "settings'da character tanlash va unga ovz tanlash juda chalkash" —
  current Settings → Companion is confusing and weak.
- "boshqa AI tutor app'larni o'rganib chiq, character qanday tanlanadi,
  qanday unga ovoz va boshqa config'lari bor" — review competitor flows
  for how character + voice + other configs are picked.
- "characterlarni ham config'larni ham shu kabi qilib ber" — match the
  depth and polish of those competitors.
- "alohida tab'da character gallery, undan character'ga bosib unga
  config qilish mumkin bo'lsin" — dedicated gallery tab + per-character
  config drilldown.
- "default character uchun yosh, ism va boshqa harakteristikalarini
  o'zgartish" — every default character is fully editable.
- "yuqoridagi URL'lardagi kabi web saytlardan characterlarni olib
  ishlat hozircha 20 ta ayol va erkak va har xil yoshdagi" — 20
  characters total, mix of male/female, mix of ages.
- "characterlar 3D bo'lsin va yuqoridagi saytlardagi dek bo'lsin,
  lablari, facial expression bo'lsin, threejs ishlat" — 3D characters
  built with Three.js, lip-sync and facial expressions.
- "fling'da 18+ characterlar ham bor ekan, yoshi 18 dan kichiklarga
  normal avatarlar, 18+ kattalarga 18+ avatarlar ham" — age-gated
  avatars: under-18 sees safe avatars, 18+ adults see more options.
- "real yoshni aniqlash uchun logikasini o'ylab chiqish kerak" — design
  a real age-verification logic, not just a checkbox.
- "flingapp'dagi full hamma characterlarni yuklab oll" — download all
  Fling's characters (see legal section below).
- "fling app'ni full o'rganib chiq companion bo'libmi ful studiya kabi
  bo'lsin, character'ni kiyintirib full customization qilish imkoni
  bo'lsin, Instagram avatar creator kabi" — full studio: dress the
  character, deep customization à la Instagram avatars.
- "manshu flingapp dagi sensorani buzmaydigan characterlarni download
  qilib ishlata olamizmi" — can we use only the non-explicit characters
  from Fling? (See section 5.)

## 2 · Sources reviewed

| URL | Useful patterns | Reject |
|---|---|---|
| `web.flingapp.ai` (Discover, Roleplay, Games, Create Character) | Big card grid; 6-step character creator (Style/Gender/Build-Visually/Write-Prompt/Ethnicity/Age/Hair); roleplay scenario library; influencer studio | Sexualized names ("Fuck Hole, 18", "Cum slut, 18", "Whore, 25"); strip dice; adult-companion business model |
| `seaart.ai/ru/character` | Character library + tag filter | (Not deeply scoped yet) |
| `chatreal.ai/ru` | AI companion with character grid | (Not deeply scoped yet) |
| (Fling Create Character screen, 6 steps) | **Step 1**: Style (Realistic / Anime) → **Step 2**: Gender → **Build Visually vs Write a Prompt** toggle → **Ethnicity** chips (Caucasian/Asian/Latina/Middle Eastern/Black/Indian) → **Age slider** → **Hair Type** (Straight/Wavy/Curly/Afro) → next steps: outfit / body / personality / voice | The fact that the demo shows a 21-year-old in a low-cut red dress as default — we use family-friendly defaults |

## 3 · Our character system — final design

### 3.1 Routes

- `/companions` — gallery (replaces the current row in Settings)
- `/companions/:id` — drill-down: character profile + chat history + edit
- `/companions/new` — 6-step character creator (see §3.3)
- `/companions/studio/:id` — 3D avatar workshop for that character
- `/avatar-studio` — same workshop targeting the user's own avatar

### 3.2 Character data model (extends `CharacterInfo`)

```ts
interface CharacterInfo {
  id: string
  name: string
  // NEW
  age: number                        // 18-65, hard min 18
  gender: 'female' | 'male' | 'nb'
  ethnicity: string                  // free-text + presets
  hometown?: string
  bio: string                        // short bio
  backstory?: string                 // longer paragraph
  // visual
  avatar3d?: Avatar3dConfig          // full 3D rig — see §3.4
  avatar2dUrl?: string               // fallback flat image
  outfit?: OutfitConfig
  // voice
  accent: Accent
  voiceURI: string
  // personality
  personality: { formality, playfulness, energy }   // 0–100 sliders
  speakingStyle: 'neutral'|'formal'|'casual'|'slang'|'academic'|'childish'
  interests: Interest[]
  // teaching style
  teachingStyle: 'patient' | 'strict' | 'fun' | 'academic' | 'casual' | 'native-young' | 'native-elder'
  // prompt
  customSystemPromptExtras?: string
  // safety
  contentRating: 'all-ages' | '13+' | '18+'         // see §6
  isCustom: boolean
}
```

### 3.3 Six-step character creator (matches Fling pattern, family-friendly defaults)

1. **Identity** — name, age slider (default 25, min 18), gender (Female /
   Male / Non-binary).
2. **Visual style** — Realistic / Stylized 3D / Anime. Toggle: **Build
   visually** (sliders) vs **Write a prompt** (free-text → AI generates).
3. **Looks** — Ethnicity preset (with optional override), Hair (type,
   length, color), Eyes (color, shape), Skin tone slider, Body type
   slider — all **clothed and modest by default**.
4. **Personality** — 3 sliders (formality / playfulness / energy) +
   speaking style picker + interests chips + teaching style.
5. **Voice** — Accent (US/UK/AU/IN/PH/IT/JP/FR/ES/DE/RU/CA/IE/ZA),
   SpeechSynthesisVoice picker, optional voice-clone upload (XTTS in
   Phase 6).
6. **Backstory + bio** — short bio (1 line for gallery) + long backstory
   + custom system-prompt extras. Save → published to user's library.

Each step has Back / Next; "Save as draft" anywhere; Skip-to-step rail
on top (1 of 6 progress bar like Fling's).

### 3.4 3D avatar (Three.js)

- **Engine**: Three.js + a free GLTF base mesh (Ready-Player-Me has a
  free dev tier; the kit `vrm` library is another option).
- **Customizable parts**:
  - Head: face shape, jawline, cheek width
  - Hair: 12 style presets × color picker
  - Eyes: color + shape
  - Skin: tone slider + freckles/markings toggle
  - Outfit: top/bottom/shoes preset combinations (modest, school-/work-
    /casual themed — NO swimwear / lingerie / cropped tops below
    school-uniform threshold)
  - Accessories: glasses, hat, earrings
- **Animation**:
  - Idle breathing loop
  - Talking: viseme morph targets driven by phoneme-aware audio
  - Emotion: 6 expressions (neutral, smile, curious, surprised, gentle
    encouragement, "you've got this")
- **Performance**: GLTF compressed with Draco, capped at 60fps, falls
  back to 2D avatar on weak devices (Tier T0 in `tiers.md`).

## 4 · Character gallery (20 starter characters)

Diverse 18-65, mixed gender, mixed background, mixed accents. **Examples
only** — final list is the user's call. ALL names are real-person names
or polite nicknames. NO sexual / suggestive nomenclature.

| # | Name | Age | Gender | Origin | Accent | Style |
|---|---|---|---|---|---|---|
| 1 | Emma Carter | 28 | F | UK | UK-RP | Patient, friendly |
| 2 | James Lee | 34 | M | US | US-General | Academic, strict |
| 3 | Marco Bianchi | 41 | M | Italy | IT-EN | Fun, expressive |
| 4 | Priya Sharma | 22 | F | India | IN-EN | Gentle, encouraging |
| 5 | Yui Tanaka | 19 | F | Japan | JP-EN | Shy, slow-paced |
| 6 | Liam O'Connor | 26 | M | Ireland | IE-EN | Casual, slang-heavy |
| 7 | Nadia Reyes | 31 | F | Philippines | PH-EN | Warm, conversational |
| 8 | Sasha Kovalenko | 24 | M | Ukraine | RU-EN | Travel-focused |
| 9 | Wei Lin | 29 | M | China | ZH-EN | Business-English |
| 10 | Sofía García | 35 | F | Spain | ES-EN | Cultural insights |
| 11 | Hans Müller | 52 | M | Germany | DE-EN | Strict grammar |
| 12 | Aiko Mori | 27 | F | Japan | JP-EN | Cute, anime-style speech |
| 13 | Carlos Mendes | 38 | M | Brazil | PT-EN | Friendly, music lover |
| 14 | Aaliyah Johnson | 45 | F | US | US-Southern | Storyteller |
| 15 | Olivia Wright | 65 | F | UK | UK-RP | Grandmotherly, formal |
| 16 | Hassan Al-Farsi | 30 | M | UAE | AR-EN | Business + travel |
| 17 | Mei Chen | 18 | F | Taiwan | TW-EN | Pop-culture / K-drama fan |
| 18 | Ravi Iyer | 42 | M | India | IN-EN | Engineering + tech |
| 19 | Catalina López | 33 | F | Mexico | MX-EN | Energetic |
| 20 | Tom Reed | 48 | M | Australia | AU-EN | Outdoorsy slang |

## 5 · Asset sourcing — what's legal

User asked: "non-explicit characters'larni fling'dan download qilib
ishlata olamizmi?"

**Short answer: no, even for the non-explicit ones.** Reasons:

1. **ToS violation.** `flingapp.ai` Terms forbid bulk download +
   reuse of their imagery. Same for `seaart.ai`. Pulling them
   exposes us to a takedown + invalidates any App Store submission
   (App Store + Play asks for proof of asset rights).
2. **Brand confusion.** Even one image cross-listed between our
   English-learning app and Fling's adult companion app links our
   brand to theirs in image-search / lawsuit discovery.
3. **AI-provenance unclear.** Fling's images are AI-generated but we
   can't tell which model, what training data, or whether the
   underlying generator's license permits commercial use.

**What we use instead** — every option below is legally clean for
commercial reuse:

| Source | License | Use case |
|---|---|---|
| **Generate our own with Flux.1-schnell / Stable Diffusion XL via Pollinations.ai or HuggingFace Inference** | Apache 2 / SD-XL license, royalty-free | Hero portraits per character — our prompts, our brand |
| **Unsplash / Pexels** | Unsplash License (free commercial, no attribution required) | Stock human portraits where we want real photography |
| **DiceBear / Notion-style avatars** | Free / CC-BY | Generic UI avatars (already used in `AvatarCircle`) |
| **Ready Player Me free tier** | Free for indie + free hobby use, attribution OK | 3D head/body rig for the avatar studio |
| **Mixamo (Adobe)** | Free for commercial use | Body animations (idle, talking, gestures) |

Recommended pipeline: generate all 20 starter portraits via Flux at
1024×1024 with our prompt template ("modest professional headshot,
realistic photography, neutral expression, clean background"). Store
under `public/avatars/c_emma.jpg` etc. Sourced + committed legally.

## 6 · Age verification + content ratings

Detailed design — implementation in Task #55.

**Verification flow:**
1. Onboarding adds a `birthDate` (full DOB picker, no "I am 18+"
   checkbox).
2. `profile.birthDate` → computed `ageBand`:
   - **<13** → `child` band
   - **13–17** → `teen` band
   - **18+** → `adult` band
3. Re-prompt DOB if `profile.birthDate` is edited > 1 time per year
   (anti-bypass). After the second edit, lock the field and ask for an
   ID upload (Phase 9 KYC).
4. Show the current age-band as a small chip on the user's profile +
   in Settings.

**Content gates per band:**

| Feature | `child` (<13) | `teen` (13–17) | `adult` (18+) |
|---|---|---|---|
| Speaking practice (AI tutor) | ✅ (kids voice) | ✅ | ✅ |
| Courses + Library | ✅ filtered | ✅ | ✅ |
| Exams (IELTS/TOEFL/CEFR) | ✅ | ✅ | ✅ |
| Community feed (read) | ✅ filtered | ✅ | ✅ |
| Community feed (post) | ❌ | ✅ moderated | ✅ |
| Inbox DMs | ❌ to non-mutuals | ✅ to mutuals only | ✅ |
| Live partner (OmeTV-style 1:1) | ❌ | ❌ | ✅ |
| Tutor marketplace (paid 1:1) | ❌ | ❌ (parental email gate) | ✅ |
| Group video chat | ❌ | ✅ teen-only rooms | ✅ |
| Custom character with backstory containing romance / adult themes | ❌ | ❌ | ✅ |
| Stripe Connect / payouts | ❌ | ❌ | ✅ 18+ + ID |

**Content rating per character:**
- All 20 starter characters launch as `all-ages`.
- Users can mark THEIR OWN custom character as `18+` from inside the
  Companion studio. That character is then hidden from teen / child
  accounts even on shared devices.
- `18+` does NOT mean adult / NSFW in our app — it means "the character's
  backstory or personality is more mature" (tutor for business
  negotiations, dating-app coach, etc.). NSFW remains entirely off the
  platform — see PLAN.md §3 "ielts.gg analysis" ethical scope notes.

## 7 · Why no 18+ companion / NSFW

Already covered in `docs/PLAN.md` §3 Fling AI / SeaArt observations,
but consolidated here for the resume-later context:

1. **Brand fit.** This is a CEFR / IELTS / Cambridge / TOEFL prep app.
   Children A1-A2 are in the target audience. Adult companion features
   are incompatible.
2. **Distribution.** App Store + Play Store educational category
   prohibits adult content. We'd be force-rejected.
3. **Payments.** Stripe Restricted Businesses §4 prohibits "adult chat
   or relationship services". Stripe terminates accounts.
4. **Anthropic policy.** I (the AI assistant) cannot generate sexualized
   content involving 18-year-olds or "barely legal" framing.

This is a settled boundary — not negotiable.

## 8 · Resume checklist

When the user is ready to push on this, the order of work is:

- [ ] Generate 20 portrait images with Flux/SDXL using our prompt
      template (1024×1024 JPG, ~150 KB each). Commit to `public/avatars/`.
- [ ] Expand `shared/constants/characters.ts` from 6 → 20 entries with
      the table in §4.
- [ ] Build `/companions` gallery route (use ExplorePage as scaffold —
      grid layout works well).
- [ ] Build the 6-step character creator at `/companions/new`. Reuse
      `Tabs` for the step indicator. Forms wire to `profile.customCharacters`.
- [ ] Build `/companions/studio/:id` with Three.js + RPM/VRM base mesh.
- [ ] Wire `RequireAge` HOC across `/live`, `/meet`, `/tutors`,
      `/inbox` based on `ageBand`.
- [ ] DOB onboarding step (before language step).
- [ ] Re-prompt + lock logic in store.

Estimated session count: 4-5 batches similar in size to Y1-Y5.

## 9 · Linked memory + tasks

- `docs/PLAN.md` §3 Fling AI / SeaArt observations
- TaskCreate #53–#58 (character gallery / 3D studio / age verify /
  workshop / scope doc) — all created `2026-05-28`.
- Memory: `[[feedback_capture_asks_immediately]]` — the rule that
  forced this whole doc to be saved instead of getting lost.
