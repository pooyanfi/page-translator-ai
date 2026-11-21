const providerEl = document.getElementById('provider');
const apiKeyEl = document.getElementById('apiKey');
const modelEl = document.getElementById('model');
const baseUrlEl = document.getElementById('baseUrl');
const sourceLanguageEl = document.getElementById('sourceLanguage');
const targetLanguageEl = document.getElementById('targetLanguage');
const qualityModeEl = document.getElementById('qualityMode');
const styleEl = document.getElementById('style');
const autoTranslateEl = document.getElementById('autoTranslate');
const glossaryEl = document.getElementById('glossary');
const btnSave = document.getElementById('btnSave');
const btnTest = document.getElementById('btnTest');
const saveStatus = document.getElementById('saveStatus');
const testStatus = document.getElementById('testStatus');
const toggleKey = document.getElementById('toggleKey');
const sitePrefsList = document.getElementById('sitePrefsList');
const btnClearSites = document.getElementById('btnClearSites');
const modelSuggestions = document.getElementById('modelSuggestions');

let settings = {};

const PRESETS = {
  'NVIDIA': 'https://integrate.api.nvidia.com/v1',
  'OpenRouter': 'https://openrouter.ai/api/v1',
  'Groq': 'https://api.groq.com/openai/v1',
  'OpenAI': 'https://api.openai.com/v1',
  'Custom': ''
};

const MODEL_SUGGESTIONS = {
  'NVIDIA': ['nvidia/nemotron-3.5-lightning-30b-a3b'],
  'OpenRouter': ['nvidia/nemotron-3.5-lightning-30b-a3b', 'google/gemini-2.5-flash'],
  'Groq': [],
  'OpenAI': [],
  'Custom': []
};

function renderLangs(selectEl, selected) {
  selectEl.textContent = '';
  for (const lang of AIPT.LANGUAGES) {
    const o = document.createElement('option');
    o.value = lang.code;
    o.textContent = lang.name;
    if (lang.code === selected) o.selected = true;
    selectEl.appendChild(o);
  }
  // Source language gets "auto" option at top
  if (selectEl.id === 'sourceLanguage') {
    const autoOpt = document.createElement('option');
    autoOpt.value = 'auto';
    autoOpt.textContent = 'Auto-detect';
    selectEl.insertBefore(autoOpt, selectEl.firstChild);
    if (selected === 'auto') autoOpt.selected = true;
  }
}

async function load() {
  const stored = await chrome.storage.local.get(null);
  settings = { ...AIPT.DEFAULT_SETTINGS, ...stored };
  providerEl.value = settings.provider;
  apiKeyEl.value = settings.apiKey;
  modelEl.value = settings.model;
  baseUrlEl.value = settings.baseUrl;
  renderLangs(sourceLanguageEl, settings.sourceLanguage);
  renderLangs(targetLanguageEl, settings.targetLanguage);
  qualityModeEl.checked = settings.qualityMode;
  styleEl.value = settings.style === 'literal' ? 'literal' : 'natural';
  autoTranslateEl.checked = settings.autoTranslate;
  glossaryEl.value = glossaryToText(settings.glossary);
  updatePresetUI();
  renderSitePrefs();
}

function glossaryToText(g) {
  return Object.entries(g || {}).map(([k, v]) => k + ' → ' + v).join('\n');
}

function glossaryFromText(t) {
  const g = {};
  for (const line of t.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Find first occurrence of separator
    let idx = -1;
    let sep = '';
    for (const s of ['→', '->', '=>', '=', '\t']) {
      const i = trimmed.indexOf(s);
      if (i !== -1 && (idx === -1 || i < idx)) {
        idx = i;
        sep = s;
      }
    }
    if (idx !== -1) {
      const term = trimmed.slice(0, idx).trim();
      const trans = trimmed.slice(idx + sep.length).trim();
      if (term && trans) g[term] = trans;
    }
  }
  return g;
}

function setRowVisible(inputEl, visible) {
  const label = inputEl.closest('label');
  if (label) label.style.display = visible ? 'block' : 'none';
}

function updatePresetUI() {
  const provider = providerEl.value;
  const needsKey = provider !== 'ollama';
  const needsBaseUrl = provider === 'openai' || provider === 'ollama';

  setRowVisible(apiKeyEl, needsKey);
  setRowVisible(baseUrlEl, needsBaseUrl);
  if (toggleKey.parentElement) toggleKey.parentElement.style.display = needsKey ? 'flex' : 'none';

  baseUrlEl.placeholder =
    provider === 'ollama' ? 'http://localhost:11434' : 'https://integrate.api.nvidia.com/v1';

  modelSuggestions.textContent = '';
  const baseUrl = baseUrlEl.value.trim();
  let matchedPreset = 'Custom';
  for (const [name, url] of Object.entries(PRESETS)) {
    if (url && baseUrl === url) { matchedPreset = name; break; }
  }
  for (const m of MODEL_SUGGESTIONS[matchedPreset] || []) {
    const opt = document.createElement('option');
    opt.value = m;
    modelSuggestions.appendChild(opt);
  }
}

async function refreshSitePrefs() {
  const stored = await chrome.storage.local.get('sitePrefs');
  settings.sitePrefs = stored.sitePrefs || {};
  renderSitePrefs();
}

/* The service worker owns sitePrefs writes (it serializes them), so the options
 * page asks it to change an entry and then re-reads the result. */
async function updateSitePrefs(op, host) {
  try {
    await chrome.runtime.sendMessage({ type: 'AIPT_SITE_PREFS', op, host });
  } catch (e) {
    console.warn('[AI Page Translator] could not update site preferences', e);
  }
  await refreshSitePrefs();
}

function renderSitePrefs() {
  const prefs = settings.sitePrefs || {};
  const entries = Object.entries(prefs);
  sitePrefsList.textContent = '';

  if (entries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'subtitle';
    empty.style.color = '#9aa0a6';
    empty.textContent = 'No site preferences saved.';
    sitePrefsList.appendChild(empty);
    btnClearSites.style.display = 'none';
    return;
  }

  btnClearSites.style.display = 'inline-block';
  for (const [host, pref] of entries) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px;border-bottom:1px solid #eee;';

    const hostEl = document.createElement('span');
    hostEl.style.cssText = 'flex:1;font-family:monospace;font-size:13px;';
    hostEl.textContent = host;

    const langEl = document.createElement('span');
    langEl.style.cssText = 'color:#5f6368;font-size:13px;';
    langEl.textContent = AIPT.languageName(pref.targetLang);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn';
    deleteBtn.style.cssText = 'padding:4px 8px;font-size:12px;';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => {
      updateSitePrefs('forget', host);
    });

    row.appendChild(hostEl);
    row.appendChild(langEl);
    row.appendChild(deleteBtn);
    sitePrefsList.appendChild(row);
  }
}

btnSave.addEventListener('click', async () => {
  const next = {
    provider: providerEl.value,
    apiKey: (apiKeyEl.value || '').trim(),
    model: (modelEl.value || '').trim(),
    baseUrl: AIPT.Providers.normalizeBaseUrl(baseUrlEl.value),
    targetLanguage: targetLanguageEl.value,
    sourceLanguage: sourceLanguageEl.value,
    qualityMode: qualityModeEl.checked,
    style: styleEl.value === 'literal' ? 'literal' : 'natural',
    autoTranslate: autoTranslateEl.checked,
    glossary: glossaryFromText(glossaryEl.value)
  };
  await chrome.storage.local.set(next);
  settings = { ...settings, ...next };
  const err = AIPT.Providers.validateConfig(settings);
  if (err) {
    saveStatus.textContent = 'Saved with warning: ' + err;
    saveStatus.style.color = '#f57f17';
  } else {
    saveStatus.textContent = 'Saved.';
    saveStatus.style.color = '#2e7d32';
  }
  setTimeout(() => { saveStatus.textContent = ''; }, 2000);
});

btnTest.addEventListener('click', async () => {
  testStatus.textContent = 'Testing…';
  testStatus.style.color = '#5f6368';
  btnTest.disabled = true;
  try {
    const cfg = {
      provider: providerEl.value,
      apiKey: (apiKeyEl.value || '').trim(),
      model: (modelEl.value || '').trim(),
      baseUrl: AIPT.Providers.normalizeBaseUrl(baseUrlEl.value),
      targetLanguage: targetLanguageEl.value,
      sourceLanguage: sourceLanguageEl.value
    };
    const res = await AIPT.Providers.testConnection(cfg);
    if (res.ok) {
      testStatus.textContent = 'Connection OK (' + (res.ms || '?') + ' ms): "Hello, world!" → "' + (res.sample || '') + '"';
      testStatus.style.color = '#2e7d32';
    } else {
      testStatus.textContent = 'Error [' + (res.type || 'unknown') + ']: ' + res.error;
      testStatus.style.color = '#c62828';
    }
  } catch (e) {
    testStatus.textContent = 'Error: ' + String(e);
    testStatus.style.color = '#c62828';
  } finally {
    btnTest.disabled = false;
  }
});

toggleKey.addEventListener('click', () => {
  const isPass = apiKeyEl.type === 'password';
  apiKeyEl.type = isPass ? 'text' : 'password';
  toggleKey.textContent = isPass ? 'Hide' : 'Show';
});

providerEl.addEventListener('change', () => {
  updatePresetUI();
});

baseUrlEl.addEventListener('input', () => {
  updatePresetUI();
});

btnClearSites.addEventListener('click', () => {
  updateSitePrefs('clear');
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === 'local' && changes.sitePrefs) {
    await refreshSitePrefs();
  }
});

load();
