import test from 'node:test';
import assert from 'node:assert/strict';
import { loadCore } from './helpers/load.js';

function okResponse(content) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ choices: [{ message: { content } }] }),
    headers: { get: () => null }
  };
}

function loadWithFetch(response) {
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url, init });
    return response;
  };
  const { AIPT } = loadCore({ fetch: fakeFetch });
  return { AIPT, calls };
}

function openaiConfig(overrides = {}) {
  return {
    provider: 'openai',
    model: 'some-model',
    baseUrl: 'https://api.example.com/v1',
    apiKey: 'sk-test',
    ...overrides
  };
}

function translateCtx(overrides = {}) {
  return {
    provider: 'openai',
    model: 'some-model',
    baseUrl: 'https://api.example.com/v1',
    apiKey: 'sk-test',
    targetLanguage: 'fa',
    targetLanguageName: 'Persian',
    sourceLanguage: 'en',
    sourceLanguageName: 'English',
    qualityMode: false,
    context: { domain: 'example.com', pageTitle: 'Test', glossary: {} },
    ...overrides
  };
}

test('validateConfig: openai with https base URL and no key asks for a key instead of throwing (B1)', () => {
  const { AIPT } = loadCore();
  assert.equal(
    AIPT.Providers.validateConfig(openaiConfig({ apiKey: '' })),
    'API key is required (Options).'
  );
  // The historical crash: `host` was block-scoped to the https: branch above.
  assert.equal(AIPT.Providers.validateConfig(openaiConfig({ apiKey: '   ' })), 'API key is required (Options).');
});

test('validateConfig: openai accepts loopback endpoints without a key (B1)', () => {
  const { AIPT } = loadCore();
  for (const baseUrl of [
    'http://localhost:1234/v1',
    'http://127.0.0.1:8080/v1',
    'http://[::1]:1234/v1'
  ]) {
    assert.equal(
      AIPT.Providers.validateConfig(openaiConfig({ baseUrl, apiKey: '' })),
      null,
      `${baseUrl} should be accepted without a key`
    );
  }
});

test('validateConfig: openai rejects plain http on a remote host', () => {
  const { AIPT } = loadCore();
  assert.equal(
    AIPT.Providers.validateConfig(openaiConfig({ baseUrl: 'http://api.example.com/v1' })),
    'Base URL must start with https://'
  );
  assert.equal(
    AIPT.Providers.validateConfig(openaiConfig({ baseUrl: 'http://localhost.evil.com/v1' })),
    'Base URL must start with https://',
    'a host that merely starts with "localhost" is not loopback'
  );
});

test('validateConfig: malformed base URL, missing base URL and missing model', () => {
  const { AIPT } = loadCore();
  assert.equal(
    AIPT.Providers.validateConfig(openaiConfig({ baseUrl: 'not a url' })),
    'Base URL must be a valid URL.'
  );
  assert.equal(
    AIPT.Providers.validateConfig(openaiConfig({ baseUrl: '' })),
    'Base URL is required, e.g. https://integrate.api.nvidia.com/v1 (Options).'
  );
  assert.equal(AIPT.Providers.validateConfig(openaiConfig({ model: '  ' })), 'Model name is required (Options).');
  assert.equal(AIPT.Providers.validateConfig({ provider: 'nope', model: 'm' }), 'Choose a provider in Options.');
});

test('validateConfig: gemini requires a key, ollama does not require a base URL', () => {
  const { AIPT } = loadCore();
  assert.equal(
    AIPT.Providers.validateConfig({ provider: 'gemini', model: 'gemini-2.5-flash', apiKey: '' }),
    'Gemini API key is required (Options).'
  );
  assert.equal(
    AIPT.Providers.validateConfig({ provider: 'gemini', model: 'gemini-2.5-flash', apiKey: 'k' }),
    null
  );
  assert.equal(AIPT.Providers.validateConfig({ provider: 'ollama', model: 'llama3' }), null);
  assert.equal(
    AIPT.Providers.validateConfig({ provider: 'ollama', model: 'llama3', baseUrl: 'ftp://x' }),
    'Base URL must be http or https.'
  );
});

test('validateConfig and getState share one code path, so a keyless local endpoint never surfaces a ReferenceError', () => {
  const { AIPT } = loadCore();
  let result;
  assert.doesNotThrow(() => {
    result = AIPT.Providers.validateConfig({
      provider: 'openai',
      model: 'local-model',
      baseUrl: 'http://localhost:1234/v1',
      apiKey: '',
      targetLanguage: 'fa'
    });
  });
  assert.equal(result, null);
});

test('normalizeBaseUrl strips trailing slashes and a pasted /chat/completions suffix', () => {
  const { AIPT } = loadCore();
  assert.equal(AIPT.Providers.normalizeBaseUrl(' https://x.dev/v1/ '), 'https://x.dev/v1');
  assert.equal(AIPT.Providers.normalizeBaseUrl('https://x.dev/v1/chat/completions'), 'https://x.dev/v1');
  assert.equal(AIPT.Providers.normalizeBaseUrl(''), '');
  assert.equal(AIPT.Providers.normalizeBaseUrl(undefined), '');
});

test('translateRaw sends the key in a header and never inside the prompt body', async () => {
  const { AIPT, calls } = loadWithFetch(okResponse('["ترجمه"]'));
  const out = await AIPT.Providers.translateRaw(['hello'], translateCtx());
  assert.deepEqual(Array.from(out), ['ترجمه']);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer sk-test');
  assert.equal(calls[0].init.body.includes('sk-test'), false);
  assert.equal(calls[0].init.credentials, 'omit');
  assert.equal(calls[0].init.redirect, 'error');
});

test('translateRaw tolerates markdown fences and <think> blocks', async () => {
  const { AIPT } = loadWithFetch(okResponse('```json\n["a","b"]\n```'));
  assert.deepEqual(Array.from(await AIPT.Providers.translateRaw(['x', 'y'], translateCtx())), ['a', 'b']);

  const withThink = loadWithFetch(okResponse('<think>hidden</think>["only"]'));
  assert.deepEqual(Array.from(await withThink.AIPT.Providers.translateRaw(['x'], translateCtx())), ['only']);
});

test('translateRaw unwraps an object that contains the array', async () => {
  const { AIPT } = loadWithFetch(okResponse('{"translations":["a"]}'));
  assert.deepEqual(Array.from(await AIPT.Providers.translateRaw(['x'], translateCtx())), ['a']);
});

test('translateRaw reports segment-count mismatches as type "count"', async () => {
  const { AIPT } = loadWithFetch(okResponse('["only-one"]'));
  await assert.rejects(
    () => AIPT.Providers.translateRaw(['a', 'b'], translateCtx()),
    (err) => err instanceof AIPT.Providers.ProviderError && err.type === 'count'
  );
});

test('translateRaw reports non-array output as type "parse"', async () => {
  const { AIPT } = loadWithFetch(okResponse('sorry, I cannot do that'));
  await assert.rejects(
    () => AIPT.Providers.translateRaw(['a'], translateCtx()),
    (err) => err instanceof AIPT.Providers.ProviderError && err.type === 'parse'
  );
});

test('HTTP error statuses map to provider error types', async () => {
  const cases = [
    [401, 'auth'],
    [404, 'model'],
    [429, 'ratelimit'],
    [400, 'badrequest'],
    [500, 'server']
  ];
  for (const [status, type] of cases) {
    const { AIPT } = loadWithFetch({
      ok: false,
      status,
      text: async () => '{"error":"nope"}',
      headers: { get: () => null }
    });
    await assert.rejects(
      () => AIPT.Providers.translateRaw(['a'], translateCtx()),
      (err) => err.type === type,
      `status ${status} should map to ${type}`
    );
  }
});

test('testConnection validates before calling the provider', async () => {
  const { AIPT, calls } = loadWithFetch(okResponse('["x"]'));
  const res = await AIPT.Providers.testConnection({ provider: 'openai', model: 'm', baseUrl: 'https://a.dev/v1', apiKey: '' });
  assert.equal(res.ok, false);
  assert.equal(res.type, 'config');
  assert.equal(calls.length, 0);
});

test('id-based answers are matched by id, not by position', async () => {
  const { AIPT } = loadWithFetch(okResponse('[{"id":2,"text":"دوم"},{"id":1,"text":"اول"}]'));
  const out = await AIPT.Providers.translateRaw(['one', 'two'], translateCtx());
  assert.deepEqual(Array.from(out), ['اول', 'دوم']);
});

test('a duplicated, missing or unknown id is rejected instead of shifting translations', async () => {
  for (const raw of [
    '[{"id":1,"text":"a"},{"id":1,"text":"b"}]',
    '[{"id":1,"text":"a"},{"id":3,"text":"b"}]',
    '[{"id":1,"text":"a"}]',
    '[{"id":1},{"id":2,"text":"b"}]'
  ]) {
    const { AIPT } = loadWithFetch(okResponse(raw));
    await assert.rejects(
      () => AIPT.Providers.translateRaw(['one', 'two'], translateCtx()),
      (err) => err instanceof AIPT.Providers.ProviderError && (err.type === 'count' || err.type === 'parse'),
      raw
    );
  }
});

test('Persian output is normalised: letters, punctuation, ZWNJ', () => {
  const { AIPT } = loadCore();
  const n = (s) => AIPT.Providers.normalizeTarget(s, 'fa');

  assert.equal(n('اين كتاب'), 'این کتاب', 'Arabic yeh/kaf become Persian');
  assert.equal(n('می شود'), 'می‌شود');
  assert.equal(n('نمی کند'), 'نمی‌کند');
  assert.equal(n('کتاب ها'), 'کتاب‌ها');
  assert.equal(n('بزرگ تر'), 'بزرگ‌تر');
  assert.equal(n('سلام ,دنیا'), 'سلام، دنیا');
  assert.equal(n('چطوری ?'), 'چطوری؟');
  assert.equal(n('سلام ، دنیا'), 'سلام، دنیا');
  assert.equal(n('  دو فاصله  '), 'دو فاصله');
  assert.equal(n('نسخه 2.5 و API'), 'نسخه 2.5 و API', 'digits and Latin terms are left alone');
  assert.equal(AIPT.Providers.normalizeTarget('Hello, world', 'de'), 'Hello, world');
});

test('the system prompt carries the target style guide, tag rules, examples and glossary', async () => {
  const { AIPT, calls } = loadWithFetch(okResponse('[{"id":1,"text":"x"}]'));
  await AIPT.Providers.translateRaw(['Hello'], translateCtx({
    context: { domain: 'd', pageTitle: 't', headings: ['H'], glossary: { price: '$1' } }
  }));
  const body = JSON.parse(calls[0].init.body);
  const system = body.messages[0].content;
  const user = body.messages[1].content;

  assert.match(system, /Persian \(فارسی\)/);
  assert.match(system, /<t1>/);
  assert.match(system, /zero-width non-joiner/);
  assert.match(system, /Settings/, 'the Persian few-shot examples are included');
  assert.match(system, /"price" → "\$1"/, 'a glossary value with $ is not mangled by replace()');
  assert.match(system, /Main headings: H/);
  assert.equal(user.includes('"id":1'), true);
  assert.equal(user.includes('"headings":["H"]'), true);
});

test('strictTags adds the retry instruction to the prompt', async () => {
  const { AIPT, calls } = loadWithFetch(okResponse('[{"id":1,"text":"x"}]'));
  await AIPT.Providers.translateRaw(['Hello'], translateCtx({ strictTags: true }));
  const system = JSON.parse(calls[0].init.body).messages[0].content;
  assert.match(system, /This retry is stricter/);
});

test('the UI-label channel is marked in the request', async () => {
  const { AIPT, calls } = loadWithFetch(okResponse('[{"id":1,"text":"x"}]'));
  await AIPT.Providers.translateRaw(['Search'], translateCtx({ kind: 'label' }));
  const user = JSON.parse(calls[0].init.body).messages[1].content;
  assert.equal(user.includes('"kind":"ui-label"'), true);
});

test('source language detection is one cheap call and is cached', async () => {
  const { AIPT, calls } = loadWithFetch(okResponse('{"code":"en","name":"English"}'));
  const sample = 'This is an English sentence long enough to be detected reliably.';
  const first = await AIPT.Providers.detectLanguage(sample, translateCtx());
  assert.equal(first.code, 'en');
  assert.equal(first.name, 'English');

  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.max_tokens, 512, 'detection asks for a small, not-tiny answer');

  const second = await AIPT.Providers.detectLanguage(sample, translateCtx());
  assert.equal(second.code, 'en');
  assert.equal(second.name, 'English');
  assert.equal(calls.length, 1, 'the second detection is served from the cache');
});

test('Ollama requests set num_ctx so long chunks are not silently truncated', async () => {
  const response = {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ message: { content: '[{"id":1,"text":"x"}]' } }),
    headers: { get: () => null }
  };
  const { AIPT, calls } = loadWithFetch(response);
  await AIPT.Providers.translateRaw(['Hello'], translateCtx({ provider: 'ollama', model: 'llama3', baseUrl: '', apiKey: '' }));
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.options.num_ctx, 8192);
  assert.ok(body.options.num_predict >= 768);
});

test('thinking settings match what each Gemini generation actually accepts', async () => {
  const response = {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ candidates: [{ content: { parts: [{ text: '[{"id":1,"text":"x"}]' }] } }] }),
    headers: { get: () => null }
  };

  const cases = [
    ['gemini-2.5-flash', { thinkingBudget: 0 }],
    ['gemini-2.5-flash-lite', { thinkingBudget: 0 }],
    ['gemini-2.5-flash-preview-05-20', { thinkingBudget: 0 }],
    ['gemini-2.5-pro', { thinkingBudget: 128 }],
    ['gemini-3.8-flash', { thinkingLevel: 'low' }],
    ['gemini-3-pro-preview', { thinkingLevel: 'low' }],
    ['gemini-4-argon', { thinkingLevel: 'low' }],
    ['gemini-2.0-flash', undefined]
  ];

  for (const [model, expected] of cases) {
    const { AIPT, calls } = loadWithFetch(response);
    await AIPT.Providers.translateRaw(['Hi'], translateCtx({ provider: 'gemini', model, baseUrl: '', apiKey: 'k' }));
    assert.deepEqual(JSON.parse(calls[0].init.body).generationConfig.thinkingConfig, expected, model);
  }

  const { AIPT: direct } = loadCore();
  assert.equal(
    JSON.stringify(direct.Providers.geminiThinkingConfig('gemini-2.5-pro')),
    '{"thinkingBudget":128}'
  );
});

test('a Gemini 400 on a thinking setting is retried once without it', async () => {
  const bodies = [];
  const responses = [
    {
      ok: false,
      status: 400,
      text: async () => '{"error":{"code":400,"message":"Request contains an invalid argument.","status":"INVALID_ARGUMENT"}}',
      headers: { get: () => null }
    },
    {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ candidates: [{ content: { parts: [{ text: '[{"id":1,"text":"x"}]' }] } }] }),
      headers: { get: () => null }
    }
  ];
  const { AIPT } = loadCore({
    fetch: async (url, init) => {
      bodies.push(JSON.parse(init.body));
      return responses.shift();
    }
  });

  const out = await AIPT.Providers.translateRaw(
    ['Hi'],
    translateCtx({ provider: 'gemini', model: 'gemini-2.5-pro', baseUrl: '', apiKey: 'k' })
  );

  assert.deepEqual(Array.from(out), ['x']);
  assert.equal(bodies.length, 2, 'the request is retried exactly once');
  assert.deepEqual(bodies[0].generationConfig.thinkingConfig, { thinkingBudget: 128 });
  assert.equal(bodies[1].generationConfig.thinkingConfig, undefined, 'the retry drops only the thinking setting');
  assert.equal(bodies[1].contents[0].parts[0].text, bodies[0].contents[0].parts[0].text, 'the prompt is unchanged');
});

test('a persistent Gemini 400 names the model instead of a bare JSON blob', async () => {
  const { AIPT } = loadWithFetch({
    ok: false,
    status: 400,
    text: async () => '{"error":{"code":400,"message":"Request contains an invalid argument.","status":"INVALID_ARGUMENT"}}',
    headers: { get: () => null }
  });

  await assert.rejects(
    () => AIPT.Providers.translateRaw(['Hi'], translateCtx({ provider: 'gemini', model: 'gemini-9-unknown', baseUrl: '', apiKey: 'k' })),
    (err) => err.type === 'badrequest' && err.message.includes('gemini-9-unknown') && err.message.includes('INVALID_ARGUMENT')
  );
});
