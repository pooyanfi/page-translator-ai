/* AI Page Translator — service-worker transport.
 *
 * Pure request/response handling for the AIPT_FETCH message: URL and header
 * validation, timeout clamping, Retry-After parsing and error classification.
 * It never throws and never depends on chrome.* so it can be exercised in Node.
 */

export const ALLOWED_HEADER_KEYS = ['content-type', 'authorization', 'x-goog-api-key'];
export const DEFAULT_TIMEOUT_MS = 120000;
export const MIN_TIMEOUT_MS = 1000;
export const MAX_TIMEOUT_MS = 300000;

export function clampTimeout(ms) {
  const value = Number(ms);
  if (!Number.isFinite(value)) return DEFAULT_TIMEOUT_MS;
  return Math.min(Math.max(value, MIN_TIMEOUT_MS), MAX_TIMEOUT_MS);
}

export function parseTargetUrl(raw) {
  if (typeof raw !== 'string' || raw === '') return { error: 'Only http/https URLs are allowed' };
  let url;
  try {
    url = new URL(raw);
  } catch {
    return { error: 'Only http/https URLs are allowed' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { error: 'Only http/https URLs are allowed' };
  }
  return { url };
}

export function filterAllowedHeaders(headers) {
  const out = {};
  for (const [key, value] of Object.entries(headers || {})) {
    if (!ALLOWED_HEADER_KEYS.includes(key.toLowerCase())) {
      return { error: 'Disallowed header(s) in request' };
    }
    out[key] = value;
  }
  return { headers: out };
}

export function parseRetryAfter(value, now = Date.now()) {
  if (value === null || value === undefined || value === '') return undefined;
  const seconds = parseInt(value, 10);
  if (!Number.isNaN(seconds)) return seconds * 1000;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date.getTime() - now;
  return undefined;
}

/* Returns a handler whose handleFetch() always resolves with a plain object the
 * service worker can sendResponse() directly, including on network failure. */
export function createFetchHandler({ fetchImpl = (url, init) => fetch(url, init), now = Date.now } = {}) {
  const inFlight = new Map(); // requestId -> AbortController

  function abort(requestId) {
    const controller = inFlight.get(requestId);
    if (!controller) return false;
    controller.abort('aborted');
    inFlight.delete(requestId);
    return true;
  }

  async function handleFetch(msg) {
    const { requestId, headers, body, timeoutMs } = msg || {};
    const target = parseTargetUrl(msg && msg.url);
    if (target.error) return { error: { kind: 'blocked', message: target.error } };

    const accepted = filterAllowedHeaders(headers);
    if (accepted.error) return { error: { kind: 'blocked', message: accepted.error } };

    const timeout = clampTimeout(timeoutMs);
    const controller = new AbortController();
    // Declared before the try block: the catch path has to clear it too.
    let timeoutId = null;
    inFlight.set(requestId, controller);

    try {
      timeoutId = setTimeout(() => controller.abort('timeout'), timeout);
      const res = await fetchImpl(target.url, {
        method: 'POST',
        headers: accepted.headers,
        body,
        signal: controller.signal,
        credentials: 'omit',
        redirect: 'error'
      });
      const text = await res.text();
      return {
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        text,
        retryAfterMs: parseRetryAfter(res.headers && typeof res.headers.get === 'function' ? res.headers.get('Retry-After') : null, now())
      };
    } catch (e) {
      let kind = 'network';
      let message = (e && e.message) || String(e);
      if (controller.signal.aborted) {
        kind = controller.signal.reason === 'timeout' ? 'timeout' : 'aborted';
        message = kind === 'timeout' ? 'Request timed out' : 'Cancelled by user';
      } else if (e instanceof TypeError && e.message === 'Failed to fetch') {
        message = `Could not reach ${target.url.host}. Check your internet connection, the Base URL, and that the server is running.`;
      }
      return { error: { kind, message } };
    } finally {
      if (timeoutId !== null) clearTimeout(timeoutId);
      inFlight.delete(requestId);
    }
  }

  return { handleFetch, abort, inFlight };
}
