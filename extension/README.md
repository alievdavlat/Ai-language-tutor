# SpeakAI Quick Lookup — browser extension

A companion Manifest V3 extension (#37) that lets learners look up and save
English words on any website, using the same free dictionary source as the app.

## Install (developer mode)

1. Open `chrome://extensions` (or `edge://extensions`).
2. Toggle **Developer mode** on.
3. Click **Load unpacked** and choose this `extension/` folder.

## Use

- **Toolbar popup** — click the icon, type a word, press Enter.
- **Context menu** — select text on any page → right-click → *Look up "…" in SpeakAI*.
  A toast shows the definition and the word is saved.
- Saved words live in `chrome.storage.local` under `savedWords` and can be
  synced into the desktop app's vocabulary.

## Files

| File | Role |
|------|------|
| `manifest.json` | MV3 manifest (permissions, background, popup, content script) |
| `background.js` | Service worker: context menu + lookup + save |
| `content.js` | In-page toast for context-menu lookups |
| `popup.html` / `popup.js` | Toolbar popup UI |

> Add a 128×128 `icon.png` before publishing to a store. Developer-mode loading
> works without it.
