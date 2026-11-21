# Changelog

## 1.3.1

### Fixed

- **Gemini `400 INVALID_ARGUMENT: Request contains an invalid argument.`** — 1.3.0 sent
  `thinkingConfig: { thinkingBudget: 0 }` to every model whose id started with `gemini-2.5` or
  `gemini-3`. That is only valid for 2.5 Flash and Flash-Lite. Gemini 2.5 Pro cannot disable
  thinking (minimum 128), Gemini 3 deprecates `thinkingBudget` (intermittent 400) and Gemini 4
  rejects it outright. The setting is now chosen per generation: `thinkingBudget: 0` for 2.5
  Flash/Flash-Lite, `thinkingBudget: 128` for 2.5 Pro, `thinkingLevel: "low"` for 3.x/4.x, and no
  thinking config for anything else.
- A Gemini 400 on a request that carried a thinking setting is now retried **once without that
  setting** (everything else identical), so a new or unusual model ID cannot break translation.
- A persistent Gemini 400 now names the model and quotes the provider message instead of showing
  a bare JSON blob.
- Source-language detection asks for 512 output tokens rather than 60, which was too small once a
  model spends part of the budget on thinking. Detection failures were already silent.

## 1.3.0

Translation-quality release. The extension still has no build step and no new permissions; the
shipped files are the same set plus the new benchmark and docs (dev only).

### Fixed

- **Q1 — sentences were cut into fragments.** Every text node with a letter was its own segment,
  so `The <a>new policy</a> takes effect <strong>immediately</strong>.` reached the model as four
  unrelated strings and could not be put back in Persian word order. Translation now happens on
  the highest **block** with no block-level descendant (paragraph, heading, list item, table cell,
  button, link group), and inline elements become `<tN>...</tN>` / `<vN/>` tokens the model may
  reorder. Benchmark: 108 legacy fragments → 63 units on four sample pages. (`content/dom-processor.js`)
- **Q2 — inline markup could not survive a translation.** Tokens are validated for balance,
  uniqueness and completeness before the DOM is touched; the original element node is reused, so
  `href`, listeners and nested markup survive. A dropped token is rejected, retried once with a
  stricter instruction, then counted as skipped instead of silently deleting a link.
  (`content/dom-processor.js`, `content/content-script.js`)
- **Q3 — the “quality” pass could not see the source.** `polishRaw` sent only first-pass
  translations, so it could restyle but never correct a mistranslation. It now receives
  `{source, translation}` pairs, is allowed to fix meaning, and runs at temperature 0.15.
  (`content/providers.js`, `content/translation-engine.js`)
- **Q4 — the prompt had no language-specific guidance.** Added per-language style guides
  (`STYLE_GUIDES`) and few-shot examples. The Persian guide targets translationese: English word
  order, `می‌باشد`/`بایستی`/`گردید`, `انجام دهید` calques, gratuitous English terms, Arabic
  `ي`/`ك`, missing ZWNJ, Latin punctuation.
- **Q5 — Persian orthography was never normalised.** `normalizeTarget()` now fixes `ي→ی`, `ك→ک`,
  `ة→ه`, Latin `, ; ?` next to Persian letters, spaces before punctuation, and ZWNJ in `می`,
  `ها`, `تر`. Digits, quotes, URLs and code are deliberately untouched.
- **Q6 — fixed output budget truncated large chunks.** `max_tokens: 4096` was applied to every
  chunk; the ceiling is now derived from the input size (`outputTokenBudget`), capped per provider.
  Gemini 2.5/3 requests disable hidden thinking tokens, which used to consume the JSON budget.
- **Q7 — Ollama silently truncated long prompts.** Requests now set `num_ctx: 8192` and
  `num_predict`, so a chunk is not cut in the middle of the segment array.
- **Q8 — visible-first sorting scrambled reading order.** Document order is preserved; the
  prompt's “segments appear in reading order” promise is now true.
- **Q9 — the literal `auto-detect` was sent as a language name.** One small, cached detection
  request per page resolves it; on failure the prompt asks the model to infer the language.
- **Q10 — UI labels were mixed into prose arrays.** `alt`/`title`/`placeholder`/`aria-label` now
  travel on a separate `label` channel with its own cache identity and prompt marker.
- **Q11 — RTL flipped the whole page.** `dir` and `text-align: right !important` were applied to
  `<html>`, breaking centred layouts, code blocks and numbers. Direction is now per translated
  block with bidi isolation; `lang` is set on `<html>` and everything is restored.
- **Q12 — `<title>` was translated.** Collection starts at `<body>`.
- **Q13 — a glossary value containing `$1`/`$&` was mangled by `String.replace`.** Templates now
  use function replacements; the glossary block had also been dropped from the prompt during the
  rewrite and is restored (covered by a test).
- **Q14 — attribute collection skipped form controls.** Making `input`/`textarea` opaque tokens had
  excluded their own `placeholder`/`aria-label`; the exclusion now applies to ancestors, not to
  the control itself (regression found by the existing B3 test).
- **Q15 — restore left `class=""` behind.** `classList.remove()` does not remove the attribute, so
  an element that had no class did not come back byte-identical. The original class attribute is
  now remembered and restored (found by a whole-container restore check).
- **Q16 — the observer re-translated the extension's own writes.** Rebuilding a block is a DOM
  mutation; the observer queued the new text nodes and translated them a second time (doubled
  prefix, twice-translated link text). Records produced by our own rebuild are discarded with
  `takeRecords()` after each channel. Dynamic paragraphs are also collected as whole units now
  (`collect(element)` used to skip the element itself).

### Added

- `style` setting (`natural` / `literal`) in Options; it changes temperature and prompt emphasis
  and is part of the cache identity.
- `scripts/bench-segmentation.mjs` (`npm run bench`) with four sample pages; prints legacy vs
  block segmentation, fragment counts and inline-token density. No API key required.
- `docs/translation-quality-design.md` — design record (goals, approaches, decisions).
- New tests: block units, token reorder/restore, dropped-token rejection, code preservation,
  per-unit direction, id-based parsing, Persian normalisation, strict retry, label channel,
  Ollama/Gemini request shape, adaptive output budget.
- `tests` count: 68 → 93.

### Changed

- Chunk limits: 24 units / 2400 characters (was 40 / 3000) — smaller arrays fail less often and
  leave more output budget per segment.
- `PROMPT_VERSION` 3; cache schema 2 (old in-memory entries are never reused).
- Translation request/response is `[{id, text}]` with ids matched rather than assumed positional
  (plain string arrays are still accepted).
- Selection translation sends the surrounding paragraph as context and never changes page
  direction.

## 1.2.0

Correctness and testability release. The extension is still a no-build, vanilla Manifest V3
extension: copy the folder and load it unpacked. `tests/`, `scripts/`, `package.json` and this file
are never referenced by extension code.

### Fixed

- **B1 — `validateConfig` crashed for an OpenAI-compatible provider with no API key.**
  The base-URL host was read outside the block that declared it, so validating a first-run setup or
  a local endpoint such as LM Studio (`http://localhost:1234/v1`) threw
  `ReferenceError: host is not defined` instead of returning a message. The popup showed
  "Content script not ready" and Options → Save threw. The host is now resolved once and used by
  both the protocol check and the API-key check. (`content/providers.js`)
- **B2 — every failed provider fetch turned into a `ReferenceError` in the service worker.**
  The timeout handle was block-scoped to `try` and cleared in `catch`; offline, abort and timeout all
  threw, `sendResponse` was never called, and the content script reported "Lost connection to the
  extension background worker", which the engine retried three times per chunk. The transport now
  lives in `background/fetch-utils.js` and always resolves with a typed response
  (`network` / `timeout` / `aborted` / `blocked`). (`background/service-worker.js`,
  `background/fetch-utils.js`)
- **B3 — `placeholder` and `aria-label` on form controls were never translated.**
  Form tags were excluded wholesale, so the attribute pass skipped them and search boxes and email
  inputs kept their English UI text. Text inside form controls is still never translated (it is user
  input); the element's own attributes now are. (`content/dom-processor.js`)
- **B4 — selection translation destroyed inline markup and could not be undone.**
  The range was deleted and only the plain text was remembered, the page never entered the
  translated state (so "Show original" was never offered), and the inserted span was collected again
  and translated twice. The original nodes are now kept in a fragment and restored, the page state
  offers "Show original", and the inserted span is skipped by collection.
  (`content/dom-processor.js`, `content/content-script.js`)
- **B5 — the translation cache could return another chunk's translation.**
  The cache key was a 32-bit string hash, so colliding chunk keys overwrote each other. It also
  ignored whether a call was the first pass or a polish pass and ignored the prompt text, so editing
  the prompt served stale results for the rest of the session. The key is now the full JSON-encoded
  request identity plus the pass and `PROMPT_VERSION`. (`content/translation-engine.js`,
  `content/providers.js`)
- **B6 — per-site preferences could be lost, and "Show original" deleted them.**
  `sitePrefs` was written with an unlocked read-modify-write, so two tabs or two frames could
  overwrite each other's entries; and pressing "Show original" removed the preference, which broke
  auto-translate for the domain. All writes now go through the service worker, which serializes them
  (`background/site-prefs.js`), and restoring the original page keeps the preference.
  (`content/content-script.js`, `options/options.js`)
- **B7 — nested shadow roots were collected 2^(depth-1) times.**
  The collection loop appended discovered shadow roots to the array it was iterating. Collection now
  uses a visited work queue, so every root is walked exactly once.
  (`content/dom-processor.js`)
- **B8 — restore left state behind.**
  Node, attribute and selection lists kept strong references to detached nodes after SPA navigation,
  and queued dynamic entries kept their `__aipt_done` markers, so a later run skipped them. Restore
  now clears all bookkeeping (including the dynamic queue) and `pruneDetached()` drops references to
  removed nodes before a new run. (`content/dom-processor.js`, `content/content-script.js`)
- **B9 — dead code and documentation that did not match the code.**
  Removed the unused `MAX_RETRIES_PARSE` constant and the comment claiming parse failures are
  retried (they bisect instead); the options page no longer builds site-preference rows with
  `innerHTML`; the README no longer claims a local script heuristic for source-language detection
  (the literal `auto-detect` is sent to the model), and no longer recommends the retired
  `gemini-1.5-flash` model.

### Added

- `tests/` — Node's test runner plus jsdom, loading `content/*.js` as classic scripts in manifest
  order with a stubbed `chrome.*`. Covers validation, parsing, cache identity, chunking, retry and
  bisect, DOM extraction/apply/restore, selection restore, shadow-root walking, per-site preference
  serialization, the options page, and the service-worker transport.
- `scripts/verify.mjs` (`npm run verify`) — syntax check on every JS file, the full test suite,
  static policy checks (no `innerHTML`/`eval`, no dev dependencies in extension code, no API key in
  any message payload or prompt body, unchanged manifest permissions), a packaging allowlist check
  and manifest/package version parity.
- `scripts/package.mjs` (`npm run package`) — copies only the shippable entries into
  `dist/page-translator-ai-1.2.0/`.
- `background/fetch-utils.js` and `background/site-prefs.js` — the transport and the site-preference
  store, both dependency-injected so they can be tested outside a browser.

## 1.1.0

- Provider layer (Gemini, OpenAI-compatible, Ollama), service-worker fetch proxy, chunked
  translation with retry and bisect, quality (polish) pass, glossary, RTL handling, hover tooltip,
  per-site preferences, popup and options pages.
