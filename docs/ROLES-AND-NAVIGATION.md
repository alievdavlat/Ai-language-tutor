# Roles & Navigation — how to test every view

The app has three roles. Role is stored locally (`speakai.role`) — there is no
separate login per role yet (Clerk integration is Task #3). To review each
view, **switch roles** rather than creating separate logins.

## Switch role (test Student / Teacher / Owner)

- **Account page → "Switch role (testing)"**: three buttons — Student, Teacher,
  Owner (Admin). Picking one sets the role and opens that role's home.
  - Reach the Account page from the sidebar account badge at the bottom, or go
    to `/#/account`.
- **Keyboard:** `Ctrl + Shift + A` anywhere → become Owner/Admin and open `/admin`.

Seed identities you'll see around the app (real backend rows):
- Teachers: **Emma Carter** (`u_emma`), James Lee (`u_james`), Marco Bianchi (`u_marco`)
- Students: **Priya Sharma** (`u_priya`), Wei (`u_wei`), Yui Tanaka (`u_yui`)
Open any of them via search → click, or `/#/channel?id=u_priya`.

## Where things are (routes)

**Student / learner (sidebar):**
| Page | Route |
|---|---|
| Home | `/home` |
| Courses | `/courses` · detail `/course/:id` |
| Library (videos/books/audio) | `/library` · book reader `/library/book/:id` |
| Vocabulary | `/vocabulary` · review `/vocabulary/review` |
| Dictionary / phrasebook | `/dictionary` |
| Progress (+ Goals & Streak tab) | `/progress` |
| Speaking / Call | `/speaking` · `/speaking/call` |
| Clips | `/clips` |
| Writing Coach | `/writing` |
| Speaking partner (Meet) | `/meet` |
| Exams | `/exams` (IELTS/TOEFL/CEFR/SAT/GMAT) |
| Stories / Shadowing / Watch | `/stories` · `/shadowing` · `/watch` |
| Community / Explore / Buddy | `/community` · `/explore` · `/buddy` |
| Live / quiz | `/live` · `/quiz/live` |
| Profile / Account / Settings | `/profile` · `/account` · `/settings` |
| Notifications / Inbox | `/notifications` · `/inbox` |

> Productivity (global hotkey, widget, extension) moved into **Settings →
> Productivity**. Downloads/offline is hidden until the cloud layer lands.

**Teacher (role = teacher):**
| Page | Route |
|---|---|
| Dashboard | `/teacher` |
| Creator Studio (build + bulk import + seed) | `/studio` |
| My channel | `/channel` |
| Lesson builder (TED-Ed) | `/teacher/new` |
| Course builder | `/teacher/course/new` |
| Clips composer | `/teacher/clips` |
| YouTube connect | `/teacher/youtube` |
| Analytics / Students / Monetization / Live | `/teacher/analytics` · `/teacher/students` · `/teacher/monetization` · `/teacher/live` |

**Owner / Admin (role = admin):**
| Page | Route |
|---|---|
| Admin panel (moderation, featured, users) | `/admin` |

Reach it with `Ctrl+Shift+A` or Account → Switch role → Owner.

## Notes
- Paid courses are locked until purchased (Buy/Subscribe → unlock). Free courses
  enroll in one tap.
- After pulling new code, restart `npm run dev` and hard-reload (`Ctrl+Shift+R`).
  If old seeded data lingers, run `localStorage.clear()` once in DevTools.
