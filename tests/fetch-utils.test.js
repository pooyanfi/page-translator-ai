import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createFetchHandler,
  parseTargetUrl,
  filterAllowedHeaders,
  clampTimeout,
  parseRetryAfter
} from '../background/fetch-utils.js';

function response(text, { status = 200, ok = true, retryAfter = null } = {}) {
  return {
    ok,
    status,
    statusText: 'OK',
    text: async () => text,
    headers: { get: (name) => (name === 'Retry-After' ? retryAfter : null) }
  };
}

test('parseTargetUrl only accepts http and https', () => {
  assert.equal(parseTargetUrl('https://api.example.com/v1/chat/completions').url.protocol, 'https:');
  assert.equal(parseTargetUrl('http://localhost:1234/v1').url.hostname, 'localhost');
  for (const bad of ['file:///etc/passwd', 'javascript:alert(1)', 'chrome-extension://x/y', '', null, 'not a url']) {
    assert.match(parseTargetUrl(bad).error || '', /Only http\/https/, `should reject ${String(bad)}`);
  }
});

test('filterAllowedHeaders rejects anything the extension never sends', () => {
  const ok = filterAllowedHeaders({ 'Content-Type': 'application/json', Authorization: 'Bearer k', 'x-goog-api-key': 'k' });
  assert.equal(ok.error, undefined);
  assert.equal(ok.headers.Authorization, 'Bearer k');

  const bad = filterAllowedHeaders({ 'Content-Type': 'application/json', 'X-Exfiltrate': 'secret' });
  assert.match(bad.error, /Disallowed/);

  assert.deepEqual(filterAllowedHeaders(undefined).headers, {});
});

test('clampTimeout keeps timeouts in the supported range', () => {
  assert.equal(clampTimeout(120000), 120000);
  assert.equal(clampTimeout(1), 1000);
  assert.equal(clampTimeout(10 ** 9), 300000);
  assert.equal(clampTimeout(undefined), 120000);
  assert.equal(clampTimeout('nope'), 120000);
});

test('parseRetryAfter understands seconds and HTTP dates', () => {
  assert.equal(parseRetryAfter('5'), 5000);
  assert.equal(parseRetryAfter(null), undefined);
  assert.equal(parseRetryAfter('garbage'), undefined);
  const now = Date.parse('2026-01-01T00:00:00Z');
  assert.equal(parseRetryAfter('Thu, 01 Jan 2026 00:00:10 GMT', now), 10000);
});

test('a network failure resolves with an error object instead of throwing (B2)', async () => {
  const handler = createFetchHandler({
    fetchImpl: async () => {
      throw new TypeError('Failed to fetch');
    }
  });

  let result;
  await assert.doesNotReject(async () => {
    result = await handler.handleFetch({
      requestId: 'r1',
      url: 'https://api.example.com/v1/chat/completions',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
  });

  assert.equal(result.error.kind, 'network');
  assert.match(result.error.message, /Could not reach api\.example\.com/);
  assert.equal(handler.inFlight.size, 0, 'the request must be cleared from in-flight tracking');
});

test('a non-TypeError network failure is still classified and resolved (B2)', async () => {
  const handler = createFetchHandler({
    fetchImpl: async () => {
      throw new Error('getaddrinfo ENOTFOUND api.example.com');
    }
  });
  const result = await handler.handleFetch({ requestId: 'r2', url: 'https://api.example.com/v1', headers: {}, body: '{}' });
  assert.equal(result.error.kind, 'network');
  assert.match(result.error.message, /ENOTFOUND/);
});

test('a successful request returns status, text and retryAfterMs', async () => {
  const seen = [];
  const handler = createFetchHandler({
    fetchImpl: async (url, init) => {
      seen.push({ url: String(url), init });
      return response('{"ok":true}', { status: 429, ok: false, retryAfter: '7' });
    }
  });

  const result = await handler.handleFetch({
    requestId: 'r3',
    url: 'https://api.example.com/v1/chat/completions',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer k' },
    body: '{"a":1}',
    timeoutMs: 5000
  });

  assert.equal(result.status, 429);
  assert.equal(result.ok, false);
  assert.equal(result.text, '{"ok":true}');
  assert.equal(result.retryAfterMs, 7000);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].init.method, 'POST');
  assert.equal(seen[0].init.credentials, 'omit');
  assert.equal(seen[0].init.redirect, 'error');
});

test('a blocked header never reaches fetch', async () => {
  let called = false;
  const handler = createFetchHandler({
    fetchImpl: async () => {
      called = true;
      return response('nope');
    }
  });
  const result = await handler.handleFetch({
    requestId: 'r4',
    url: 'https://api.example.com/v1',
    headers: { 'X-Evil': '1' },
    body: '{}'
  });
  assert.equal(result.error.kind, 'blocked');
  assert.equal(called, false);
});

test('a blocked URL never reaches fetch', async () => {
  let called = false;
  const handler = createFetchHandler({
    fetchImpl: async () => {
      called = true;
      return response('nope');
    }
  });
  const result = await handler.handleFetch({ requestId: 'r5', url: 'file:///etc/passwd', headers: {}, body: '{}' });
  assert.equal(result.error.kind, 'blocked');
  assert.equal(called, false);
});

test('an abort from the content script resolves as kind "aborted"', async () => {
  const handler = createFetchHandler({
    fetchImpl: (url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      })
  });

  const pending = handler.handleFetch({ requestId: 'r6', url: 'https://api.example.com/v1', headers: {}, body: '{}' });
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(handler.abort('r6'), true);
  const result = await pending;
  assert.equal(result.error.kind, 'aborted');
  assert.equal(result.error.message, 'Cancelled by user');
  assert.equal(handler.abort('r6'), false, 'a second abort for the same request is a no-op');
});

test('the clamped timeout aborts the request and reports kind "timeout"', async () => {
  const handler = createFetchHandler({
    fetchImpl: (url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        });
      })
  });

  const started = Date.now();
  const result = await handler.handleFetch({
    requestId: 'r7',
    url: 'https://api.example.com/v1',
    headers: {},
    body: '{}',
    timeoutMs: 1
  });
  const elapsed = Date.now() - started;

  assert.equal(result.error.kind, 'timeout');
  assert.equal(result.error.message, 'Request timed out');
  assert.ok(elapsed >= 900, `expected the 1000ms floor, waited ${elapsed}ms`);
  assert.equal(handler.inFlight.size, 0);
});
