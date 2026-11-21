/* AI Page Translator — translation engine: cache, chunking, concurrency limit, retry, cancel */

AIPT.Engine = (() => {
  const memoryCache = new Map(); // key -> {translations, ts}
  const MAX_MEMORY_CACHE = 400;
  const CONCURRENCY = 2;
  // Units are whole blocks now, so a chunk of 24 blocks is already a lot of
  // prose and output tokens. Smaller chunks keep the model's array answers
  // short, which is where count/JSON failures used to start.
  const MAX_CHUNK_CHARS = 2400;
  const MAX_CHUNK_SEGMENTS = 24;
  const MAX_RETRIES_TRANSLATE = 3;
  // Bump when the cache layout itself changes.
  const CACHE_SCHEMA = 2;

  const running = new Set();
  const queue = [];

  function drain() {
    while (running.size < CONCURRENCY && queue.length) {
      const item = queue.shift();
      if (item.signal?.aborted) {
        item.reject(new AIPT.Providers.ProviderError('Cancelled by user', 'abort'));
        drain();
        continue;
      }
      running.add(item);
      item.task().then(
        val => { running.delete(item); item.resolve(val); drain(); },
        err => { running.delete(item); item.reject(err); drain(); }
      );
    }
  }

  function enqueue(task, signal) {
    return new Promise((resolve, reject) => {
      queue.push({ resolve, reject, task, signal });
      drain();
    });
  }

  // Cache identity is the full request, JSON-encoded: no 32-bit hash, so two
  // different chunks can never overwrite each other. The pass (first pass vs
  // polish), the prompt version, the channel (prose vs UI label) and the style
  // setting are part of the identity, so editing the prompt, switching style or
  // changing channel never serves stale output.
  function cacheKey(texts, ctx, pass) {
    const glossary = Object.entries(ctx.context?.glossary || {})
      .map(([term, translation]) => [String(term), String(translation)])
      .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    return JSON.stringify([
      CACHE_SCHEMA,
      AIPT.Providers.PROMPT_VERSION ?? 0,
      pass,
      ctx.kind || 'block',
      ctx.style || 'natural',
      !!ctx.strictTags,
      ctx.provider || '',
      ctx.model || '',
      ctx.baseUrl || '',
      ctx.targetLanguage || '',
      ctx.sourceLanguage || '',
      !!ctx.qualityMode,
      glossary,
      texts
    ]);
  }

  function sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      const id = setTimeout(resolve, ms);
      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(id);
          reject(new AIPT.Providers.ProviderError('Cancelled by user', 'abort'));
        }, { once: true });
      }
    });
  }

  async function withRetry(fn, signal, retryableTypes, maxAttempts, baseDelay) {
    let lastErr;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (signal?.aborted) throw new AIPT.Providers.ProviderError('Cancelled by user', 'abort');
      try {
        return await fn(signal);
      } catch (e) {
        lastErr = e;
        if (!retryableTypes.includes(e.type)) throw e;
        const wait = e.type === 'ratelimit' && e.retryAfterMs
          ? Math.min(e.retryAfterMs, 30000)
          : Math.min(baseDelay * Math.pow(2, attempt), e.type === 'ratelimit' ? 30000 : 8000);
        if (signal?.aborted) throw new AIPT.Providers.ProviderError('Cancelled by user', 'abort');
        await sleep(wait, signal);
      }
    }
    throw lastErr;
  }

  async function translateChunk(texts, ctx, signal) {
    const key = cacheKey(texts, ctx, 'translate');
    const cached = memoryCache.get(key);
    if (cached) return cached.translations;

    const provider = AIPT.Providers.createProvider(ctx.provider, ctx);
    const retryableTypes = ['network', 'timeout', 'ratelimit', 'server'];
    const maxOutputTokens = ctx.maxOutputTokens || AIPT.Providers.outputTokenBudget(texts);

    const translations = await withRetry(
      (sig) => provider.translate(texts, { ...ctx, signal: sig, maxOutputTokens }),
      signal,
      retryableTypes,
      MAX_RETRIES_TRANSLATE,
      600
    );

    memoryCache.set(key, { translations, ts: Date.now() });
    if (memoryCache.size > MAX_MEMORY_CACHE) memoryCache.delete(memoryCache.keys().next().value);
    return translations;
  }

  /* Source-aware second pass. The old polish call received only the first-pass
   * translations, so it could improve style but never notice a mistranslation.
   * Pairs give it the source to check against. */
  async function polishChunk(pairs, ctx, signal) {
    const sources = pairs.map((pair) => pair.source);
    const key = cacheKey(
      pairs.map((pair) => pair.source + '\u0000' + pair.translation),
      ctx,
      'polish'
    );
    const cached = memoryCache.get(key);
    if (cached) return cached.translations;

    const provider = AIPT.Providers.createProvider(ctx.provider, ctx);
    const retryableTypes = ['network', 'timeout', 'ratelimit', 'server'];
    const maxOutputTokens = ctx.maxOutputTokens || AIPT.Providers.outputTokenBudget(sources);

    const translations = await withRetry(
      (sig) => provider.polish(pairs, { ...ctx, signal: sig, maxOutputTokens }),
      signal,
      retryableTypes,
      2,
      600
    );

    memoryCache.set(key, { translations, ts: Date.now() });
    if (memoryCache.size > MAX_MEMORY_CACHE) memoryCache.delete(memoryCache.keys().next().value);
    return translations;
  }

  async function bisectTranslate(texts, ctx, signal, depth = 0) {
    if (texts.length <= 1) {
      if (ctx.stats) {
        ctx.stats.skipped++;
        ctx.stats.lastError = 'Single segment failed after retries';
      }
      return texts; // Return original
    }
    const mid = Math.ceil(texts.length / 2);
    const left = texts.slice(0, mid);
    const right = texts.slice(mid);
    // Each half goes through the full procedure (retry, then bisect again on parse/count/truncated)
    const leftRes = await translateChunk(left, ctx, signal).catch(e => {
      if (e.type === 'parse' || e.type === 'count' || e.type === 'truncated') {
        return bisectTranslate(left, ctx, signal, depth + 1);
      }
      throw e;
    });
    const rightRes = await translateChunk(right, ctx, signal).catch(e => {
      if (e.type === 'parse' || e.type === 'count' || e.type === 'truncated') {
        return bisectTranslate(right, ctx, signal, depth + 1);
      }
      throw e;
    });
    return [...leftRes, ...rightRes];
  }

  async function translateTexts(texts, ctx, signal, onChunk) {
    if (!texts.length) return [];

    // Chunking
    const chunks = [];
    let cur = [], curChars = 0;
    for (const t of texts) {
      if ((curChars + t.length > MAX_CHUNK_CHARS || cur.length >= MAX_CHUNK_SEGMENTS) && cur.length) {
        chunks.push(cur);
        cur = []; curChars = 0;
      }
      cur.push(t); curChars += t.length;
    }
    if (cur.length) chunks.push(cur);

    const results = new Array(chunks.length);

    // Start all chunks concurrently (up to CONCURRENCY limit)
    const promises = chunks.map((chunk, i) =>
      enqueue(async () => {
        if (signal?.aborted) throw new AIPT.Providers.ProviderError('Cancelled by user', 'abort');
        let chunkRes;
        try {
          chunkRes = await translateChunk(chunk, ctx, signal);
        } catch (e) {
          if (e.type === 'parse' || e.type === 'count' || e.type === 'truncated') {
            // parse/count/truncated are not retried: retrying a malformed answer
            // rarely helps, so the chunk is bisected instead.
            chunkRes = await bisectTranslate(chunk, ctx, signal);
          } else {
            throw e;
          }
        }

        // Quality mode: review this chunk against its source.
        if (ctx.qualityMode && !signal?.aborted) {
          try {
            const pairs = chunk.map((source, index) => ({
              source,
              translation: typeof chunkRes[index] === 'string' ? chunkRes[index] : source
            }));
            chunkRes = await polishChunk(pairs, ctx, signal);
          } catch (e) {
            if (e.type !== 'abort') {
              console.warn('[AI Page Translator] Polish failed for chunk, keeping first pass:', e.message);
            }
          }
        }

        if (signal?.aborted) throw new AIPT.Providers.ProviderError('Cancelled by user', 'abort');
        const offset = chunks.slice(0, i).flat().length;
        if (onChunk) onChunk(offset, chunkRes);
        results[i] = chunkRes;
      }, signal)
    );

    await Promise.all(promises);

    if (signal?.aborted) throw new AIPT.Providers.ProviderError('Cancelled by user', 'abort');
    return results.flat();
  }

  function clearCache() {
    memoryCache.clear();
  }

  function cancelAll() {
    queue.length = 0;
    running.forEach(item => item.reject(new AIPT.Providers.ProviderError('Cancelled by user', 'abort')));
    running.clear();
  }

  return { translateTexts, cacheKey, clearCache, cancelAll };
})();
