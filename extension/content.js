// Shows a small toast with the lookup result on the page.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type !== 'speakai-result') return;
  const { result } = msg;
  let toast = document.getElementById('speakai-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'speakai-toast';
    toast.style.cssText =
      'position:fixed;bottom:24px;right:24px;z-index:2147483647;max-width:320px;' +
      'background:#0f1424;color:#e2e8f0;border:1px solid rgba(255,255,255,.14);' +
      'border-radius:14px;padding:14px 16px;font:14px/1.4 system-ui,sans-serif;' +
      'box-shadow:0 12px 40px rgba(0,0,0,.5)';
    document.body.appendChild(toast);
  }
  toast.innerHTML =
    `<div style="font-weight:700;font-size:16px;color:#fff">${result.word} ` +
    `<span style="font-weight:400;color:#94a3b8;font-size:13px">${result.phonetic || ''}</span></div>` +
    `<div style="margin-top:4px;color:#cbd5e1">${result.definition || 'Saved to SpeakAI.'}</div>` +
    `<div style="margin-top:6px;font-size:11px;color:#60a5fa">✓ Saved to SpeakAI vocabulary</div>`;
  toast.style.opacity = '1';
  clearTimeout(window.__speakaiToastTimer);
  window.__speakaiToastTimer = setTimeout(() => { toast.style.transition = 'opacity .4s'; toast.style.opacity = '0'; }, 4000);
});
