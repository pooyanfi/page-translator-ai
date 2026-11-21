import test from 'node:test';
import assert from 'node:assert/strict';
import { createSitePrefStore, applySitePref, removeSitePref, SITE_PREFS_KEY } from '../background/site-prefs.js';

function delayedStorage(initial = {}) {
  let data = JSON.parse(JSON.stringify(initial));
  const latency = () => new Promise((resolve) => setTimeout(resolve, 5));
  return {
    async get(key) {
      await latency();
      const value = data[key];
      return { [key]: value === undefined ? undefined : JSON.parse(JSON.stringify(value)) };
    },
    async set(items) {
      await latency();
      data = { ...data, ...JSON.parse(JSON.stringify(items)) };
    },
    snapshot() {
      return JSON.parse(JSON.stringify(data));
    }
  };
}

test('applySitePref and removeSitePref never mutate their input', () => {
  const original = { 'a.com': { targetLang: 'fa', ts: 1 } };
  const added = applySitePref(original, 'b.com', 'de', 42);
  assert.deepEqual(original, { 'a.com': { targetLang: 'fa', ts: 1 } });
  assert.deepEqual(added['b.com'], { targetLang: 'de', ts: 42 });
  assert.deepEqual(added['a.com'], { targetLang: 'fa', ts: 1 });

  const removed = removeSitePref(added, 'a.com');
  assert.equal('a.com' in removed, false);
  assert.equal('a.com' in added, true, 'remove must not mutate the input');
  assert.deepEqual(removeSitePref(undefined, 'x'), {});
});

test('concurrent writes to different hosts all survive (B6)', async () => {
  const storage = delayedStorage({});
  const store = createSitePrefStore({ storage });

  await Promise.all([
    store.remember('a.com', 'fa'),
    store.remember('b.com', 'de'),
    store.remember('c.com', 'ja')
  ]);

  assert.deepEqual(Object.keys(storage.snapshot()[SITE_PREFS_KEY]).sort(), ['a.com', 'b.com', 'c.com']);
});

test('a remember and a forget racing each other both take effect (B6)', async () => {
  const storage = delayedStorage({ [SITE_PREFS_KEY]: { 'old.com': { targetLang: 'fa', ts: 1 } } });
  const store = createSitePrefStore({ storage });

  await Promise.all([store.forget('old.com'), store.remember('new.com', 'de')]);

  const prefs = storage.snapshot()[SITE_PREFS_KEY];
  assert.equal('old.com' in prefs, false);
  assert.deepEqual(prefs['new.com'], { targetLang: 'de', ts: prefs['new.com'].ts });
});

test('remember overwrites the same host instead of duplicating it', async () => {
  const storage = delayedStorage({});
  const store = createSitePrefStore({ storage, now: () => 1234 });
  await store.remember('a.com', 'fa');
  await store.remember('a.com', 'de');
  const prefs = storage.snapshot()[SITE_PREFS_KEY];
  assert.deepEqual(prefs, { 'a.com': { targetLang: 'de', ts: 1234 } });
});

test('clear empties the store and read reflects the stored value', async () => {
  const storage = delayedStorage({ [SITE_PREFS_KEY]: { 'a.com': { targetLang: 'fa', ts: 1 } } });
  const store = createSitePrefStore({ storage });
  assert.deepEqual(await store.read(), { 'a.com': { targetLang: 'fa', ts: 1 } });
  await store.clear();
  assert.deepEqual(await store.read(), {});
});

test('a failed write does not wedge the queue (B6)', async () => {
  const storage = delayedStorage({});
  let failNext = true;
  const wrapped = {
    async get(key) {
      return storage.get(key);
    },
    async set(items) {
      if (failNext) {
        failNext = false;
        throw new Error('quota exceeded');
      }
      return storage.set(items);
    }
  };
  const store = createSitePrefStore({ storage: wrapped });

  await assert.rejects(() => store.remember('a.com', 'fa'), /quota exceeded/);
  await store.remember('b.com', 'de');
  assert.deepEqual(Object.keys(storage.snapshot()[SITE_PREFS_KEY]), ['b.com']);
});
