/* AI Page Translator — provider layer: Google Gemini, OpenAI-compatible, Ollama.
 *
 * This file also owns the translation contract: the system prompts, the
 * per-language style guides, the id-based JSON parser and the target-language
 * typography normaliser. They change together: a prompt is only as good as the
 * parser that reads its answer and the normaliser that cleans it.
 */

AIPT.Providers = (() => {
  class ProviderError extends Error {
    constructor(message, type = 'unknown') {
      super(message);
      this.type = type;
      this.name = 'ProviderError';
    }
  }

  /* ------------------------------------------------------------------ *
   * Target-language style guides
   *
   * These are the part of the prompt that decides whether the output reads
   * like native writing or like a translation. They are written as
   * instructions in English (models follow explicit English instructions
   * most reliably) but every example is in the target language.
   * ------------------------------------------------------------------ */

  const STYLE_GUIDES = {
    fa: `Write the Persian a Persian publication would print, not a Persian copy of the English sentence.
- Register: standard written Persian. Use "شما" for the reader, present tense for general statements, active voice. Match the segment's purpose: formal and precise for documentation, plain and direct for UI labels, lighter for marketing copy.
- Prefer a Persian verb to an English noun + light verb: "بررسی کنید" (not "بررسی را انجام دهید"), "نصب کنید" (not "نصب را انجام دهید"), "استفاده کنید" (not "مورد استفاده قرار دهید").
- Avoid the translationese markers: "می‌باشد" (use "است"), "بایستی" (use "باید"), "گردید" (use "شد"), "در رابطه با" (use "درباره"), long "که" chains, and passive "انجام می‌شود" when an active sentence is natural.
- Short sentences win. Split a long English sentence into two Persian sentences when a Persian writer would. Never keep English word order; the verb goes where Persian expects it.
- Idioms by meaning: "out of the box" → "بدون تنظیم اضافه", "under the hood" → "در پشت صحنه", "getting started" → "شروع کار", "read more" → "بیشتر بخوانید".
- Terminology: keep in Latin script only what Persian readers genuinely see that way — brand and product names, protocol and file names, code identifiers, and abbreviations like API, URL, HTML, JSON, HTTP, CSS, SDK, Wi-Fi, GitHub, npm. Everything else gets its established Persian word (مرورگر، پرونده، پیوند، سرویس، تنظیمات، حساب کاربری، ابزار، نسخه). Never leave an ordinary English word untranslated just because the source used it.
- Numbers, dates, versions and units stay exactly as in the source, with Latin digits. Do not convert them to Persian numerals.
- Orthography: "،" not ",", "؛" not ";", "؟" not "?", "«…»" for quoted phrases, and the Persian letters "ی" and "ک" (never the Arabic "ي" or "ك"). Join prefixes and suffixes with a zero-width non-joiner: "می‌شود", "نمی‌کند", "کتاب‌ها", "بزرگ‌تر". No space before "،" "؛" "؟" "!" ".".
- A segment must read as if it were written in Persian from the start: no explanations, no transliteration of whole sentences, no English original in parentheses, no added honorifics.`,
    ar: `Write natural Modern Standard Arabic as an Arabic publication would.
- Prefer verbal sentences and direct style; avoid literal English word order and heavy passive chains.
- Use "أنت" style address consistently; keep register consistent within the page.
- Keep brand names, code identifiers and standard technical abbreviations in Latin script; translate everything else to established Arabic terms.
- Use Arabic punctuation: "،" "؛" "؟" and "«…»" for quotes.
- Numbers and versions stay as written in the source.`,
    ur: `Write natural Urdu as an Urdu publication would, in standard register.
- Prefer Urdu verb order and idiom; do not mirror English word order.
- Use the Urdu letters "ی" and "ک", and join "می" and plural "یں"/"ات" naturally.
- Keep brand names and code identifiers in Latin script; use established Urdu terms otherwise.
- Numbers stay as written in the source.`,
    he: `Write natural Hebrew as an Israeli publication would.
- Prefer direct, contemporary phrasing over literal translation of English idioms.
- Keep register consistent; brand names and code identifiers stay in Latin script.
- Numbers and versions stay as written in the source.`,
    default: `Write the way a skilled native writer of the target language would write this page for native readers.
- Translate meaning, not words; never keep the source language's word order when the target language prefers another.
- Match the segment's purpose and register: documentation is precise, UI labels are short, marketing copy is natural and persuasive.
- Keep brand names, code identifiers and standard technical abbreviations in their usual form; use established native terms for everything else.
- Numbers, versions, URLs and code stay exactly as in the source.`
  };

  /* Few-shot examples are the cheapest way to move a model from "correct" to
   * "native". Only languages with curated examples get them. */
  const STYLE_EXAMPLES = {
    fa: [
      ['Click <t1>here</t1> to continue.', 'برای ادامه، روی <t1>اینجا</t1> کلیک کنید.'],
      ['The new policy takes effect immediately.', 'سیاست جدید بلافاصله اجرا می‌شود.'],
      ['Settings', 'تنظیمات']
    ],
    ar: [
      ['Click <t1>here</t1> to continue.', 'انقر <t1>هنا</t1> للمتابعة.'],
      ['Settings', 'الإعدادات']
    ]
  };

  function styleGuideFor(langCode) {
    const guide = STYLE_GUIDES[langCode] || STYLE_GUIDES.default;
    return guide;
  }

  function styleExamplesFor(langCode, targetLabel) {
    const examples = STYLE_EXAMPLES[langCode];
    if (!examples || !examples.length) return '(none — follow the style guide above)';
    return examples
      .map(([source, target]) => `Source: ${source}\n${targetLabel}: ${target}`)
      .join('\n\n');
  }

  /* ------------------------------------------------------------------ *
   * Prompts
   * ------------------------------------------------------------------ */

  const SYSTEM_PROMPT_TEMPLATE = `You are a professional translator localising a web page from "{{SOURCE}}" into "{{TARGET}}".

WHAT YOU RECEIVE
"segments" is a JSON array of {"id", "text"}. Each text is ONE block of the page: a paragraph, heading, list item, table cell, button label or a small group of links. Inline markup has already been replaced by tags:
  <t1>...</t1>  an inline element (link, emphasis, span) whose text is part of the sentence; translate that text in place.
  <v2/>         an inline element that must not be translated (code, image, form control, embedded widget); keep the token exactly as it is.
"page" gives the domain, page title and main headings. "glossary" gives fixed term translations. When a "context_text" field is present it is surrounding page text for understanding only — never translate it and never return it.

WHAT TO RETURN
A JSON array of {"id": <same id>, "text": "<translation>"} — exactly one entry per segment, same ids, same order. Return nothing before or after the array. No markdown fences, no explanations.

TRANSLATION RULES
1. Translate meaning, intent, tone and register — never word for word. The result must read as if a native {{TARGET}} writer had written this page for {{TARGET}} readers.
2. Keep every tag exactly as given, balanced, in the same nesting order, and place it where the {{TARGET}} sentence needs it. Never rename, drop, duplicate or invent a tag. Tags carry visible content: a link must still be a link in the right place.
3. Keep numbers, versions, dates, URLs, email addresses, code identifiers and placeholder tokens ({name}, %s, {{user}}, \${var}) unchanged.
4. Brand and product names stay in Latin script unless a widely used localised form exists.
5. Apply the glossary exactly; never contradict it.
6. Do not add, omit, explain, summarise or merge information. A heading stays a heading, a button label stays a short label, a caption stays a caption. Never answer a question the page asks.
7. Preserve line breaks inside a segment. Do not add leading or trailing spaces.
8. If a segment is already in {{TARGET}}, return it unchanged.
{{STRICT_TAGS}}

TARGET-LANGUAGE STYLE
{{STYLE_GUIDE}}

EXAMPLES
{{STYLE_EXAMPLES}}

PAGE CONTEXT
- Domain: {{DOMAIN}}
- Page title: {{PAGE_TITLE}}
- Main headings: {{HEADINGS}}
- Source language: {{SOURCE}}
- Target language: {{TARGET}}
- Segments appear in reading order; keep names, pronouns and terminology consistent with their neighbours.

GLOSSARY (fixed term translations — apply exactly, never contradict)
{{GLOSSARY}}

Translate now.`;

  // Increment whenever a prompt, style guide or the output contract changes: the
  // translation cache includes this value in its key, so an edit never reuses
  // output produced under the old rules.
  const PROMPT_VERSION = 3;

  const POLISH_PROMPT_TEMPLATE = `You are a senior bilingual editor. You receive translations of web page segments from "{{SOURCE}}" into "{{TARGET}}" and must make each one read as if a native {{TARGET}} writer wrote it.

INPUT
"segments" is a JSON array of {"id", "source", "translation"}.

WHAT TO RETURN
A JSON array of {"id": <same id>, "text": "<revised translation>"} — same ids, same order, raw JSON only.

WHAT TO FIX
- Literal calques, English word order, wrong idiom, unnatural collocations.
- Wrong or inconsistent register, pronouns and terminology across segments.
- Mistranslations: compare against "source" and correct the meaning.
- Broken tag balance, or a tag that ended up in a place that changes the sentence.

WHAT NEVER TO CHANGE
Numbers, versions, dates, URLs, email addresses, code identifiers, brand names, glossary terms, and the tags themselves (<t1>…</t1>, <v2/>). Do not add or remove information. If a translation is already good, return it unchanged.

TARGET-LANGUAGE STYLE
{{STYLE_GUIDE}}

Return the JSON array now.`;

  function fillTemplate(tmpl, ctx) {
    const glossary = Object.entries(ctx.context?.glossary || {})
      .map(([k, v]) => `- "${k}" → "${v}"`)
      .join('\n');
    const targetLabel = languageLabel(ctx);
    const sourceLabel = sourceLanguageLabel(ctx);
    const headings = (ctx.context?.headings || []).filter(Boolean).slice(0, 8).join(' | ');
    // Function replacements: a glossary value containing "$&" or "$1" must not
    // be interpreted as a replacement pattern.
    return tmpl
      .replace(/{{TARGET}}/g, () => targetLabel)
      .replace(/{{SOURCE}}/g, () => sourceLabel)
      .replace(/{{DOMAIN}}/g, () => ctx.context?.domain ?? 'a website')
      .replace(/{{PAGE_TITLE}}/g, () => ctx.context?.pageTitle ?? '')
      .replace(/{{HEADINGS}}/g, () => headings || '(none)')
      .replace(/{{GLOSSARY}}/g, () => glossary || '(none)')
      .replace(/{{STYLE_GUIDE}}/g, () => styleGuideFor(ctx.targetLanguage))
      .replace(/{{STYLE_EXAMPLES}}/g, () => styleExamplesFor(ctx.targetLanguage, targetLabel))
      .replace(
        /{{STRICT_TAGS}}/g,
        () =>
          ctx.strictTags
            ? '\n9. This retry is stricter: every tag below MUST appear exactly once and balanced. A missing tag means the visible link or code is lost, so keep the tags even if the sentence has to be rephrased.'
            : ''
      );
  }

  function languageLabel(ctx) {
    if (typeof AIPT.languageLabel === 'function') return AIPT.languageLabel(ctx.targetLanguage);
    return ctx.targetLanguageName || ctx.targetLanguage || 'the target language';
  }

  function sourceLanguageLabel(ctx) {
    if (!ctx.sourceLanguage || ctx.sourceLanguage === 'auto') {
      return 'the source language (infer it from the text; it is normally the language of the page)';
    }
    if (typeof AIPT.languageLabel === 'function' && ctx.sourceLanguageName !== 'auto-detect') {
      return AIPT.languageLabel(ctx.sourceLanguage);
    }
    return ctx.sourceLanguageName || ctx.sourceLanguage;
  }

  /* ------------------------------------------------------------------ *
   * Response parsing
   * ------------------------------------------------------------------ */

  function parseModelJson(text) {
    if (!text || !String(text).trim()) throw new ProviderError('Empty response from model', 'parse');
    let cleaned = String(text).trim();
    // Reasoning models: drop  thinking blocks, including an unterminated one.
    cleaned = cleaned.replace(/<think[\s\S]*?<\/think>/gi, '');
    cleaned = cleaned.replace(/<think[\s\S]*$/i, '');
    // Markdown fences.
    cleaned = cleaned.replace(/```[a-zA-Z]*\s*/g, '').replace(/```/g, '');
    const start = cleaned.search(/[[{]/);
    if (start === -1) throw new ProviderError('Model did not return JSON', 'parse');
    const isArray = cleaned[start] === '[';
    const end = isArray ? cleaned.lastIndexOf(']') : cleaned.lastIndexOf('}');
    if (end === -1 || end < start) throw new ProviderError('Model did not return JSON', 'parse');
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      throw new ProviderError('Model returned invalid JSON', 'parse');
    }
  }

  /* Accepts the documented {id, text} objects and, for tolerance, a plain
   * array of strings in segment order. Ids are matched, never guessed by
   * position, so a reordered answer cannot shift translations between blocks. */
  function parseTranslations(raw, expectedCount) {
    let data = parseModelJson(raw);
    if (!Array.isArray(data) && data && typeof data === 'object') {
      const arrayValue = Object.values(data).find(Array.isArray);
      if (arrayValue) data = arrayValue;
    }
    if (!Array.isArray(data)) throw new ProviderError('Model response is not an array', 'parse');

    if (data.every((item) => typeof item === 'string')) {
      if (data.length !== expectedCount) {
        throw new ProviderError(`Segment count mismatch: expected ${expectedCount}, got ${data.length}`, 'count');
      }
      return data.slice();
    }

    if (!data.every((item) => item && typeof item === 'object')) {
      throw new ProviderError('Model response mixes objects and strings', 'parse');
    }

    const out = new Array(expectedCount);
    const seen = new Set();
    for (const item of data) {
      const id = Number(item.id ?? item.index ?? NaN);
      if (!Number.isInteger(id) || id < 1 || id > expectedCount) {
        throw new ProviderError('Model returned an unknown segment id', 'parse');
      }
      if (seen.has(id)) throw new ProviderError(`Model returned segment ${id} twice`, 'parse');
      const text = typeof item.text === 'string' ? item.text
        : typeof item.translation === 'string' ? item.translation
        : null;
      if (text === null) throw new ProviderError('Model response has no text for a segment', 'parse');
      seen.add(id);
      out[id - 1] = text;
    }
    if (seen.size !== expectedCount) {
      throw new ProviderError(`Segment count mismatch: expected ${expectedCount}, got ${seen.size}`, 'count');
    }
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Target-language typography
   *
   * Models are consistently sloppy about Persian/Arabic orthography even when
   * the wording is good, and that sloppiness is a large part of why output
   * "looks foreign". These rules are deterministic and conservative: they only
   * touch characters that are unambiguously wrong next to Persian/Arabic text.
   * Digits and quotation marks are deliberately left alone (code, URLs and
   * measurements live in the same segments).
   * ------------------------------------------------------------------ */

  const PERSIAN_LETTER = '\u0600-\u06FF\u200c';
  const PERSIAN_LETTER_RE = new RegExp(`[${PERSIAN_LETTER}]`);
  const PERSIAN_END_RE = new RegExp(`[${PERSIAN_LETTER}]`);

  function normalizeTarget(text, langCode) {
    if (typeof text !== 'string') return text;
    const code = String(langCode || '').toLowerCase();
    let t = text.replace(/\r\n?/g, '\n');

    if (code === 'fa' || code === 'ur') {
      // Arabic presentation of the same letters, which Persian/Urdu never use.
      t = t.replace(/\u064A/g, '\u06CC').replace(/\u0649/g, '\u06CC').replace(/\u0643/g, '\u06A9');
    }
    if (code === 'fa') {
      t = t.replace(/\u0629/g, '\u0647');
    }

    if (code === 'fa' || code === 'ar' || code === 'ur') {
      // Latin punctuation that follows or precedes Persian/Arabic letters.
      t = t.replace(new RegExp(`([${PERSIAN_LETTER}])\\s*,\\s*`, 'g'), '$1، ');
      t = t.replace(new RegExp(`([${PERSIAN_LETTER}])\\s*;\\s*`, 'g'), '$1؛ ');
      t = t.replace(new RegExp(`([${PERSIAN_LETTER}])\\s*\\?`, 'g'), '$1؟');
      // A space before punctuation that belongs to the sentence.
      t = t.replace(/\s+([،؛؟])/g, '$1');
      t = t.replace(new RegExp(`([${PERSIAN_LETTER}])\\s+([.!:])`, 'g'), '$1$2');
    }

    if (code === 'fa') {
      // Common cases where the model writes a detached prefix/suffix.
      t = t.replace(/(^|[\s(«"“'\[>_\-])(می|نمی)[ \t]+(?=[\u0600-\u06FF])/g, '$1$2\u200c');
      t = t.replace(
        new RegExp(`([${PERSIAN_LETTER}])[ \\t]+(ها|های|هایی|هایم|هایت|هایش|هایمان|هایتان|هایشان)(?=$|[\\s،؛؟!.:»)\\]}"'])`, 'g'),
        '$1\u200c$2'
      );
      t = t.replace(
        new RegExp(`([${PERSIAN_LETTER}])[ \\t]+(تر|ترین)(?=$|[\\s،؛؟!.:»)\\]}"'])`, 'g'),
        '$1\u200c$2'
      );
    }

    t = t.replace(/[ \t]{2,}/g, ' ');
    t = t.replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n');
    return t.trim();
  }

  /* ------------------------------------------------------------------ *
   * Provider configuration and transport
   * ------------------------------------------------------------------ */

  function normalizeBaseUrl(s) {
    if (!s) return '';
    let u = String(s).trim();
    u = u.replace(/\/+$/, '');
    u = u.replace(/\/chat\/completions$/i, '');
    return u;
  }

  const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

  function validateConfig(cfg) {
    const provider = cfg?.provider;
    if (!provider || !['gemini', 'openai', 'ollama'].includes(provider)) {
      return 'Choose a provider in Options.';
    }
    const model = (cfg?.model || '').trim();
    if (!model) return 'Model name is required (Options).';
    const baseUrl = normalizeBaseUrl(cfg?.baseUrl);
    const apiKey = (cfg?.apiKey || '').trim();

    if (provider === 'gemini') {
      if (!apiKey) return 'Gemini API key is required (Options).';
    } else if (provider === 'openai') {
      if (!baseUrl) return 'Base URL is required, e.g. https://integrate.api.nvidia.com/v1 (Options).';
      let parsed;
      try { parsed = new URL(baseUrl); } catch { return 'Base URL must be a valid URL.'; }
      // Loopback endpoints (LM Studio, llama.cpp, vLLM) are plain http and never have a key,
      // so the host check has to be in scope for both branches below.
      const isLoopback = LOOPBACK_HOSTS.has(parsed.hostname);
      if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && isLoopback)) {
        return 'Base URL must start with https://';
      }
      if (!apiKey && !isLoopback) {
        return 'API key is required (Options).';
      }
    } else if (provider === 'ollama') {
      if (baseUrl) {
        let parsed;
        try { parsed = new URL(baseUrl); } catch { return 'Base URL must be a valid URL.'; }
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return 'Base URL must be http or https.';
        }
      }
    }
    return null;
  }

  function temperatureFor(ctx) {
    if (Number.isFinite(ctx.temperature)) return ctx.temperature;
    // Low temperature produces literal, word-for-word output — exactly what the
    // prompt is trying to avoid. Natural mode needs a little freedom; literal
    // mode is there for technical pages where terminology beats flow.
    if (ctx.pass === 'polish') return 0.15;
    return ctx.style === 'literal' ? 0.1 : 0.35;
  }

  /* Output budget derived from the input instead of a fixed 4096: Persian and
   * Arabic need roughly 0.9 tokens per source character, and a fixed ceiling
   * either truncated large chunks (bisect, lost context) or wasted nothing. */
  function outputTokenBudget(texts) {
    const chars = (texts || []).reduce((sum, t) => sum + (typeof t === 'string' ? t.length : 0), 0);
    return Math.min(8192, Math.max(768, Math.ceil(chars * 0.9) + 400));
  }

  const IN_CONTENT_SCRIPT = location.protocol !== 'chrome-extension:' && location.protocol !== 'moz-extension:';

  async function httpPost(url, headers, bodyObject, options = {}) {
    const { signal, timeoutMs = 120000 } = options;
    const body = JSON.stringify(bodyObject);

    if (IN_CONTENT_SCRIPT) {
      const requestId = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2);
      if (signal?.aborted) throw new ProviderError('Cancelled by user', 'abort');
      let abortHandler = null;
      if (signal) {
        abortHandler = () => {
          chrome.runtime.sendMessage({ type: 'AIPT_ABORT', requestId }).catch(() => {});
        };
        signal.addEventListener('abort', abortHandler, { once: true });
      }
      try {
        const res = await chrome.runtime.sendMessage({
          type: 'AIPT_FETCH',
          requestId,
          url,
          headers,
          body,
          timeoutMs
        });
        if (signal) signal.removeEventListener('abort', abortHandler);
        if (res.error) {
          const kind = res.error.kind;
          const msg = res.error.message;
          if (kind === 'timeout') throw new ProviderError(msg, 'timeout');
          if (kind === 'aborted') throw new ProviderError(msg, 'abort');
          if (kind === 'network') throw new ProviderError(msg, 'network');
          if (kind === 'blocked') throw new ProviderError(msg, 'badrequest');
          throw new ProviderError(msg, 'unknown');
        }
        return { status: res.status, text: res.text, retryAfterMs: res.retryAfterMs };
      } catch (e) {
        if (signal) signal.removeEventListener('abort', abortHandler);
        if (e instanceof ProviderError) throw e;
        const msg = String(e);
        if (/Extension context invalidated/i.test(msg)) {
          throw new ProviderError('The extension was reloaded or updated. Reload this page and try again.', 'config');
        }
        throw new ProviderError('Lost connection to the extension background worker.', 'network');
      }
    } else {
      const controller = new AbortController();
      const timeout = Math.min(Math.max(timeoutMs, 1000), 300000);
      const timeoutId = setTimeout(() => controller.abort('timeout'), timeout);
      let abortHandler = null;
      if (signal) {
        abortHandler = () => controller.abort('aborted');
        signal.addEventListener('abort', abortHandler, { once: true });
      }
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body,
          signal: controller.signal,
          credentials: 'omit',
          redirect: 'error'
        });
        clearTimeout(timeoutId);
        if (signal) signal.removeEventListener('abort', abortHandler);
        const text = await res.text();
        let retryAfterMs;
        const ra = res.headers.get('Retry-After');
        if (ra) {
          const secs = parseInt(ra, 10);
          if (!isNaN(secs)) retryAfterMs = secs * 1000;
          else {
            const date = new Date(ra);
            if (!isNaN(date.getTime())) retryAfterMs = date.getTime() - Date.now();
          }
        }
        return { status: res.status, text, retryAfterMs };
      } catch (e) {
        clearTimeout(timeoutId);
        if (signal) signal.removeEventListener('abort', abortHandler);
        if (e.name === 'AbortError') {
          if (e.reason === 'timeout') throw new ProviderError('Request timed out after ' + Math.round(timeout/1000) + 's', 'timeout');
          throw new ProviderError('Cancelled by user', 'abort');
        }
        if (e instanceof TypeError && e.message === 'Failed to fetch') {
          const host = new URL(url).host;
          throw new ProviderError(`Could not reach ${host}. Check your internet connection, the Base URL, and that the server is running.`, 'network');
        }
        throw new ProviderError('Network error: ' + (e.message || String(e)), 'network');
      }
    }
  }

  function interpretHttp(status, text, retryAfterMs, provider) {
    if (status === 401 || status === 403) {
      let msg = 'Invalid or missing API key';
      if (provider === 'ollama' && status === 403) {
        msg = 'Ollama refused the request (403). Start Ollama with the environment variable OLLAMA_ORIGINS=chrome-extension://* and restart it.';
      }
      throw new ProviderError(msg, 'auth');
    }
    if (status === 404) throw new ProviderError('Endpoint or model not found (404). Check Base URL and model name.', 'model');
    if (status === 408) throw new ProviderError('Request timed out', 'timeout');
    if (status === 429) {
      const err = new ProviderError('Rate limited by the provider. Wait a moment and try again.', 'ratelimit');
      err.retryAfterMs = retryAfterMs;
      throw err;
    }
    if (status >= 400 && status < 500) {
      throw new ProviderError(`Provider rejected the request (${status}): ${text.slice(0, 300)}`, 'badrequest');
    }
    if (status >= 500) throw new ProviderError(`Provider server error (${status}): ${text.slice(0, 300)}`, 'server');
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    return parsed;
  }

  // ---------- Google Gemini (user's own key, free tier) ----------

  /* Thinking settings are not portable across Gemini generations, and getting
   * them wrong is a hard 400:
   *   - 2.5 Flash / Flash-Lite accept thinkingBudget 0 (thinking off).
   *   - 2.5 Pro cannot disable thinking; its minimum is 128.
   *   - Gemini 3+ deprecates thinkingBudget (intermittent 400 INVALID_ARGUMENT)
   *     and uses thinkingLevel instead; 4.x rejects thinkingBudget outright.
   * So: only flash-class 2.5 gets "off", pro gets the minimum, 3+ gets "low",
   * and every other model gets no thinking config at all. */
  function geminiThinkingConfig(model) {
    if (/^gemini-2\.5-flash(-lite)?($|[-.])/i.test(model)) return { thinkingBudget: 0 };
    if (/^gemini-2\.5-pro/i.test(model)) return { thinkingBudget: 128 };
    if (/^gemini-[34]([.-]|$)/i.test(model)) return { thinkingLevel: 'low' };
    return null;
  }

  async function geminiGenerate(systemPrompt, userMessage, ctx) {
    const apiKey = (ctx.apiKey || '').trim();
    if (!apiKey) throw new ProviderError('Gemini API key is required (Options).', 'config');
    const model = (ctx.model || '').trim();
    if (!model) throw new ProviderError('Model name is required (Options).', 'config');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const generationConfig = {
      temperature: temperatureFor(ctx),
      maxOutputTokens: ctx.maxOutputTokens || 4096
    };
    const thinking = geminiThinkingConfig(model);
    if (thinking) generationConfig.thinkingConfig = thinking;
    const body = {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig
    };
    const headers = { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey };
    const options = { signal: ctx.signal, timeoutMs: ctx.timeoutMs };

    let data = await httpPost(url, headers, body, options);

    // Safety net for new or unusual model IDs: a 400 on a request that carried a
    // thinking setting is retried once without it, because that is the setting
    // most likely to be unsupported. Everything else about the request is kept.
    if (data.status === 400 && thinking) {
      const retryBody = {
        ...body,
        generationConfig: { temperature: generationConfig.temperature, maxOutputTokens: generationConfig.maxOutputTokens }
      };
      const retried = await httpPost(url, headers, retryBody, options);
      if (retried.status !== 400) data = retried;
    }

    let parsed;
    try {
      parsed = interpretHttp(data.status, data.text, data.retryAfterMs, 'gemini');
    } catch (e) {
      if (e.type === 'badrequest' && data.status === 400) {
        throw new ProviderError(
          `Gemini rejected the request (400 INVALID_ARGUMENT) for model "${model}". Check that the model ID is exactly as listed in Google's catalogue and that it is a text model. Provider said: ${String(data.text).slice(0, 240)}`,
          'badrequest'
        );
      }
      throw e;
    }
    if (parsed.promptFeedback?.blockReason) {
      throw new ProviderError('Blocked by the Gemini safety filter: ' + parsed.promptFeedback.blockReason, 'badrequest');
    }
    const candidates = parsed.candidates || [];
    const parts = candidates[0]?.content?.parts || [];
    const text = parts.map(p => p.text).join('');
    if (candidates[0]?.finishReason === 'MAX_TOKENS') throw new ProviderError('Model output was cut off.', 'truncated');
    return text;
  }

  // ---------- OpenAI-compatible endpoint (OpenRouter, Groq, NVIDIA, etc.) ----------
  async function openaiGenerate(systemPrompt, userMessage, ctx) {
    const baseUrl = normalizeBaseUrl(ctx.baseUrl);
    if (!baseUrl) throw new ProviderError('Base URL is required (Options).', 'config');
    const model = (ctx.model || '').trim();
    if (!model) throw new ProviderError('Model name is required (Options).', 'config');
    const apiKey = (ctx.apiKey || '').trim();
    const url = baseUrl + '/chat/completions';
    const headers = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: temperatureFor(ctx),
      max_tokens: ctx.maxOutputTokens || 4096
    };
    const data = await httpPost(url, headers, body, { signal: ctx.signal, timeoutMs: ctx.timeoutMs });
    const parsed = interpretHttp(data.status, data.text, data.retryAfterMs, 'openai');
    const choice = parsed.choices?.[0];
    if (!choice) throw new ProviderError('Empty response from model', 'parse');
    if (choice.finish_reason === 'length') throw new ProviderError('Model output was cut off.', 'truncated');
    const msg = choice.message;
    if (!msg) throw new ProviderError('Empty response from model', 'parse');
    if (msg.content === '' || msg.content === undefined) {
      if (msg.reasoning_content || msg.reasoning) {
        throw new ProviderError('The model returned only reasoning text and no answer. Use a non-reasoning model.', 'parse');
      }
      throw new ProviderError('Empty response from model', 'parse');
    }
    let content = msg.content;
    if (Array.isArray(content)) {
      content = content.filter(p => p.type === 'text').map(p => p.text).join('');
    }
    return content;
  }

  // ---------- Ollama (local, fully free and private) ----------
  async function ollamaGenerate(systemPrompt, userMessage, ctx) {
    const model = (ctx.model || '').trim();
    if (!model) throw new ProviderError('Model name is required (Options).', 'config');
    const base = normalizeBaseUrl(ctx.baseUrl) || 'http://localhost:11434';
    const url = base + '/api/chat';
    const body = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      stream: false,
      format: 'json',
      options: {
        temperature: temperatureFor(ctx),
        num_predict: ctx.maxOutputTokens || 4096,
        // Without this Ollama silently truncates the prompt at its small default
        // context, which drops segments and triggers bisect loops.
        num_ctx: 8192
      }
    };
    const data = await httpPost(url, { 'Content-Type': 'application/json' }, body, { signal: ctx.signal, timeoutMs: ctx.timeoutMs });
    const parsed = interpretHttp(data.status, data.text, data.retryAfterMs, 'ollama');
    const content = parsed.message?.content ?? '';
    if (!content) throw new ProviderError('Empty response from model', 'parse');
    return content;
  }

  async function generate(systemPrompt, userMessage, ctx) {
    const generators = { gemini: geminiGenerate, openai: openaiGenerate, ollama: ollamaGenerate };
    const fn = generators[ctx.provider];
    if (!fn) throw new ProviderError(`Unknown provider: ${ctx.provider}`, 'config');
    return fn(systemPrompt, userMessage, ctx);
  }

  function pagePayload(ctx) {
    return {
      domain: ctx.context?.domain || '',
      title: ctx.context?.pageTitle || '',
      headings: ctx.context?.headings || []
    };
  }

  function buildTranslatePayload(texts, ctx) {
    const payload = {
      segments: texts.map((text, index) => ({ id: index + 1, text })),
      page: pagePayload(ctx),
      glossary: ctx.context?.glossary || {}
    };
    if (ctx.contextText) payload.context_text = ctx.contextText;
    if (ctx.kind === 'label') payload.kind = 'ui-label';
    return JSON.stringify(payload);
  }

  async function translateRaw(texts, ctx) {
    const sys = fillTemplate(SYSTEM_PROMPT_TEMPLATE, ctx);
    const user = buildTranslatePayload(texts, ctx);
    const raw = await generate(sys, user, {
      ...ctx,
      pass: 'translate',
      maxOutputTokens: ctx.maxOutputTokens || outputTokenBudget(texts)
    });
    const parsed = parseTranslations(raw, texts.length);
    return parsed.map((t) => normalizeTarget(t, ctx.targetLanguage));
  }

  async function polishRaw(pairs, ctx) {
    const sys = fillTemplate(POLISH_PROMPT_TEMPLATE, ctx);
    const user = JSON.stringify({
      segments: pairs.map((pair, index) => ({
        id: index + 1,
        source: pair.source,
        translation: pair.translation
      })),
      page: pagePayload(ctx),
      glossary: ctx.context?.glossary || {}
    });
    const sources = pairs.map((p) => p.source);
    const raw = await generate(sys, user, {
      ...ctx,
      pass: 'polish',
      maxOutputTokens: ctx.maxOutputTokens || outputTokenBudget(sources)
    });
    const parsed = parseTranslations(raw, pairs.length);
    return parsed.map((t) => normalizeTarget(t, ctx.targetLanguage));
  }

  function createProvider(type, config) {
    const translate = (texts, ctx) => translateRaw(texts, { ...config, ...ctx, provider: type });
    const polish = (pairs, ctx) => polishRaw(pairs, { ...config, ...ctx, provider: type });
    return { translate, polish, type };
  }

  /* One cheap call per page replaces the literal "auto-detect" string. The
   * result is cached per model + sample so re-translating a page costs nothing. */
  const detectCache = new Map();

  async function detectLanguage(sample, ctx) {
    const text = String(sample || '').replace(/\s+/g, ' ').slice(0, 600).trim();
    if (text.length < 20) return null;
    const key = `${ctx.provider}|${ctx.model}|${text.slice(0, 160)}`;
    if (detectCache.has(key)) return detectCache.get(key);
    const system = 'You identify the language of a web page. Answer with one JSON object and nothing else: {"code":"<BCP-47 code such as en, fa, de>","name":"<English language name>"}.';
    try {
      const raw = await generate(system, JSON.stringify({ text }), {
        ...ctx,
        pass: 'detect',
        temperature: 0,
        // Enough room for the tiny JSON answer plus any thinking tokens the
        // model spends, without asking for a real generation.
        maxOutputTokens: 512,
        // Detection is optional; never let it hold up the page for two minutes.
        timeoutMs: 8000
      });
      const parsed = parseModelJson(raw);
      const code = typeof parsed?.code === 'string' ? parsed.code.trim() : '';
      const name = typeof parsed?.name === 'string' ? parsed.name.trim() : '';
      if (!/^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$/.test(code)) return null;
      const result = { code, name: name || code };
      detectCache.set(key, result);
      if (detectCache.size > 50) detectCache.delete(detectCache.keys().next().value);
      return result;
    } catch {
      return null;
    }
  }

  async function testConnection(cfg) {
    const err = validateConfig(cfg);
    if (err) return { ok: false, error: err, type: 'config' };
    const started = Date.now();
    try {
      const p = createProvider(cfg.provider, cfg);
      const result = await p.translate(['Click <t1>here</t1> to continue.'], {
        targetLanguage: cfg.targetLanguage,
        targetLanguageName: AIPT.languageName(cfg.targetLanguage),
        sourceLanguage: 'en',
        sourceLanguageName: 'English',
        qualityMode: false,
        style: cfg.style || 'natural',
        context: { domain: 'test', pageTitle: 'test', glossary: {} }
      });
      return { ok: true, sample: result[0], ms: Date.now() - started };
    } catch (e) {
      return { ok: false, error: e.message, type: e.type || 'unknown' };
    }
  }

  return {
    ProviderError,
    PROMPT_VERSION,
    SYSTEM_PROMPT_TEMPLATE,
    POLISH_PROMPT_TEMPLATE,
    STYLE_GUIDES,
    createProvider,
    testConnection,
    translateRaw,
    polishRaw,
    validateConfig,
    normalizeBaseUrl,
    normalizeTarget,
    parseTranslations,
    outputTokenBudget,
    detectLanguage,
    styleGuideFor,
    geminiThinkingConfig
  };
})();
