<img src="icons/icon-128.png" width="88" align="right" alt="AI Page Translator icon">

# AI Page Translator

**Translate any web page into your own language with your own AI provider — no backend, no account, no tracking, no per-word bill.**

`Manifest V3` · `No build step` · `Vanilla JavaScript` · `v1.3.1` · `22 languages`

[![CI](https://github.com/pooyanfi/page-translator-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/pooyanfi/page-translator-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/manifest-v3-1f6feb.svg)](manifest.json)

<!-- lang-nav:start -->
**English** · [فارسی](docs/i18n/README.fa.md) · [العربية](docs/i18n/README.ar.md) · [עברית](docs/i18n/README.he.md) · [اردو](docs/i18n/README.ur.md) · [Español](docs/i18n/README.es.md) · [Français](docs/i18n/README.fr.md) · [Deutsch](docs/i18n/README.de.md) · [Italiano](docs/i18n/README.it.md) · [Português](docs/i18n/README.pt.md) · [Nederlands](docs/i18n/README.nl.md) · [Polski](docs/i18n/README.pl.md) · [Русский](docs/i18n/README.ru.md) · [Türkçe](docs/i18n/README.tr.md) · [中文简体](docs/i18n/README.zh-CN.md) · [中文繁體](docs/i18n/README.zh-TW.md) · [日本語](docs/i18n/README.ja.md) · [한국어](docs/i18n/README.ko.md) · [Tiếng Việt](docs/i18n/README.vi.md) · [ไทย](docs/i18n/README.th.md) · [हिन्दी](docs/i18n/README.hi.md) · [Bahasa Indonesia](docs/i18n/README.id.md)
<!-- lang-nav:end -->

AI Page Translator is a browser extension for **Brave** and other Chromium browsers. You bring a
provider — a free Google Gemini key, any OpenAI-compatible endpoint (OpenRouter, Groq, NVIDIA,
OpenAI…), or a fully local model through **Ollama** — and the extension translates the page you are
reading in place, keeping its layout, links and formatting.

Nothing is routed through a translation service. Your API key never leaves your browser, there is no
analytics, and with Ollama the text never leaves your machine at all.

> **Status:** 1.3.1 · 95 automated tests · a 12-point verification pass · no telemetry, no remote code.

## Contents

- [Why another translator?](#why-another-translator)
- [Features](#features)
- [Supported languages](#supported-languages)
- [Install](#install)
- [Sharing it with other people](#sharing-it-with-other-people)
- [Configure a provider](#configure-a-provider)
- [Use it](#use-it)
- [How it works](#how-it-works)
- [Privacy and permissions](#privacy-and-permissions)
- [Known limitations](#known-limitations)
- [Project status and testing](#project-status-and-testing)
- [Project structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Why another translator?

Most page translators send one sentence at a time. That is why the result reads like a stack of
sentences rather than a page: context is lost, terminology drifts, links split sentences in half, and
the target language inherits the source language's word order.

This extension translates **blocks** instead of text nodes:

```
The <a>new privacy policy</a> takes effect <strong>immediately</strong>.
```

is sent as a single unit, with the inline markup replaced by numbered tokens:

```
The <t1>new privacy policy</t1> takes effect <t2>immediately</t2>.
```

`<tN>…</tN>` marks inline content that belongs to the sentence (a link, emphasis, a span); `<vN/>`
marks inline content that must never be translated (code, images, form controls, widgets). The model
may move tokens, so it can build a natural target-language sentence *around* the link instead of
being forced into the English order.

On the way back, the answer is validated before the page is touched. Every token must be present,
balanced and unique; a translation that drops a link is rejected, retried once with a stricter
instruction, and otherwise left untouched. The original element nodes are reused, so `href`, event
listeners and nested markup survive. "Show original" restores the exact original nodes.

## Features

- **Whole-page translation in place** — headings, paragraphs, lists, tables, captions, buttons.
- **Links and inline formatting preserved** — token-validated; a dropped link can never be applied
  silently.
- **Natural or literal style** — *Natural* (default) rewrites as a native writer would; *Literal*
  stays close to the source wording for technical pages.
- **Per-language style guides** — dedicated guidance for Persian, Arabic, Urdu and Hebrew, plus a
  general guide for the other 18 languages.
- **Deterministic typography clean-up** — Persian `ی`/`ک`, ZWNJ in `می‌`/`‌ها`/`‌تر`, and `، ؛ ؟` are
  fixed even when the model slips.
- **Optional quality pass** — reviews every segment as a `{source, translation}` pair, so it can
  correct meaning, not just wording.
- **Glossary** — fixed term → translation pairs the model must obey.
- **Protected content** — `<pre>`, `<code>`, URLs, emails, `translate="no"`, `contenteditable`, SVG,
  form controls and the extension's own UI are never sent.
- **Attribute labels** — `alt`, `title`, `placeholder` and `aria-label` are translated on a separate
  label channel, so they read like labels, not paragraphs.
- **Dynamic pages** — new content from infinite scroll or an SPA is translated as it appears, without
  observer loops.
- **Right-to-left done properly** — `dir` on each translated block, `lang` on `<html>`, no page-wide
  flip; everything is restored.
- **Per-site memory** — remembers the target language per domain and can auto-translate on load.
- **Anything with an API** — Gemini, Ollama and any OpenAI-compatible endpoint, called from the
  service worker so there are no CORS problems.
- **In-memory cache, retry and bisect** — identical text is sent once; a failing chunk is split
  instead of failing the page; 429/5xx are retried with backoff.
- **Zero build step** — plain classic scripts, loaded as-is.

## Supported languages

Twenty-two target languages, each with a native name used in the prompt so the model cannot confuse
`zh-TW` with `zh-CN` or Persian with Arabic:

| Language | Native | Direction | | Language | Native | Direction |
|---|---|---|---|---|---|---|
| English | English | LTR | | Turkish | Türkçe | LTR |
| Persian | فارسی | RTL | | Italian | Italiano | LTR |
| Arabic | العربية | RTL | | Portuguese | Português | LTR |
| Hebrew | עברית | RTL | | Dutch | Nederlands | LTR |
| Urdu | اردو | RTL | | Polish | Polski | LTR |
| Spanish | Español | LTR | | Vietnamese | Tiếng Việt | LTR |
| French | Français | LTR | | Thai | ไทย | LTR |
| German | Deutsch | LTR | | Hindi | हिन्दी | LTR |
| Chinese (Simplified) | 中文简体 | LTR | | Indonesian | Bahasa Indonesia | LTR |
| Chinese (Traditional) | 中文繁體 | LTR | | Japanese | 日本語 | LTR |
| Russian | Русский | LTR | | Korean | 한국어 | LTR |

RTL languages (Persian, Arabic, Hebrew, Urdu) get direction handling per block; the rest of the page
keeps its geometry.

## Install

1. Download this repository (**Code → Download ZIP** or `git clone`) and keep the folder.
2. Open `brave://extensions` (or `chrome://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select this folder (the one containing `manifest.json`).
5. Pin the extension if you want the popup one click away.

There is no build, install or bundling step. The extension reads only the files listed in
`manifest.json`; `tests/`, `scripts/`, `bench/`, `docs/` and `.github/` are development-only and are
never loaded.

Requires a current Chromium-based browser. Closed shadow roots are translated where the browser
exposes them (Chromium 119+); everything else works on older versions.

## Sharing it with other people

`npm run release` builds the package and produces the artifacts in `release/` (ignored by git):

| Artifact | What it is | How someone installs it |
|---|---|---|
| `page-translator-ai-<version>.zip` | the complete extension, ~95 KB, with `INSTALL.txt` inside | unzip → *Load unpacked*; the same file a store accepts |
| `page-translator-ai-<version>.crx` | signed package | drag onto `brave://extensions`, where off-store installs are allowed |
| `page-translator-ai-signing-key.pem` | signing key | never share it; `npm run release` reuses it, so the extension keeps the same ID across updates |

So the thing you hand to someone is a single file, and it contains the installation steps.

**Honest limitation:** a browser extension is client-side code. Anyone who installs it can read those
files — a `.crx` is a signed zip and an unpacked extension is a plain folder. No packaging or
obfuscation changes that; minifying only slows a reader down, and store policy forbids obfuscation. If
the source itself must stay secret, the only real option is moving prompts and provider calls to a
server you control, which gives up the bring-your-own-key, no-backend design.

For distribution without giving anyone the repository, publish the zip as a **private or unlisted**
Chrome Web Store item; that is the only one-click install path for non-technical users.

## Configure a provider

Open the extension popup → **Options & settings**, or `brave://extensions` → Details → Extension
options.

| Provider | Endpoint | Key | Notes |
|---|---|---|---|
| **Ollama** (local) | `http://localhost:11434` | none | Free and fully private. Install from [ollama.com](https://ollama.com), then `ollama run llama3`. If Ollama returns 403, restart it with `OLLAMA_ORIGINS=chrome-extension://*`. |
| **Google Gemini** | `generativelanguage.googleapis.com` | free key from [AI Studio](https://aistudio.google.com/app/apikey) | Use a current model ID such as `gemini-2.5-flash`. Free-tier limits change; check Google's model list. |
| **OpenAI-compatible** | your endpoint, e.g. `https://openrouter.ai/api/v1`, `https://api.groq.com/openai/v1`, `https://integrate.api.nvidia.com/v1` | provider key | Any endpoint that speaks `/chat/completions`. Model suggestions in the UI are examples — use the exact ID from the provider's catalogue. |

Then:

1. Pick the **default target language**.
2. Pick a **translation style**: *Natural* (recommended) or *Literal*.
3. Optionally enable **Quality mode** and add **glossary** entries, one per line (`term → translation`;
   `->`, `=>`, `=` and TAB also work).
4. Set **Source language** to *Auto-detect* or pick it explicitly.
5. Click **Test connection**, then **Save settings**.

Provider notes:

- **Gemini thinking settings are chosen per model generation.** 2.5 Flash/Flash-Lite run with thinking
  off, 2.5 Pro uses its minimum budget (128), and 3.x/4.x use a low thinking level. If a model rejects
  the setting, the request is retried once without it.
- **Ollama** runs with an 8192-token context window request; a model trained on less will still
  truncate long pages — the page is chunked to keep units small.
- **Free tiers** rate-limit. The extension backs off and retries; it does not silently drop text.

## Use it

- Click the icon → choose a language → **Translate this page**.
- **Show original / Show translation** toggles any time; restoration is lossless.
- Hover a translated paragraph to peek at the original text.
- Right-click → **Translate this page** or **Translate selection**.
- Keyboard: `Ctrl+Shift+Y` (`Cmd+Shift+Y` on macOS) toggles translation; rebind it on the browser's
  extension-shortcuts page.
- With **Auto-translate** on and a saved site preference, matching pages translate on load.
- Options apply to already-open tabs on the next translation; no reload needed.

## How it works

```
page DOM
  └─ content script: collect block units, serialise inline markup as <tN>/<vN/> tokens
       └─ chunker: 24 units / 2400 characters per request
            └─ service worker: fetch to your provider (extension origin, no CORS)
                 └─ provider: JSON in, JSON out, ids preserved
                      └─ validation: tokens complete/balanced/unique, ids match
                           └─ DOM: reuse original element nodes, set text only
                                └─ MutationObserver: translate newly added content
```

Design choices that matter:

- **Provider traffic never leaves from the page context.** The content script sends an `AIPT_FETCH`
  message; the service worker performs the request, so strict CORS endpoints work unchanged. The
  service worker also checks `sender.id`, so only this extension can use it as a proxy.
- **The prompt is a contract, not a wish.** Ids in, ids out; one entry per segment; tags untouchable;
  numbers, URLs, code and placeholders verbatim; no added explanations. Responses are parsed by id, so
  a reordered or partially malformed array fails safely instead of misaligning translations.
- **Each language gets its own style guide.** The Persian guide, for example, asks for Persian word
  order and verbs (`بررسی کنید`, not `بررسی را انجام دهید`), bans `می‌باشد`/`بایستی`/`گردید` where a
  normal sentence works, keeps only genuine loanwords in Latin script, and fixes punctuation and ZWNJ.
  Few-shot examples show the model the target, not just describe it.
- **Direction is local.** Persian, Arabic, Hebrew and Urdu blocks get `dir="rtl"`, `<html>` gets the
  target `lang`, and the rest of the page keeps its geometry — a global flip used to break centred
  layouts and code blocks. Both are restored with the original text.
- **Failures are visible and contained.** A chunk that cannot be parsed is bisected; a single unit
  that still fails stays in the original language and is reported in the banner. Cancelling during
  translation aborts cleanly and leaves no half-written DOM.

More detail: [`docs/translation-quality-design.md`](docs/translation-quality-design.md).

## Privacy and permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Save settings, API key, glossary and per-site preferences in `chrome.storage.local`. |
| `contextMenus` | Right-click "Translate this page / selection". |
| `tabs` | Send messages to the active tab and open Options. |
| `activeTab` | Act on the page you explicitly translate. |
| `<all_urls>` | Inject the content script into pages you visit, and let the service worker call the provider endpoint you configured. |

- The API key is stored only in this browser's local storage and sent only to the provider you chose.
- No analytics, no telemetry, no remote code, no phone-home, no account.
- All text is written with `textContent` / `createTextNode`; there is no `innerHTML`, `eval` or
  `new Function` anywhere in the extension. Model output can only reach the page as text, and
  attributes are limited to a fixed allow-list — `href`, `src` and event handlers are never written
  from model output.
- Per-site preferences are written by a single serialized writer in the service worker, so two tabs
  cannot clobber each other.
- Language auto-detection sends at most a 600-character sample to the same provider; set the source
  language manually to avoid that request entirely.

Security policy and how to report a vulnerability: [`SECURITY.md`](SECURITY.md).

## Known limitations

- **Token validation is strict by design.** A model that consistently mangles `<tN>` tags will leave
  those paragraphs in the original language (and say so) rather than drop a link. Use a model that
  follows structured output; *Test connection* exercises a tagged sentence.
- **Quality depends on the model.** Small local models are usable but less fluent than Gemini or
  GPT-class models; the style layer helps, it cannot add knowledge.
- **Closed shadow roots and cross-origin iframes** are outside the extension's reach (browser
  security). Open shadow roots and same-origin frames are handled.
- **Mixed containers with loose text** (`<div>text<p>…</p></div>`) fall back to per-text-node
  translation for that loose text; well-formed pages never hit this.
- **The cache is in memory** (per tab session). Reloading a page re-requests its text.
- **PDFs are not translated**; the built-in PDF viewer is not scriptable by extensions.
- **Free tiers change.** Rate limits and model names are controlled by the provider, not by this
  extension.

## Project status and testing

Version 1.3.1. The automated suite covers the DOM layer, prompt/parsing, provider request shapes,
engine behaviour and the options UI — **95 tests** — and `npm run verify` adds a 12-point pass:
syntax checks, the test suite, the HTML-sink ban, key-leak checks, classic content scripts,
version parity, CHANGELOG coverage and packaging.

```bash
npm install       # dev only: jsdom for the DOM tests
npm test          # 95 tests
npm run bench     # segmentation benchmark, no API key needed
npm run verify    # syntax + tests + policy checks + packaging check
npm run package   # copies only shippable files into dist/
npm run release   # dist + release/*.zip, *.crx, *.pem for distribution
```

The benchmark measures segmentation, not translation quality: on the four sample pages, an
independent text-node collector produces **108 fragments** where the block collector produces **63
units** (1.7× fewer overall, **2.5×** on the news article), and fragments under 25 characters drop from
**81 to 34**. Translation quality itself still depends on the model you connect — the manual checklist
in [`TEST_CHECKLIST.md`](TEST_CHECKLIST.md) covers the browser-level behaviour that automated tests
cannot reach (RTL rendering, tooltips, real SPA traffic, provider errors).

CI runs `npm run verify` and `npm run bench` on Node 20 and 22 for every push and pull request
([`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Project structure

```
manifest.json                 Manifest V3: permissions, content scripts, shortcut
background/
  service-worker.js           menus, shortcut, message router, keep-alive
  fetch-utils.js              provider fetch proxy: URL/header checks, timeout, error kinds
  site-prefs.js               serialized read-modify-write for per-site preferences
content/
  languages.js                22 languages, defaults, display names
  providers.js                prompts, style guides, JSON parsing, normalisation, Gemini/OpenAI/Ollama
  translation-engine.js       cache, chunking, concurrency, retry, bisect, quality pass
  dom-processor.js            block units, tokens, validated apply, exact restore, direction
  content-script.js           orchestration, state, messaging, auto-translate
  styles.css                  the two rules RTL actually needs
popup/                        language picker, translate/toggle, progress, errors
options/                      provider, key, model, style, quality, glossary, site preferences
icons/                        16/48/128 px
docs/i18n/                    translations of this README, one file per language
tests/  scripts/  bench/      development only — never loaded by the extension
```

## Contributing

Issues and pull requests are welcome. Before sending a change, run `npm run verify`; keep the
extension build-free, keep provider traffic in the service worker, and never introduce `innerHTML`.
If you change the prompt, add or update a test — prompt, parser and normaliser are tested together
because they only work as a set.

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full ground rules, the translation policy for
`docs/i18n/`, and the commit conventions.

## License

MIT — see [`LICENSE`](LICENSE). Third-party services you connect to (Gemini, OpenRouter, Ollama…) have
their own terms and pricing.
