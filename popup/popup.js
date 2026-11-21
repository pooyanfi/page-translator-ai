const targetLangEl = document.getElementById('targetLang');
const btnTranslate = document.getElementById('btnTranslate');
const btnToggle = document.getElementById('btnToggle');
const btnOptions = document.getElementById('btnOptions');
const statusEl = document.getElementById('status');
const progressEl = document.getElementById('progress');
const progressFill = progressEl.querySelector('.progress-fill');
const progressText = document.getElementById('progressText');
const errorEl = document.getElementById('error');
const shortcutHint = document.getElementById('shortcutHint');

let settings = {};
let tab = null;
let pollInterval = null;

function renderLanguages() {
  targetLangEl.textContent = '';
  for (const lang of AIPT.LANGUAGES) {
    const o = document.createElement('option');
    o.value = lang.code;
    o.textContent = lang.name;
    if (lang.code === (settings.targetLanguage || 'fa')) o.selected = true;
    targetLangEl.appendChild(o);
  }
}

async function init() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  tab = tabs[0];
  const stored = await chrome.storage.local.get(null);
  settings = { ...AIPT.DEFAULT_SETTINGS, ...stored };
  renderLanguages();
  refreshStatus();
  await refreshState();

  // Shortcut hint
  try {
    const commands = await chrome.commands.getAll();
    const cmd = commands.find(c => c.name === 'toggle-translation');
    if (cmd?.shortcut) {
      shortcutHint.textContent = 'Shortcut: ' + cmd.shortcut;
    } else {
      shortcutHint.textContent = 'Shortcut: not set (assign it in your browser\'s extension shortcuts page)';
    }
  } catch {
    shortcutHint.textContent = '';
  }

  chrome.storage.onChanged.addListener(() => {
    chrome.storage.local.get(null, s => {
      settings = { ...AIPT.DEFAULT_SETTINGS, ...s };
      // Only refresh status/validation, NOT renderLanguages (which would reset the select)
      refreshStatus();
    });
  });
}

function providerLabel(p) {
  if (p === 'gemini') return 'Google Gemini';
  if (p === 'openai') return 'OpenAI-compatible';
  return 'Ollama (local)';
}

function refreshStatus() {
  const cfgError = AIPT.Providers.validateConfig(settings);
  if (cfgError) {
    statusEl.textContent = 'Config error: ' + cfgError;
    statusEl.style.color = '#c62828';
    btnTranslate.disabled = true;
    btnOptions.style.display = 'inline-block';
  } else {
    statusEl.textContent = 'Provider: ' + providerLabel(settings.provider) + ' · model: ' + (settings.model || '(none)');
    statusEl.style.color = '#5f6368';
    btnTranslate.disabled = false;
    btnOptions.style.display = 'none';
  }
}

async function refreshState() {
  try {
    const state = await chrome.tabs.sendMessage(tab.id, { action: 'getState' }, { frameId: 0 });
    if (state && state.translated) {
      btnTranslate.style.display = 'none';
      btnToggle.style.display = 'inline-block';
      btnToggle.textContent = 'Show original (' + (state.lang || settings.targetLanguage) + ')';
    } else {
      btnTranslate.style.display = 'inline-block';
      btnToggle.style.display = 'none';
    }
    btnTranslate.disabled = false;
    btnTranslate.textContent = 'Translate this page';
  } catch (e) {
    btnTranslate.disabled = true;
    btnTranslate.textContent = 'Content script not ready on this page (reload the tab if it was open before installing/updating the extension)';
  }
}

function showError(msg) { errorEl.textContent = msg; errorEl.style.display = 'block'; }
function hideError() { errorEl.style.display = 'none'; }

function startPolling() {
  if (pollInterval) return;
  pollInterval = setInterval(async () => {
    try {
      const state = await chrome.tabs.sendMessage(tab.id, { action: 'getState' }, { frameId: 0 });
      if (state && state.translating) {
        const total = state.progress?.total || 0;
        const done = state.progress?.done || 0;
        if (total > 0) {
          progressFill.style.width = (done / total * 100) + '%';
          progressText.textContent = 'Translating… ' + done + '/' + total;
        } else {
          progressText.textContent = 'Translating…';
        }
        if (state.statusText) {
          progressText.textContent += ' — ' + state.statusText;
        }
      } else {
        stopPolling();
      }
    } catch {
      stopPolling();
    }
  }, 500);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

btnTranslate.addEventListener('click', async () => {
  hideError();
  progressEl.style.display = 'block';
  progressFill.style.width = '0%';
  progressText.textContent = 'Translating…';
  btnTranslate.disabled = true;
  startPolling();
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { action: 'translatePage', targetLang: targetLangEl.value });
    stopPolling();
    progressEl.style.display = 'none';
    if (res.aborted) {
      // Silent abort
      return;
    }
    if (!res.ok) {
      showError(res.error || 'Translation failed');
      if (res.partial) await refreshState();
      return;
    }
    btnTranslate.style.display = 'none';
    btnToggle.style.display = 'inline-block';
    btnToggle.textContent = 'Show original (' + targetLangEl.value + ')';
  } catch (e) {
    stopPolling();
    progressEl.style.display = 'none';
    showError(e.message || String(e));
  }
});

btnToggle.addEventListener('click', async () => {
  hideError();
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { action: 'restoreOriginal' });
    await refreshState();
  } catch (e) {
    showError(e.message || String(e));
  }
});

document.getElementById('optionsLink').addEventListener('click', (e) => {
  e.preventDefault();
  if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
});

btnOptions.addEventListener('click', () => {
  if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
});

init();
