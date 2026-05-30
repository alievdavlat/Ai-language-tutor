// SpeakAI Quick Lookup — MV3 service worker.
// Adds a "Look up in SpeakAI" context-menu item on selected text and saves
// looked-up words to extension storage, which the app can later sync.

const DEEP_LINK = 'speakai://lookup'; // app custom scheme (optional)

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'speakai-lookup',
    title: 'Look up "%s" in SpeakAI',
    contexts: ['selection']
  });
});

async function lookup(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    const data = await res.json();
    const entry = data[0];
    const def = entry?.meanings?.[0]?.definitions?.[0]?.definition ?? '';
    return { word: entry?.word ?? word, phonetic: entry?.phonetic ?? '', definition: def };
  } catch {
    return null;
  }
}

async function saveWord(result) {
  const { savedWords = [] } = await chrome.storage.local.get('savedWords');
  if (!savedWords.find((w) => w.word === result.word)) {
    savedWords.unshift({ ...result, savedAt: new Date().toISOString() });
    await chrome.storage.local.set({ savedWords: savedWords.slice(0, 500) });
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'speakai-lookup' || !info.selectionText) return;
  const result = await lookup(info.selectionText.trim());
  if (result) {
    await saveWord(result);
    chrome.tabs.sendMessage(tab.id, { type: 'speakai-result', result });
  }
});
