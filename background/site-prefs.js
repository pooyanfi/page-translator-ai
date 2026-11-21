/* AI Page Translator — per-site preferences, one serialized writer.
 *
 * The store is the only place that writes chrome.storage.local.sitePrefs.
 * Writes are queued, so two tabs, two frames, or a page and the options page
 * doing a read-modify-write at the same time cannot lose each other's entries.
 */

export const SITE_PREFS_KEY = 'sitePrefs';

export function applySitePref(prefs, host, targetLang, ts = Date.now()) {
  const next = { ...(prefs || {}) };
  if (!host || !targetLang) return next;
  next[host] = { targetLang, ts };
  return next;
}

export function removeSitePref(prefs, host) {
  const next = { ...(prefs || {}) };
  delete next[host];
  return next;
}

export function createSitePrefStore({ storage = chrome.storage.local, now = Date.now } = {}) {
  let queue = Promise.resolve();

  function update(mutate) {
    const run = queue.then(async () => {
      const stored = await storage.get(SITE_PREFS_KEY);
      const current = (stored && stored[SITE_PREFS_KEY]) || {};
      const next = mutate(current);
      await storage.set({ [SITE_PREFS_KEY]: next });
      return next;
    });
    // Keep the chain alive after a failed write so later writes still run.
    queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  return {
    update,
    remember: (host, targetLang) => update((prefs) => applySitePref(prefs, host, targetLang, now())),
    forget: (host) => update((prefs) => removeSitePref(prefs, host)),
    clear: () => update(() => ({})),
    async read() {
      const stored = await storage.get(SITE_PREFS_KEY);
      return (stored && stored[SITE_PREFS_KEY]) || {};
    }
  };
}
