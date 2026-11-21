# Contributing

Thanks for taking the time to improve AI Page Translator. This project is intentionally small and
dependency-free, so the rules below are short but strict.

## Ground rules

1. **No build step.** The extension is loaded straight from the repository. If a change needs a
   bundler to work, it does not belong here.
2. **No new permissions without a written reason.** Permissions are reviewed in `scripts/packaging.mjs`
   and the check fails if they change unexpectedly.
3. **No HTML sinks.** `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval` and `new Function` are
   rejected by `npm run verify`. Write text with `textContent` / `createTextNode`.
4. **Provider traffic stays in the service worker.** Page context must not talk to provider endpoints
   directly; use the `AIPT_FETCH` channel so CORS and `sender.id` checks keep working.
5. **The API key never leaves the browser** and never appears in a message payload or prompt body.

## Before you open a pull request

```bash
npm install     # jsdom, dev only
npm run verify  # syntax + 95 tests + policy checks + packaging check
```

`npm run verify` must pass with no skipped checks. If you touched the prompt, the parser or the
normaliser, add or update a test: those three are tested together because they only work as a set.
If you touched the DOM layer, `npm test` is not enough — run through the relevant items in
[`TEST_CHECKLIST.md`](TEST_CHECKLIST.md) in a real browser and say which ones you ran.

## Commit messages

Conventional Commits, scoped when it helps:

```
feat(providers): retry Gemini requests without a thinking setting
fix(dom): keep <vN/> tokens out of attribute text
docs(i18n): rewrite the Persian README in native register
```

Keep the subject under ~72 characters, use the imperative mood, and explain *why* in the body when the
reason is not obvious from the diff. One logical change per commit.

## Translations (`docs/i18n/`)

The README is translated into every language the extension supports. A translation is documentation,
not a word-for-word transfer:

- **Write in the register a native technical writer would use.** If a sentence only makes sense after
  reading the English, rewrite it.
- **Keep facts identical.** Version numbers, permissions, commands, provider names, file paths, token
  syntax (`<tN>`, `<vN/>`) and benchmark figures must match the English README exactly.
- **Translate UI labels as they appear in the extension.** If a button says *Translate this page*,
  use the same wording the popup uses; do not invent a second name for the same control.
- **Never translate** code identifiers, `chrome.storage.local`, endpoint URLs, model IDs, or the
  language codes (`fa`, `zh-TW`, …).
- **Preserve the direction.** RTL files are written RTL; tables and code blocks stay readable.
- **Update the switcher line** if you add or rename a file — `node scripts/i18n-nav.mjs` rewrites it
  in every file from a single list.

When the English README changes materially, update the translations in the same pull request or open a
tracking issue naming the languages that still need work. A stale translation is worse than a missing
one, so a partial update with a note is acceptable; a wrong fact is not.

## Adding a language to the extension

A new target language needs:

1. an entry in `content/languages.js` (`code`, `name`, `native`, `rtl`, `english`),
2. a style guide in `content/providers.js` if the language has typography or register rules worth
   enforcing (Persian, Arabic, Urdu and Hebrew have dedicated guides),
3. a test in `tests/providers.test.js` proving the prompt mentions the language correctly,
4. a README translation in `docs/i18n/`.

## Reporting bugs

Use the issue templates. A useful report includes the extension version, browser version, provider and
model, the page (or a minimal reproduction), and the exact error text from the banner or console.
