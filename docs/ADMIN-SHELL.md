# Admin shell & permission model — interface contract (#A55 / #A57)

This document is the agreed interface between **#A55 (role hierarchy + permissions —
done in this branch)** and **#A56 (admin CMS+CRM)** / **#A57 (admin scope vs teacher
scope)**. #A55 owns the *shell and the permission layer*; #A56 owns the *content of
the admin console*. Do not build a second shell — plug into this one.

## Role hierarchy

```
student  <  teacher  <  admin  <  owner
```

Single source of truth: [`src/shared/constants/roles.ts`](../src/shared/constants/roles.ts).
Re-exported from `@shared/constants` and (the `Role` type) from `@shared/types`.

- **student** — learner only.
- **teacher** — learner **plus** own-scope authoring (their courses/channel/students).
- **admin** — platform operator. **NOT a learner** (no Home/Courses/Practice). Manages
  any content + users + moderation, platform-wide.
- **owner** — admin **plus** the keys to the platform (role assignment, settings, billing).

## Permission matrix

`ROLE_PERMISSIONS` maps each role to its `Permission[]`. Check with `can(role, permission)`.

| Permission | student | teacher | admin | owner | meaning |
|---|:-:|:-:|:-:|:-:|---|
| `learn.access` | ✅ | ✅ | — | — | learner surfaces (Home/Courses/Practice) |
| `community.participate` | ✅ | ✅ | ✅ | ✅ | post / comment / join |
| `content.author.own` | — | ✅ | — | — | author OWN content (teacher scope) |
| `channel.manage.own` | — | ✅ | — | — | own channel |
| `students.view.own` | — | ✅ | — | — | own students / analytics / earnings |
| `monetization.own` | — | ✅ | — | — | own payouts / pricing |
| `admin.access` | — | — | ✅ | ✅ | reach the admin console |
| `content.manage.any` | — | — | ✅ | ✅ | manage ANY content (platform scope) |
| `content.moderate` | — | — | ✅ | ✅ | reports / takedowns / featured |
| `users.manage` | — | — | ✅ | ✅ | user CRM (view/ban/edit) |
| `analytics.platform` | — | — | ✅ | ✅ | platform-wide metrics |
| `roles.assign` | — | — | — | ✅ | change other users' roles |
| `platform.settings` | — | — | — | ✅ | global config / integrations / branding |
| `billing.manage` | — | — | — | ✅ | platform billing |

`*.own` = teacher own-scope · `*.any` = platform-wide admin scope (the #A57 split).
`content.manage.any` subsumes `content.author.own`, so admins/owners need no per-entity
ownership to edit content.

## How to check permissions

**Shared (any layer):**
```ts
import { can, roleAtLeast, canAuthorContent, isAdminRole, canAssignRole } from '@shared/constants'
can(role, 'content.moderate')        // boolean
roleAtLeast(role, 'admin')           // hierarchy gate
canAuthorContent(role)               // teacher own OR admin any
canAssignRole(actorRole, nextRole)   // owner-only, can't grant ≥ own rank
```

**Renderer (reactive hooks):** [`src/renderer/src/lib/permissions.ts`](../src/renderer/src/lib/permissions.ts)
```ts
import { useCan, usePermissions } from '../../lib/permissions'
const canModerate = useCan('content.moderate')
const { role, can, isAdmin } = usePermissions()
```

## Route guards

`RequireRole` in [`AppRoutes.tsx`](../src/renderer/src/routes/AppRoutes.tsx) is capability-based:
- `role="admin"` → allowed if `isAdminRole(role)` (admin, owner).
- `role="teacher"` → allowed if `canAuthorContent(role)` (teacher, admin, owner).

Each role lands in its own shell via `homeForRole(role)` — admin/owner → `/admin`,
teacher → `/teacher`, student → `/home`.

## The admin shell — where #A56 plugs in

Admins/owners get a dedicated operator sidebar (no learner nav). The nav is the
exported `ADMIN_NAV` in [`Sidebar.tsx`](../src/renderer/src/components/layout/Sidebar.tsx):

```ts
export const ADMIN_NAV = [
  { to: '/admin', label: 'Console', Icon: IconClipboard }
] as const
```

**#A56 should:**
1. Build the admin CMS+CRM **pages** and mount them under routes guarded by
   `<RequireRole role="admin">` (or add a `<RequirePermission>` wrapper if finer
   gating is needed — gate each section on its specific `Permission`, e.g.
   `users.manage`, `content.moderate`, `platform.settings`).
2. **Register sections by extending `ADMIN_NAV`** (or render a sub-nav inside
   `AdminPage`) — do **not** add learner groups and do **not** fork the Sidebar.
3. Gate owner-only sections (Settings, Billing, Role assignment) on
   `can(role, 'platform.settings')` / `'billing.manage'` / `'roles.assign'` so admins
   see the console but only owners see those panels.
4. Keep the **#A57 split**: admin console = platform-wide (`*.any`); Creator Studio /
   `/teacher/*` = teacher own-scope (`*.own`). They are separate surfaces, not shared.

Real role assignment (minting admins, changing roles) belongs to the owner-gated CRM in
#A56 and must call `canAssignRole(actor, next)`. Until real auth (#A54), the
Account → "Switch role (testing)" panel is the dev entry point and bypasses that gate.
