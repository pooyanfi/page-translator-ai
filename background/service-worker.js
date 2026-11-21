/* AI Page Translator — background service worker (Manifest V3) */

import { createFetchHandler } from './fetch-utils.js';
import { createSitePrefStore } from './site-prefs.js';

const fetchHandler = createFetchHandler();
const sitePrefs = createSitePrefStore();
let keepAliveInterval = null;

function startKeepAlive() {
  if (keepAliveInterval) return;
  keepAliveInterval = setInterval(() => {
    chrome.runtime.getPlatformInfo(() => {});
  }, 20000);
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

function syncKeepAlive() {
  if (fetchHandler.inFlight.size > 0) startKeepAlive();
  else stopKeepAlive();
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'aipt-translate-page', title: 'Translate this page', contexts: ['page'] });
    chrome.contextMenus.create({ id: 'aipt-translate-selection', title: 'Translate selection', contexts: ['selection'] });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;
  if (info.menuItemId === 'aipt-translate-page') {
    chrome.tabs.sendMessage(tab.id, { action: 'translatePage' }).catch(() => {});
  } else if (info.menuItemId === 'aipt-translate-selection') {
    chrome.tabs.sendMessage(tab.id, { action: 'translateSelection' }, { frameId: info.frameId }).catch(() => {});
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'toggle-translation') return;
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    if (!tab || !tab.id) return;
    try {
      const state = await chrome.tabs.sendMessage(tab.id, { action: 'getState' }, { frameId: 0 });
      if (state && state.translated) {
        chrome.tabs.sendMessage(tab.id, { action: 'restoreOriginal' }).catch(() => {});
      } else {
        chrome.tabs.sendMessage(tab.id, { action: 'translatePage' }).catch(() => {});
      }
    } catch {
      chrome.tabs.sendMessage(tab.id, { action: 'translatePage' }).catch(() => {});
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || sender.id !== chrome.runtime.id) return false;

  if (msg.type === 'AIPT_FETCH') {
    fetchHandler
      .handleFetch(msg)
      .then((response) => sendResponse(response))
      .catch((err) => sendResponse({ error: { kind: 'network', message: err && err.message ? err.message : String(err) } }))
      .finally(syncKeepAlive);
    syncKeepAlive();
    return true;
  }

  if (msg.type === 'AIPT_ABORT') {
    fetchHandler.abort(msg.requestId);
    syncKeepAlive();
    return false;
  }

  if (msg.type === 'AIPT_SITE_PREFS') {
    handleSitePrefs(msg).then(sendResponse, (err) => sendResponse({ ok: false, error: String(err) }));
    return true;
  }

  return false;
});

/* Single writer for chrome.storage.local.sitePrefs: content scripts and the
 * options page send messages instead of doing unlocked read-modify-write. */
async function handleSitePrefs(msg) {
  const host = typeof msg.host === 'string' ? msg.host : '';
  if (!host) return { ok: false, error: 'Missing host' };
  if (msg.op === 'forget') {
    await sitePrefs.forget(host);
    return { ok: true };
  }
  if (msg.op === 'remember') {
    const targetLang = typeof msg.targetLang === 'string' ? msg.targetLang : '';
    if (!targetLang) return { ok: false, error: 'Missing targetLang' };
    await sitePrefs.remember(host, targetLang);
    return { ok: true };
  }
  if (msg.op === 'clear') {
    await sitePrefs.clear();
    return { ok: true };
  }
  return { ok: false, error: 'Unknown site preference op' };
}
