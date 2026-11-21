/* AI Page Translator — content script: orchestration, messaging, init */

let settings = { ...AIPT.DEFAULT_SETTINGS };
const pageState = { translated: false, lang: null };
let translating = false;
let runCounter = 0;
let session = null;
let progress = { done: 0, total: 0 };
let statusText = '';
const IS_TOP = (window.top === window);

function groupBy(list, keyOf) {
  const map = new Map();
  for (const item of list) {
    const key = keyOf(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

async function loadSettings() {
  const stored = await new Promise(res => chrome.storage.local.get(null, res));
  settings = { ...AIPT.DEFAULT_SETTINGS, ...stored };
  // Trim key fields
  settings.apiKey = (settings.apiKey || '').trim();
  settings.model = (settings.model || '').trim();
  settings.baseUrl = (settings.baseUrl || '').trim();
  return settings;
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    loadSettings();
  }
});

/* The startup storage read is shared: getState awaits it so the popup can never
 * be answered with default settings before storage has been consulted. */
let settingsReady = null;
function ensureSettingsReady() {
  if (!settingsReady) {
    settingsReady = loadSettings().catch((err) => {
      settingsReady = null;
      throw err;
    });
  }
  return settingsReady;
}

function currentHost() { return location.hostname || ''; }

/* Headings are cheap, high-value context: they tell the model what the page is
 * about, which keeps terminology consistent in later paragraphs. */
function pageHeadings() {
  const out = [];
  for (const el of document.querySelectorAll('h1, h2, h3')) {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) out.push(text.slice(0, 120));
    if (out.length >= 6) break;
  }
  return out;
}

function buildCtx(targetLang) {
  const source = settings.sourceLanguage === 'auto' ? 'auto' : settings.sourceLanguage;
  return {
    provider: settings.provider,
    apiKey: settings.apiKey,
    model: settings.model,
    baseUrl: settings.baseUrl,
    targetLanguage: targetLang,
    targetLanguageName: AIPT.languageName(targetLang),
    sourceLanguage: source,
    sourceLanguageName: source === 'auto'
      ? 'the source language (infer it from the page)'
      : AIPT.languageLabel(source),
    qualityMode: !!settings.qualityMode,
    style: settings.style === 'literal' ? 'literal' : 'natural',
    context: {
      domain: currentHost(),
      pageTitle: document.title || '',
      headings: pageHeadings(),
      glossary: settings.glossary || {}
    }
  };
}

/* One cheap request replaces the literal "auto-detect" that used to be sent as
 * a language name. Failure is silent: the prompt already tells the model to
 * infer the source language itself. */
async function detectSourceLanguage(ctx, unitKeys) {
  if (settings.sourceLanguage !== 'auto') return;
  const sample = unitKeys.slice(0, 6).join('\n').slice(0, 600);
  if (sample.replace(/\s+/g, '').length < 40) return;
  const detected = await AIPT.Providers.detectLanguage(sample, { ...ctx, signal: session?.signal });
  if (detected) {
    ctx.sourceLanguage = detected.code;
    ctx.sourceLanguageName = detected.name;
    ctx.context.detectedLanguage = detected.code;
  }
}

function showPageBanner(msg, kind = 'error') {
  if (!IS_TOP) {
    console.warn('[AI Page Translator]', msg);
    return;
  }
  let el = document.getElementById('aipt-banner');
  if (!el) {
    el = document.createElement('div');
    el.id = 'aipt-banner';
    el.className = 'aipt-translator-skip';
    el.style.cssText = 'position:sticky;top:0;z-index:2147483646;padding:10px 14px;font-family:system-ui,sans-serif;font-size:13px;box-sizing:border-box;';
    document.documentElement.insertBefore(el, document.documentElement.firstChild);
  }
  el.textContent = 'AI Page Translator: ' + msg;
  if (kind === 'error') {
    el.style.background = '#ffebee';
    el.style.color = '#c62828';
    el.style.borderBottom = '1px solid #ef9a9a';
  } else {
    el.style.background = '#fff8e1';
    el.style.color = '#f57f17';
    el.style.borderBottom = '1px solid #ffe082';
  }
  el.style.display = 'block';
}

function hidePageBanner() {
  if (!IS_TOP) return;
  const el = document.getElementById('aipt-banner');
  if (el) el.style.display = 'none';
}

/* The service worker is the only writer of sitePrefs: it serializes the
 * read-modify-write, so two tabs cannot lose each other's entries. */
function rememberSite(targetLang) {
  chrome.runtime
    .sendMessage({ type: 'AIPT_SITE_PREFS', op: 'remember', host: currentHost(), targetLang })
    .catch(() => {});
}

async function translatePage(targetLang, opts = {}) {
  await loadSettings();
  const cfgError = AIPT.Providers.validateConfig(settings);
  if (cfgError) {
    if (!opts.auto) showPageBanner(cfgError);
    return { ok: false, error: cfgError, code: 'config' };
  }

  // Abort any in-flight run
  if (session) session.abort();
  // If already translated, restore first
  if (pageState.translated) {
    await restorePage();
  }
  // Drop DOM references the page has thrown away (SPA navigation).
  AIPT.Dom.pruneDetached();

  const runId = ++runCounter;
  session = new AbortController();
  translating = true;
  progress = { done: 0, total: 0 };
  statusText = '';
  hidePageBanner();
  AIPT.Dom.disconnectObserver();

  const ctx = buildCtx(targetLang);
  ctx.onStatus = (s) => { if (runId === runCounter) statusText = s; };
  ctx.stats = { skipped: 0, lastError: '' };

  let appliedAny = false;
  let applySkipped = 0;

  const markTranslated = () => {
    if (appliedAny) return;
    appliedAny = true;
    AIPT.Dom.applyDirection(targetLang, AIPT.Dom.isRTL(targetLang));
    AIPT.Dom.setupTooltipDelegation();
    pageState.translated = true;
    pageState.lang = targetLang;
    AIPT.Dom.state.translated = true;
    AIPT.Dom.state.lang = targetLang;
  };

  try {
    const collected = AIPT.Dom.collect(document.documentElement);
    const unitGroups = groupBy(collected.units, (unit) => unit.text);
    const textGroups = groupBy(collected.texts, (entry) => entry.core);
    const attrGroups = groupBy(collected.attrs, (entry) => entry.core);

    const unitKeys = Array.from(unitGroups.keys());
    const textKeys = Array.from(textGroups.keys());
    const attrKeys = Array.from(attrGroups.keys());
    const total = unitKeys.length + textKeys.length + attrKeys.length;

    if (!total) {
      return { ok: true, count: 0 };
    }

    progress.total = total;
    await detectSourceLanguage(ctx, unitKeys);

    // Units whose answer broke the inline tokens: retried once below.
    const failedUnits = [];

    if (unitKeys.length) {
      await AIPT.Engine.translateTexts(unitKeys, { ...ctx, kind: 'block' }, session.signal, (offset, translations) => {
        if (runId !== runCounter || session.signal.aborted) return;
        for (let i = 0; i < translations.length; i++) {
          const key = unitKeys[offset + i];
          for (const unit of unitGroups.get(key) || []) {
            if (AIPT.Dom.applyUnit(unit, translations[i])) markTranslated();
            else failedUnits.push(unit);
          }
        }
        progress.done += translations.length;
      });
    }

    if (textKeys.length) {
      await AIPT.Engine.translateTexts(textKeys, { ...ctx, kind: 'block' }, session.signal, (offset, translations) => {
        if (runId !== runCounter || session.signal.aborted) return;
        for (let i = 0; i < translations.length; i++) {
          const key = textKeys[offset + i];
          for (const entry of textGroups.get(key) || []) {
            if (AIPT.Dom.applyText(entry, translations[i])) markTranslated();
            else applySkipped++;
          }
        }
        progress.done += translations.length;
      });
    }

    if (attrKeys.length) {
      await AIPT.Engine.translateTexts(attrKeys, { ...ctx, kind: 'label' }, session.signal, (offset, translations) => {
        if (runId !== runCounter || session.signal.aborted) return;
        for (let i = 0; i < translations.length; i++) {
          const key = attrKeys[offset + i];
          for (const entry of attrGroups.get(key) || []) {
            if (AIPT.Dom.applyAttr(entry, translations[i])) markTranslated();
            else applySkipped++;
          }
        }
        progress.done += translations.length;
      });
    }

    /* A dropped <t1> would mean a lost link, so those units were rejected.
     * One stricter retry is much cheaper than leaving paragraphs in English. */
    if (failedUnits.length && !session.signal.aborted) {
      const retryKeys = Array.from(new Set(failedUnits.map((unit) => unit.text)));
      try {
        const retried = await AIPT.Engine.translateTexts(
          retryKeys,
          { ...ctx, kind: 'block', strictTags: true },
          session.signal
        );
        const byText = new Map(retryKeys.map((key, index) => [key, retried[index]]));
        for (const unit of failedUnits) {
          if (AIPT.Dom.applyUnit(unit, byText.get(unit.text))) markTranslated();
          else applySkipped++;
        }
      } catch (e) {
        if (e && e.type === 'abort') throw e;
        applySkipped += failedUnits.length;
      }
    }

    if (runId !== runCounter || session.signal.aborted) {
      return { ok: false, aborted: true };
    }

    const skipped = ctx.stats.skipped + applySkipped;
    if (skipped >= total) {
      throw new Error(ctx.stats.lastError || 'Nothing could be translated.');
    }
    if (skipped > 0) {
      showPageBanner(`${skipped} text segments could not be translated and were left unchanged.`, 'warn');
    }

    // Start dynamic observer
    AIPT.Dom.observeDynamic(() => ctx, AIPT.Engine, session.signal, collected.shadowRoots);

    if (!opts.auto && IS_TOP) {
      rememberSite(targetLang);
    }

    return { ok: true, count: total, skipped };
  } catch (e) {
    if (e instanceof AIPT.Providers.ProviderError && e.type === 'abort') {
      return { ok: false, aborted: true };
    }
    if (runId !== runCounter) return { ok: false, aborted: true };

    const partial = progress.done > 0;
    if (!partial) {
      pageState.translated = false;
      pageState.lang = null;
      AIPT.Dom.state.translated = false;
      AIPT.Dom.state.lang = null;
    }
    showPageBanner(e.message || String(e));
    return { ok: false, partial, error: e.message || String(e) };
  } finally {
    if (runId === runCounter) {
      translating = false;
      statusText = '';
    }
  }
}

async function restorePage() {
  runCounter++;
  if (session) session.abort();
  AIPT.Dom.disconnectObserver();
  AIPT.Dom.restore();
  pageState.translated = false;
  pageState.lang = null;
  translating = false;
  progress = { done: 0, total: 0 };
  statusText = '';
  hidePageBanner();
}

async function toggle(targetLang) {
  if (pageState.translated) {
    // "Show original" must not delete the per-site preference: the point of the
    // preference is that the next visit translates again.
    await restorePage();
    return { ok: true, translated: false };
  }
  const res = await translatePage(targetLang);
  return { ok: res.ok, translated: res.ok || !!res.partial, error: res.error };
}

async function translateSelection() {
  await loadSettings();
  const cfgError = AIPT.Providers.validateConfig(settings);
  if (cfgError) return { ok: false, error: cfgError };

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { ok: false, error: 'No selection' };
  const text = sel.toString().trim();
  if (!text) return { ok: false, error: 'Empty selection' };

  const ctx = buildCtx(settings.targetLanguage);
  ctx.kind = 'block';
  // The surrounding block disambiguates a short selection ("it", "the button").
  const anchor = sel.anchorNode;
  const anchorEl = anchor && anchor.nodeType === 1 ? anchor : anchor?.parentElement;
  const block = anchorEl?.closest?.('p, li, h1, h2, h3, h4, h5, h6, td, th, blockquote, figcaption, dd, dt') || anchorEl;
  ctx.contextText = (block?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 900);

  const [translated] = await AIPT.Engine.translateTexts([text], ctx);
  if (!translated || !translated.trim()) return { ok: false, error: 'Nothing was translated' };

  const span = AIPT.Dom.replaceSelection(sel.getRangeAt(0), translated);
  if (!span) return { ok: false, error: 'Selection could not be replaced' };
  sel.removeAllRanges();

  // There is now translated content on the page, so "Show original" must be
  // offered and must put the original inline markup back via restore().
  pageState.translated = true;
  pageState.lang = settings.targetLanguage;
  // Do NOT change page direction for a selection.
  return { ok: true, translated: true };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || !msg.action) return false;

  async function handler(msg) {
    switch (msg.action) {
      case 'getState':
        await ensureSettingsReady();
        return {
          translated: pageState.translated,
          lang: pageState.lang,
          translating,
          progress,
          statusText,
          configError: AIPT.Providers.validateConfig(settings)
        };
      case 'translatePage':
        return translatePage(msg.targetLang || settings.targetLanguage);
      case 'restoreOriginal':
        await restorePage();
        return { ok: true };
      case 'toggle':
        return toggle(msg.targetLang || settings.targetLanguage);
      case 'translateSelection':
        return translateSelection();
      default:
        return { ok: false, error: 'Unknown action' };
    }
  }

  if (IS_TOP) {
    handler(msg).then(sendResponse, err => sendResponse({ ok: false, error: String(err) }));
    return true;
  } else {
    // Non-top frames: only handle translate actions, no sendResponse
    if (['translatePage', 'restoreOriginal', 'toggle', 'translateSelection'].includes(msg.action)) {
      handler(msg).catch(console.warn);
    }
    return false;
  }
});

(async () => {
  await ensureSettingsReady();
  if (settings.autoTranslate) {
    const prefs = settings.sitePrefs || {};
    const pref = prefs[currentHost()];
    if (pref && pref.targetLang) {
      await translatePage(pref.targetLang, { auto: true });
    }
  }
})();
