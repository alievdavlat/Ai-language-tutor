# Productivity tools (#37)

Three ways to learn without leaving your work. Surfaced on the `/productivity`
page.

## 1. Global quick-lookup hotkey

- Accelerator: **Ctrl/⌘ + Shift + Space** — works system-wide, even when the app
  is minimized or in the background.
- Registered in the Electron main process via `globalShortcut`
  (`src/main/services/productivity/index.ts`). On fire it focuses the window and
  sends `productivity:quick-lookup` to the renderer.
- The renderer overlay (`components/QuickLookup.tsx`) opens a command-palette
  over the free `dictionaryapi.dev` source. In the browser preview (no Electron)
  the same overlay opens with **Ctrl/⌘ + K**.

## 2. Desktop widget

- An always-on-top, frameless, transparent mini-window (280×200) pinned to the
  top-right of the primary display.
- Created on demand by `toggleWidgetWindow()` and rendered by `features/widget`
  at the `#/widget` route.
- Shows word-of-the-day + streak + an inline lookup. Toggle it from
  `/productivity`.

## 3. Browser extension

- A Manifest V3 extension in the repo's `extension/` folder.
- Select text on any page → right-click → *Look up in SpeakAI*, or use the
  toolbar popup. Saved words persist in `chrome.storage.local` for sync.
- Install via `chrome://extensions` → Developer mode → **Load unpacked** →
  select `extension/`. See `extension/README.md`.

## IPC surface

| Channel | Direction | Purpose |
|---------|-----------|---------|
| `productivity:quick-lookup` | main → renderer | hotkey fired, open overlay |
| `productivity:toggle-widget` | renderer → main | show/hide widget |
| `productivity:shortcut-status` | renderer → main | did the global shortcut register |

Exposed to the renderer as `window.api.productivity`.
