import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPage, sendAction, createChromeStub, PAGE_FILES } from './helpers/load.js';

const ALL_CONTENT_FILES = [...PAGE_FILES, 'content-script.js'];

const BASE_SETTINGS = {
  provider: 'openai',
  apiKey: 'sk-test',
  model: 'some-model',
  baseUrl: 'https://api.example.com/v1',
  targetLanguage: 'fa',
  autoTranslate: false
};

/* Seeds chrome.storage before the content script runs, like a browser that
 * already has settings saved. */
function loadScript({ html = '<!DOCTYPE html><html><body><p id="p">Hello world</p></body></html>', settings = {} } = {}) {
  const chrome = createChromeStub({ ...BASE_SETTINGS, ...settings });
  return loadPage({ html, files: ALL_CONTENT_FILES, chrome });
}

const sitePrefMessages = (chrome) =>
  chrome.callsOf('runtime.sendMessage').filter((c) => c.msg && c.msg.type === 'AIPT_SITE_PREFS');

function stubSuccess(AIPT) {
  const requested = [];
  AIPT.Engine.translateTexts = async (texts, ctx, signal, onChunk) => {
    requested.push(...texts);
    const out = texts.map((t) => 'T:' + t);
    if (onChunk) onChunk(0, out);
    return out;
  };
  return requested;
}

test('translatePage applies translations and remembers the site through the service worker (B6)', async () => {
  const page = loadScript();
  stubSuccess(page.AIPT);

  const result = await sendAction(page.chrome, { action: 'translatePage', targetLang: 'fa' });
  assert.equal(result.ok, true);
  assert.equal(page.document.body.textContent.trim(), 'T:Hello world');

  const prefCalls = sitePrefMessages(page.chrome);
  assert.equal(prefCalls.length, 1);
  assert.deepEqual(
    { op: prefCalls[0].msg.op, host: prefCalls[0].msg.host, targetLang: prefCalls[0].msg.targetLang },
    { op: 'remember', host: 'example.com', targetLang: 'fa' }
  );

  const writes = page.chrome.callsOf('storage.set').filter((c) => c.items && 'sitePrefs' in c.items);
  assert.equal(writes.length, 0, 'sitePrefs must only be written by the service worker');

  const state = await sendAction(page.chrome, { action: 'getState' });
  assert.equal(state.translated, true);
  assert.equal(state.lang, 'fa');
});

test('"Show original" does not delete the per-site preference (B6)', async () => {
  const page = loadScript();
  stubSuccess(page.AIPT);

  await sendAction(page.chrome, { action: 'translatePage', targetLang: 'fa' });
  const afterTranslate = sitePrefMessages(page.chrome).length;
  assert.equal(afterTranslate, 1);

  const toggled = await sendAction(page.chrome, { action: 'toggle' });
  assert.equal(toggled.translated, false);
  assert.equal(page.document.body.textContent.trim(), 'Hello world');

  const afterToggle = sitePrefMessages(page.chrome);
  assert.equal(afterToggle.length, afterTranslate, 'restoring must not send a forget request');
  assert.equal(afterToggle.some((c) => c.msg.op === 'forget'), false);
});

test('translate -> restore -> translate works again after a restore (B8)', async () => {
  const page = loadScript();
  stubSuccess(page.AIPT);

  await sendAction(page.chrome, { action: 'translatePage', targetLang: 'fa' });
  await sendAction(page.chrome, { action: 'restoreOriginal' });
  assert.equal(page.document.body.textContent.trim(), 'Hello world');

  const again = await sendAction(page.chrome, { action: 'translatePage', targetLang: 'fa' });
  assert.equal(again.ok, true);
  assert.equal(page.document.body.textContent.trim(), 'T:Hello world');
});

test('selection translation is restorable and never double-translated (B4)', async () => {
  const page = loadScript({ html: '<!DOCTYPE html><html><body><p id="p">Visit <a href="/docs">the docs</a> now</p></body></html>' });

  const requested = [];
  page.AIPT.Engine.translateTexts = async (texts) => {
    requested.push(...texts);
    return texts.map(() => 'متن ترجمه');
  };

  const p = page.document.getElementById('p');
  const range = page.document.createRange();
  range.selectNodeContents(p);
  const selection = page.window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  const res = await sendAction(page.chrome, { action: 'translateSelection' });
  assert.equal(res.ok, true);
  assert.equal(res.translated, true);
  assert.equal(p.textContent, 'متن ترجمه');
  assert.equal(requested.length, 1);

  // The popup now offers "Show original" because the page has translated content.
  const state = await sendAction(page.chrome, { action: 'getState' });
  assert.equal(state.translated, true);
  assert.equal(state.lang, 'fa');

  // A later full-page collect must not see (and re-translate) the inserted span.
  const collected = page.AIPT.Dom.collect(page.document.body);
  assert.equal(collected.units.length, 0);
  assert.equal(collected.texts.length, 0);

  await sendAction(page.chrome, { action: 'restoreOriginal' });

  const link = p.querySelector('a');
  assert.ok(link, 'the original inline markup is restored');
  assert.equal(link.getAttribute('href'), '/docs');
  assert.equal(p.textContent, 'Visit the docs now');

  const after = await sendAction(page.chrome, { action: 'getState' });
  assert.equal(after.translated, false);
});

test('a plain paragraph is translated as one unit and keeps its inline link', async () => {
  const page = loadScript({
    html: '<!DOCTYPE html><html><body><p id="p">The <a href="/policy">policy</a> applies.</p></body></html>'
  });

  page.AIPT.Engine.translateTexts = async (texts, ctx, signal, onChunk) => {
    const out = texts.map((t) => '<t1>سیاست</t1> اعمال می‌شود.');
    if (onChunk) onChunk(0, out);
    return out;
  };

  const result = await sendAction(page.chrome, { action: 'translatePage', targetLang: 'fa' });
  assert.equal(result.ok, true);

  const p = page.document.getElementById('p');
  assert.equal(p.textContent, 'سیاست اعمال می‌شود.');
  const link = p.querySelector('a');
  assert.ok(link, 'the link survives the rebuild');
  assert.equal(link.getAttribute('href'), '/policy');
  assert.equal(link.textContent, 'سیاست');

  await sendAction(page.chrome, { action: 'restoreOriginal' });
  assert.equal(p.textContent, 'The policy applies.');
});

test('a token-broken answer is retried once with strictTags, then applied', async () => {
  const page = loadScript({
    html: '<!DOCTYPE html><html><body><p id="p">The <a href="/policy">policy</a> applies.</p></body></html>'
  });

  const calls = [];
  page.AIPT.Engine.translateTexts = async (texts, ctx, signal, onChunk) => {
    calls.push({ texts: Array.from(texts), strictTags: !!ctx.strictTags, kind: ctx.kind });
    const out = ctx.strictTags
      ? texts.map(() => '<t1>سیاست</t1> اعمال می‌شود.')
      : texts.map(() => 'سیاست اعمال می‌شود.');
    if (onChunk) onChunk(0, out);
    return out;
  };

  const result = await sendAction(page.chrome, { action: 'translatePage', targetLang: 'fa' });
  assert.equal(result.ok, true);
  assert.equal(result.skipped, 0, 'the strict retry recovered the unit, so nothing was skipped');
  assert.equal(calls.length, 2, 'one strict retry for the rejected unit');
  assert.equal(calls[1].strictTags, true);
  assert.equal(calls[0].kind, 'block');
  assert.equal(page.document.getElementById('p').querySelector('a').textContent, 'سیاست');
});

test('UI labels are translated on a separate channel from prose', async () => {
  const page = loadScript({
    html: '<!DOCTYPE html><html><body><p>Body text</p><input id="q" placeholder="Search the site"></body></html>'
  });

  const kinds = [];
  page.AIPT.Engine.translateTexts = async (texts, ctx, signal, onChunk) => {
    kinds.push(ctx.kind);
    const out = texts.map((t) => 'L:' + t);
    if (onChunk) onChunk(0, out);
    return out;
  };

  await sendAction(page.chrome, { action: 'translatePage', targetLang: 'fa' });
  assert.deepEqual(kinds, ['block', 'label']);
  assert.equal(page.document.getElementById('q').getAttribute('placeholder'), 'L:Search the site');
  assert.equal(page.document.querySelector('p').textContent, 'L:Body text');
});

test('getState accepts a keyless local endpoint instead of throwing (B1)', async () => {
  const page = loadScript({
    settings: { apiKey: '', model: 'local-model', baseUrl: 'http://localhost:1234/v1' }
  });

  const state = await sendAction(page.chrome, { action: 'getState' });
  assert.equal(state.configError, null);
});

test('getState surfaces the missing-key message for a remote provider (B1)', async () => {
  const page = loadScript({ settings: { apiKey: '' } });

  const state = await sendAction(page.chrome, { action: 'getState' });
  assert.equal(state.configError, 'API key is required (Options).');
});

test('translatePage with an invalid config returns a config error and touches nothing', async () => {
  const page = loadScript({
    settings: { provider: 'gemini', apiKey: '', model: 'gemini-2.5-flash' },
    html: '<!DOCTYPE html><html><body><p>Hello</p></body></html>'
  });

  let engineCalls = 0;
  page.AIPT.Engine.translateTexts = async (texts) => {
    engineCalls++;
    return texts;
  };

  const result = await sendAction(page.chrome, { action: 'translatePage', targetLang: 'fa' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'config');
  assert.equal(engineCalls, 0);
  assert.equal(page.document.body.textContent.trim(), 'Hello');
});

test('no content-script action returns the stored API key or answers an unknown action (B9)', async () => {
  const page = loadScript();

  for (const action of ['getSettings', 'updateSettings', 'getState', 'restoreOriginal', 'not-an-action']) {
    const res = await sendAction(page.chrome, { action });
    assert.equal(
      JSON.stringify(res ?? null).includes('sk-test'),
      false,
      `action "${String(action)}" must not return the API key`
    );
  }

  const unknown = await sendAction(page.chrome, { action: 'getSettings' });
  assert.equal(unknown.ok, false);
  assert.equal(unknown.error, 'Unknown action');
});
