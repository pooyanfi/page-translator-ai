# Translations

The README is available in every language the extension can translate into. English at the
repository root is the canonical version; if a translation and [`../../README.md`](../../README.md)
disagree, the English text wins and the translation is a bug.

Every translation below was rewritten for **v1.3.1** against the English README of the same release:
same sections, same numbers, same commands, same permission names — written in the register a native
technical writer would use, not word for word.

| Language | Native | File | Direction | Status |
|---|---|---|---|---|
| English (canonical) | English | [`../../README.md`](../../README.md) | LTR | current |
| Persian | فارسی | [`README.fa.md`](README.fa.md) | RTL | current |
| Arabic | العربية | [`README.ar.md`](README.ar.md) | RTL | current |
| Hebrew | עברית | [`README.he.md`](README.he.md) | RTL | current |
| Urdu | اردو | [`README.ur.md`](README.ur.md) | RTL | current |
| Spanish | Español | [`README.es.md`](README.es.md) | LTR | current |
| French | Français | [`README.fr.md`](README.fr.md) | LTR | current |
| German | Deutsch | [`README.de.md`](README.de.md) | LTR | current |
| Italian | Italiano | [`README.it.md`](README.it.md) | LTR | current |
| Portuguese | Português | [`README.pt.md`](README.pt.md) | LTR | current |
| Dutch | Nederlands | [`README.nl.md`](README.nl.md) | LTR | current |
| Polish | Polski | [`README.pl.md`](README.pl.md) | LTR | current |
| Russian | Русский | [`README.ru.md`](README.ru.md) | LTR | current |
| Turkish | Türkçe | [`README.tr.md`](README.tr.md) | LTR | current |
| Chinese (Simplified) | 中文简体 | [`README.zh-CN.md`](README.zh-CN.md) | LTR | current |
| Chinese (Traditional) | 中文繁體 | [`README.zh-TW.md`](README.zh-TW.md) | LTR | current |
| Japanese | 日本語 | [`README.ja.md`](README.ja.md) | LTR | current |
| Korean | 한국어 | [`README.ko.md`](README.ko.md) | LTR | current |
| Vietnamese | Tiếng Việt | [`README.vi.md`](README.vi.md) | LTR | current |
| Thai | ไทย | [`README.th.md`](README.th.md) | LTR | current |
| Hindi | हिन्दी | [`README.hi.md`](README.hi.md) | LTR | current |
| Indonesian | Bahasa Indonesia | [`README.id.md`](README.id.md) | LTR | current |

## Rules for translators

- Keep **facts** identical: version, permission names, commands, paths, model IDs, token syntax
  (`<tN>`, `<vN/>`), test counts and benchmark figures.
- Write in the register a native technical writer would use. A sentence that only makes sense after
  reading the English has not been translated yet.
- Translate interface labels only when the extension itself shows a translated label; otherwise keep
  the English label the user actually sees (e.g. *Translate this page*).
- Never translate code, URLs, file paths, model IDs or language codes.
- RTL languages are written RTL, but tables and fenced code blocks stay structurally identical.
- Keep the switcher between `<!-- lang-nav:start -->` and `<!-- lang-nav:end -->` untouched: run
  `node scripts/i18n-nav.mjs` from the repository root to regenerate it in the English README and in
  every translation from a single list in [`../../scripts/i18n-nav.mjs`](../../scripts/i18n-nav.mjs).
- Changing the English README materially means updating the translations in the same pull request, or
  opening a tracking issue that names the languages still pending. A stale translation is worse than
  a missing one.

Full policy: [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md).
