/* Test harness: loads extension sources (classic scripts, no imports) into a real
 * DOM (jsdom) or into a bare V8 context, matching how the browser loads them.
 * Dev-only. Nothing here is referenced by extension code. */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function readSource(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), 'utf8');
}

export const CORE_FILES = ['languages.js', 'providers.js', 'translation-engine.js'];
export const PAGE_FILES = [...CORE_FILES, 'dom-processor.js'];

function baseGlobals(overrides) {
  return {
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    URL,
    URLSearchParams,
    AbortController,
    TextDecoder,
    TextEncoder,
    location: {
      protocol: 'chrome-extension:',
      hostname: 'localhost',
      href: 'chrome-extension://test/popup.html'
    },
    chrome: {
      runtime: { sendMessage: async () => ({}) },
      storage: { local: { get: async () => ({}), set: async () => {} } }
    },
    fetch: async () => {
      throw new TypeError('fetch not stubbed for this test');
    },
    ...overrides
  };
}

/* Load content scripts into a bare V8 context: enough for providers + engine,
 * no DOM. Returns the AIPT namespace that the scripts built. */
export function loadCore(overrides = {}, files = CORE_FILES) {
  const context = vm.createContext(baseGlobals(overrides));
  for (const file of files) {
    vm.runInContext(readSource(`content/${file}`), context, { filename: `content/${file}` });
  }
  const AIPT = vm.runInContext('AIPT', context);
  return { AIPT, context, evalIn: (code) => vm.runInContext(code, context) };
}

/* Load content scripts into jsdom, in manifest order. `window.chrome` is the
 * stub passed in (see createChromeStub) so storage/messaging can be inspected. */
export function loadPage({
  html = '<!DOCTYPE html><html><head><title>Test page</title></head><body></body></html>',
  url = 'https://example.com/article',
  files = PAGE_FILES,
  chrome = createChromeStub()
} = {}) {
  const dom = new JSDOM(html, { url, runScripts: 'dangerously', pretendToBeVisual: true });
  const { window } = dom;
  const context = dom.getInternalVMContext();
  window.chrome = chrome.api;
  // Real <script> elements, like the manifest does it: a classic script's
  // top-level const AIPT lands in the window's global lexical scope, which an
  // eval() would not do.
  for (const file of files) {
    const script = window.document.createElement('script');
    script.textContent = readSource(`content/${file}`);
    script.setAttribute('data-source', file);
    window.document.head.appendChild(script);
  }
  return {
    dom,
    window,
    document: window.document,
    chrome,
    AIPT: vm.runInContext('AIPT', context),
    evalIn: (code) => vm.runInContext(code, context)
  };
}

/* Promise- and callback-style chrome.storage.local, plus message capture. */
export function createChromeStub(initialStorage = {}) {
  const store = JSON.parse(JSON.stringify(initialStorage));
  const calls = [];
  const messageListeners = [];
  const changeListeners = [];
  const sendMessageResponses = {};

  const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));

  function pick(keys) {
    if (keys === null || keys === undefined) return clone(store);
    const list = typeof keys === 'string' ? [keys] : Array.isArray(keys) ? keys : Object.keys(keys);
    const out = {};
    for (const k of list) {
      if (Object.prototype.hasOwnProperty.call(store, k)) out[k] = clone(store[k]);
      else if (keys && !Array.isArray(keys) && typeof keys === 'object' && k in keys) out[k] = keys[k];
    }
    return out;
  }

  function applySet(items) {
    const changes = {};
    for (const [k, v] of Object.entries(items || {})) {
      changes[k] = { oldValue: clone(store[k]), newValue: clone(v) };
      store[k] = clone(v);
    }
    for (const fn of changeListeners) {
      try {
        fn(clone(changes), 'local');
      } catch (err) {
        console.error('[test chrome stub] storage.onChanged listener threw', err);
      }
    }
  }

  function storageGet(keys, cb) {
    calls.push({ method: 'storage.get', keys: clone(keys) });
    const result = pick(keys);
    if (typeof cb === 'function') {
      queueMicrotask(() => cb(result));
      return undefined;
    }
    return Promise.resolve(result);
  }

  function storageSet(items, cb) {
    calls.push({ method: 'storage.set', items: clone(items) });
    applySet(items);
    if (typeof cb === 'function') {
      queueMicrotask(() => cb());
      return undefined;
    }
    return Promise.resolve();
  }

  const api = {
    runtime: {
      id: 'test-extension-id',
      sendMessage: async (msg) => {
        calls.push({ method: 'runtime.sendMessage', msg: clone(msg) });
        const responder = sendMessageResponses[msg && msg.type];
        return responder ? clone(responder) : {};
      },
      onMessage: {
        addListener: (fn) => messageListeners.push(fn)
      },
      openOptionsPage: () => {}
    },
    storage: {
      local: {
        get: storageGet,
        set: storageSet
      },
      onChanged: {
        addListener: (fn) => changeListeners.push(fn)
      }
    }
  };

  return {
    api,
    store,
    calls,
    messageListeners,
    changeListeners,
    getStored: (key) => clone(store[key]),
    setStored: (key, value) => {
      store[key] = clone(value);
    },
    onSendMessage(type, response) {
      sendMessageResponses[type] = response;
    },
    callsOf(method) {
      return calls.filter((c) => c.method === method);
    }
  };
}

/* Drive the content script's chrome.runtime.onMessage listener the way a popup
 * or the service worker would, and resolve with whatever it sendResponse()s. */
export function sendAction(chromeStub, message) {
  const listener = chromeStub.messageListeners[chromeStub.messageListeners.length - 1];
  if (!listener) throw new Error('content script did not register a runtime.onMessage listener');
  return new Promise((resolve, reject) => {
    let settled = false;
    const sendResponse = (value) => {
      settled = true;
      resolve(value);
    };
    const timeout = setTimeout(() => {
      if (!settled) reject(new Error(`no response for action "${message.action}"`));
    }, 5000);
    const keepChannelOpen = listener(message, { id: chromeStub.api.runtime.id }, (value) => {
      clearTimeout(timeout);
      sendResponse(value);
    });
    if (keepChannelOpen !== true && !settled) {
      clearTimeout(timeout);
      reject(new Error(`listener did not keep the channel open for "${message.action}"`));
    }
  });
}
