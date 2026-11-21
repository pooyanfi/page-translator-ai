import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { JSDOM } from 'jsdom';
import { createChromeStub, readSource, ROOT } from './helpers/load.js';

const OPTIONS_FILES = ['content/languages.js', 'content/providers.js', 'options/options.js'];

function loadOptionsPage(storage = {}) {
  const html = fs.readFileSync(path.join(ROOT, 'options/options.html'), 'utf8');
  const dom = new JSDOM(html, {
    url: 'chrome-extension://test-extension-id/options/options.html',
    runScripts: 'dangerously',
    pretendToBeVisual: true
  });
  const { window } = dom;
  const chrome = createChromeStub(storage);
  window.chrome = chrome.api;
  for (const file of OPTIONS_FILES) {
    const script = window.document.createElement('script');
    script.textContent = readSource(file);
    window.document.head.appendChild(script);
  }
  return { dom, window, document: window.document, chrome };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 20));

test('site preference rows are built with createElement and never interpreted as HTML (B9)', async () => {
  const hostileHost = '<img src=x onerror="window.__pwned = true">';
  const { window, document } = loadOptionsPage({
    sitePrefs: {
      [hostileHost]: { targetLang: 'fa', ts: 1 },
      'example.com': { targetLang: 'de', ts: 2 }
    }
  });
  await settle();

  const list = document.getElementById('sitePrefsList');
  assert.equal(list.querySelectorAll('img').length, 0, 'no markup from a host name is created');
  assert.equal(window.__pwned, undefined);

  const firstRow = list.firstElementChild;
  assert.equal(firstRow.firstElementChild.textContent, hostileHost, 'the host is rendered as literal text');
  assert.equal(list.querySelectorAll('button').length, 2);
  assert.equal(document.getElementById('btnClearSites').style.display, 'inline-block');
});

test('deleting a site preference asks the service worker instead of writing storage (B6, B9)', async () => {
  const { document, chrome } = loadOptionsPage({
    sitePrefs: { 'example.com': { targetLang: 'fa', ts: 1 } }
  });
  await settle();

  document.querySelector('#sitePrefsList button').click();
  await settle();

  const prefMessages = chrome.callsOf('runtime.sendMessage').filter((c) => c.msg && c.msg.type === 'AIPT_SITE_PREFS');
  assert.deepEqual(prefMessages.map((c) => ({ op: c.msg.op, host: c.msg.host })), [
    { op: 'forget', host: 'example.com' }
  ]);

  const writes = chrome.callsOf('storage.set').filter((c) => c.items && 'sitePrefs' in c.items);
  assert.equal(writes.length, 0, 'the options page must not write sitePrefs itself');
});

test('"Clear all" asks the service worker to clear the store (B6)', async () => {
  const { document, chrome } = loadOptionsPage({
    sitePrefs: { 'example.com': { targetLang: 'fa', ts: 1 } }
  });
  await settle();

  document.getElementById('btnClearSites').click();
  await settle();

  const ops = chrome
    .callsOf('runtime.sendMessage')
    .filter((c) => c.msg && c.msg.type === 'AIPT_SITE_PREFS')
    .map((c) => c.msg.op);
  assert.deepEqual(ops, ['clear']);
});

test('an empty store shows the empty state and hides "Clear all"', async () => {
  const { document } = loadOptionsPage({});
  await settle();

  const list = document.getElementById('sitePrefsList');
  assert.equal(list.children.length, 1);
  assert.match(list.firstElementChild.textContent, /No site preferences saved/);
  assert.equal(document.getElementById('btnClearSites').style.display, 'none');
});

test('the options page renders every language and the auto-detect source option', async () => {
  const { document } = loadOptionsPage({});
  await settle();

  const target = document.getElementById('targetLanguage');
  const source = document.getElementById('sourceLanguage');
  assert.ok(target.options.length >= 20);
  assert.equal(source.options[0].value, 'auto');
  assert.equal(source.options[0].textContent, 'Auto-detect');
});

test('the translation style setting is rendered and saved', async () => {
  const { document, chrome } = loadOptionsPage({ style: 'literal' });
  await settle();

  const select = document.getElementById('style');
  assert.equal(select.value, 'literal', 'the saved style is selected');

  select.value = 'natural';
  document.getElementById('btnSave').click();
  await settle();

  const writes = chrome.callsOf('storage.set');
  assert.equal(writes[writes.length - 1].items.style, 'natural');
});

test('saving reports the B1 validation message instead of crashing (B1)', async () => {
  const { document, window } = loadOptionsPage({});
  await settle();

  document.getElementById('provider').value = 'openai';
  document.getElementById('baseUrl').value = 'https://api.example.com/v1';
  document.getElementById('model').value = 'some-model';
  document.getElementById('apiKey').value = '';
  window.__saved = null;

  document.getElementById('btnSave').click();
  await settle();

  const status = document.getElementById('saveStatus');
  assert.match(status.textContent, /Saved with warning: API key is required/);
});
