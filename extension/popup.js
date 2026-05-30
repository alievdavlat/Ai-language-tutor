const qEl = document.getElementById('q');
const resultEl = document.getElementById('result');
const savedEl = document.getElementById('saved');

async function lookup(word) {
  resultEl.innerHTML = '<div class="def">Looking up…</div>';
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) { resultEl.innerHTML = '<div class="def">No definition found.</div>'; return; }
    const data = await res.json();
    const entry = data[0];
    const meaning = entry?.meanings?.[0];
    resultEl.innerHTML =
      `<div class="word">${entry.word} <span style="font-size:13px;color:#94a3b8">${entry.phonetic || ''}</span></div>` +
      `<span class="pos">${meaning?.partOfSpeech || ''}</span>` +
      `<div class="def">${meaning?.definitions?.[0]?.definition || ''}</div>`;
    const { savedWords = [] } = await chrome.storage.local.get('savedWords');
    if (!savedWords.find((w) => w.word === entry.word)) {
      savedWords.unshift({ word: entry.word, phonetic: entry.phonetic || '', definition: meaning?.definitions?.[0]?.definition || '', savedAt: new Date().toISOString() });
      await chrome.storage.local.set({ savedWords: savedWords.slice(0, 500) });
      renderSaved();
    }
  } catch {
    resultEl.innerHTML = '<div class="def">Lookup failed. Check your connection.</div>';
  }
}

async function renderSaved() {
  const { savedWords = [] } = await chrome.storage.local.get('savedWords');
  savedEl.innerHTML = savedWords.slice(0, 12).map((w) => `<span class="chip">${w.word}</span>`).join('') || '<span style="color:#64748b;font-size:12px">Nothing saved yet.</span>';
}

document.getElementById('go').addEventListener('click', () => lookup(qEl.value.trim()));
qEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') lookup(qEl.value.trim()); });
renderSaved();
