import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCore } from './helpers/load.js';

function ctxFor(overrides = {}) {
  return {
    provider: 'openai',
    model: 'some-model',
    baseUrl: 'https://api.example.com/v1',
    apiKey: 'sk-test',
    targetLanguage: 'fa',
    sourceLanguage: 'en',
    qualityMode: false,
    style: 'natural',
    kind: 'block',
    context: { domain: 'example.com', pageTitle: 'Test', glossary: {} },
    stats: { skipped: 0, lastError: '' },
    ...overrides
  };
}

/* Replace the provider factory so the engine's cache/chunk/retry logic is
 * exercised without any network. */
function stubProvider(AIPT, handlers) {
  const calls = { translate: [], polish: [], ctx: [] };
  AIPT.Providers.createProvider = () => ({
    type: 'openai',
    translate: async (texts, ctx) => {
      calls.translate.push(Array.from(texts));
      calls.ctx.push({ ...ctx });
      return handlers.translate(texts);
    },
    polish: async (pairs) => {
      calls.polish.push(Array.from(pairs));
      return handlers.polish(pairs);
    }
  });
  return calls;
}

test('cache: a polish pass never reuses the first-pass entry for identical text (B5)', async () => {
  const { AIPT } = loadCore();
  const calls = stubProvider(AIPT, {
    translate: (texts) => texts.map((t) => t), // model echoes the source unchanged
    polish: (pairs) => pairs.map((pair) => 'POLISHED:' + pair.translation)
  });

  const result = await AIPT.Engine.translateTexts(['same'], ctxFor({ qualityMode: true }));

  assert.deepEqual(Array.from(result), ['POLISHED:same'], 'the polish pass must run and its output must win');
  assert.equal(calls.polish.length, 1, 'polish must not be served from the translate cache entry');
});

test('quality mode reviews every segment against its source, not blind polish', async () => {
  const { AIPT } = loadCore();
  const calls = stubProvider(AIPT, {
    translate: (texts) => texts.map(() => 'bad translation'),
    polish: (pairs) => pairs.map((pair) => pair.source === 'hello' ? 'سلام' : 'x')
  });

  const result = await AIPT.Engine.translateTexts(['hello'], ctxFor({ qualityMode: true }));
  assert.deepEqual(Array.from(result), ['سلام']);

  const pair = calls.polish[0][0];
  assert.equal(pair.source, 'hello', 'the editor receives the source text');
  assert.equal(pair.translation, 'bad translation', 'and the first-pass translation');
});

test('cache: editing the prompt invalidates cached translations (prompt version in the key) (B5)', async () => {
  const { AIPT } = loadCore();
  const calls = stubProvider(AIPT, {
    translate: (texts) => texts.map(() => 'v' + AIPT.Providers.PROMPT_VERSION),
    polish: (pairs) => pairs.map((p) => p.translation)
  });

  AIPT.Providers.PROMPT_VERSION = 1;
  assert.deepEqual(Array.from(await AIPT.Engine.translateTexts(['hello'], ctxFor())), ['v1']);

  const cached = await AIPT.Engine.translateTexts(['hello'], ctxFor());
  assert.deepEqual(Array.from(cached), ['v1']);
  assert.equal(calls.translate.length, 1, 'the second identical request is a cache hit');

  AIPT.Providers.PROMPT_VERSION = 2;
  const afterPromptEdit = await AIPT.Engine.translateTexts(['hello'], ctxFor());
  assert.deepEqual(Array.from(afterPromptEdit), ['v2'], 'a prompt edit must not serve stale output');
  assert.equal(calls.translate.length, 2);
});

test('cache: key identity is exact, not a 32-bit hash (B5)', () => {
  const { AIPT } = loadCore();
  const ctx = ctxFor();
  const key = (texts, c = ctx, pass = 'translate') => AIPT.Engine.cacheKey(texts, c, pass);

  // Segment boundaries can never alias.
  assert.notEqual(key(['a', 'b']), key(['a\u0001b']));
  assert.notEqual(key(['ab', 'c']), key(['a', 'bc']));
  assert.notEqual(key(['', 'x']), key(['x', '']));

  // The pass and the prompt version are part of the identity.
  assert.notEqual(key(['x']), key(['x'], ctx, 'polish'));

  // So are the channel (prose vs UI label), the style setting and the strict retry.
  assert.notEqual(key(['x']), key(['x'], ctxFor({ kind: 'label' })));
  assert.notEqual(key(['x']), key(['x'], ctxFor({ style: 'literal' })));
  assert.notEqual(key(['x']), key(['x'], ctxFor({ strictTags: true })));

  // The key carries the request itself, so it cannot be a truncated hash.
  const long = 'segment text that must survive verbatim in the key';
  assert.ok(key([long]).includes(long));

  // Everything else that changes the request changes the key.
  assert.notEqual(key(['x']), key(['x'], ctxFor({ targetLanguage: 'de' })));
  assert.notEqual(key(['x']), key(['x'], ctxFor({ model: 'other-model' })));
  assert.notEqual(key(['x']), key(['x'], ctxFor({ sourceLanguage: 'fr' })));
  assert.notEqual(
    key(['x']),
    key(['x'], ctxFor({ context: { glossary: { API: 'API' } } }))
  );

  // Glossary insertion order is normalised instead of creating two entries.
  assert.equal(
    key(['x'], ctxFor({ context: { glossary: { a: '1', b: '2' } } })),
    key(['x'], ctxFor({ context: { glossary: { b: '2', a: '1' } } }))
  );
});

test('cache: identical requests are served from memory, different ones are not', async () => {
  const { AIPT } = loadCore();
  const calls = stubProvider(AIPT, {
    translate: (texts) => texts.map((t) => 'T:' + t),
    polish: (pairs) => pairs.map((p) => p.translation)
  });

  assert.deepEqual(Array.from(await AIPT.Engine.translateTexts(['a', 'b'], ctxFor())), ['T:a', 'T:b']);
  assert.deepEqual(Array.from(await AIPT.Engine.translateTexts(['a', 'b'], ctxFor())), ['T:a', 'T:b']);
  assert.equal(calls.translate.length, 1);

  await AIPT.Engine.translateTexts(['a', 'c'], ctxFor());
  assert.equal(calls.translate.length, 2, 'different text is a different cache entry');
});

test('chunking respects the 24-unit and 2400-char limits', async () => {
  const { AIPT } = loadCore();
  const calls = stubProvider(AIPT, {
    translate: (texts) => texts.map((t) => 'T:' + t),
    polish: (pairs) => pairs.map((p) => p.translation)
  });

  const segments = Array.from({ length: 25 }, (_, i) => 'segment ' + i);
  const result = await AIPT.Engine.translateTexts(segments, ctxFor());
  assert.equal(result.length, 25);
  assert.equal(calls.translate.length, 2, '25 units must be split into two chunks');
  for (const chunk of calls.translate) {
    assert.ok(chunk.length <= 24, 'chunk exceeded 24 units');
    const chars = chunk.reduce((sum, t) => sum + t.length, 0);
    assert.ok(chars <= 2400, 'chunk exceeded 2400 characters');
  }

  const long = ['a', 'b', 'c'].map((c) => c.repeat(2500));
  await AIPT.Engine.translateTexts(long, ctxFor());
  const longChunks = calls.translate.slice(2);
  assert.equal(longChunks.length, 3, 'one oversized unit per chunk');
});

test('retry: network failures are retried with backoff, then succeed', async () => {
  const { AIPT } = loadCore();
  let attempts = 0;
  const calls = stubProvider(AIPT, {
    translate: (texts) => {
      attempts++;
      if (attempts < 3) throw new AIPT.Providers.ProviderError('offline', 'network');
      return texts.map((t) => 'T:' + t);
    },
    polish: (pairs) => pairs.map((p) => p.translation)
  });

  const result = await AIPT.Engine.translateTexts(['a'], ctxFor());
  assert.deepEqual(Array.from(result), ['T:a']);
  assert.equal(attempts, 3);
  assert.equal(calls.translate.length, 3);
});

test('retry: aborts are never retried', async () => {
  const { AIPT } = loadCore();
  let attempts = 0;
  stubProvider(AIPT, {
    translate: () => {
      attempts++;
      throw new AIPT.Providers.ProviderError('Cancelled by user', 'abort');
    },
    polish: (pairs) => pairs.map((p) => p.translation)
  });

  await assert.rejects(
    () => AIPT.Engine.translateTexts(['a'], ctxFor()),
    (err) => err.type === 'abort'
  );
  assert.equal(attempts, 1, 'an abort must not be retried');
});

test('bisect: a count error splits the chunk instead of failing the page', async () => {
  const { AIPT } = loadCore();
  stubProvider(AIPT, {
    translate: (texts) => {
      if (texts.length > 1) throw new AIPT.Providers.ProviderError('count mismatch', 'count');
      return texts.map((t) => 'T:' + t);
    },
    polish: (pairs) => pairs.map((p) => p.translation)
  });

  const ctx = ctxFor();
  const result = await AIPT.Engine.translateTexts(['a', 'b', 'c'], ctx);
  assert.deepEqual(Array.from(result), ['T:a', 'T:b', 'T:c']);
  assert.equal(ctx.stats.skipped, 0);
});

test('bisect: one permanently failing segment stays original and is counted as skipped', async () => {
  const { AIPT } = loadCore();
  stubProvider(AIPT, {
    translate: (texts) => {
      if (texts.includes('b')) throw new AIPT.Providers.ProviderError('count mismatch', 'count');
      return texts.map((t) => 'T:' + t);
    },
    polish: (pairs) => pairs.map((p) => p.translation)
  });

  const ctx = ctxFor();
  const result = await AIPT.Engine.translateTexts(['a', 'b', 'c'], ctx);
  assert.deepEqual(Array.from(result), ['T:a', 'b', 'T:c']);
  assert.equal(ctx.stats.skipped, 1);
});

test('chunk progress callback receives chunk-sized slices in order', async () => {
  const { AIPT } = loadCore();
  stubProvider(AIPT, {
    translate: (texts) => texts.map((t) => 'T:' + t),
    polish: (pairs) => pairs.map((p) => p.translation)
  });

  const seen = [];
  const segments = Array.from({ length: 45 }, (_, i) => 's' + i);
  const result = await AIPT.Engine.translateTexts(segments, ctxFor(), undefined, (offset, chunk) => {
    seen.push({ offset, chunk: Array.from(chunk) });
  });

  assert.equal(result.length, 45);
  assert.equal(seen.length, 2);
  assert.equal(seen[0].offset, 0);
  assert.equal(seen[1].offset, 24);
  assert.deepEqual(seen[1].chunk.slice(0, 2), ['T:s24', 'T:s25']);
});

test('the output budget is derived from the input size and passed to the provider', async () => {
  const { AIPT } = loadCore();
  const calls = stubProvider(AIPT, {
    translate: (texts) => texts.map((t) => 'T:' + t),
    polish: (pairs) => pairs.map((p) => p.translation)
  });

  await AIPT.Engine.translateTexts(['short text'], ctxFor());
  const small = calls.ctx[0].maxOutputTokens;
  await AIPT.Engine.translateTexts(['x'.repeat(2000)], ctxFor());
  const large = calls.ctx[1].maxOutputTokens;

  assert.ok(small >= 768, 'a small chunk still gets a usable ceiling');
  assert.ok(large > small, 'a large chunk gets a larger ceiling');
  assert.ok(large <= 8192, 'the ceiling is capped');

  assert.equal(AIPT.Providers.outputTokenBudget([]), 768);
  assert.equal(AIPT.Providers.outputTokenBudget(['x'.repeat(20000)]), 8192);
});

test('clearCache drops every entry', async () => {
  const { AIPT } = loadCore();
  const calls = stubProvider(AIPT, {
    translate: (texts) => texts.map((t) => 'T:' + t),
    polish: (pairs) => pairs.map((p) => p.translation)
  });

  await AIPT.Engine.translateTexts(['a'], ctxFor());
  AIPT.Engine.clearCache();
  await AIPT.Engine.translateTexts(['a'], ctxFor());
  assert.equal(calls.translate.length, 2);
});
