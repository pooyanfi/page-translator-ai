# AI Page Translator — Manual Test Checklist

Test each item in Brave with the extension loaded unpacked. Mark pass/fail.

Automated checks (`npm run verify`: syntax, unit/integration tests, static policy checks,
packaging) are not a substitute for this list — they cannot exercise a real browser.

## Setup
- [ ] Extension loads in `brave://extensions` without errors (Developer mode → Load unpacked)
- [ ] Options page opens; provider, key, model, base URL, source language, target language, glossary all save
- [ ] "Test connection" reports OK for the configured provider (Ollama / Gemini / OpenAI-compatible)
- [ ] Popup opens; language selector shows all languages incl. Persian (Farsi)
- [ ] Shortcut hint shows the assigned shortcut or "not set"

## Full-page translation (static pages)
- [ ] News article → entire page translated, meaning/tone preserved, headings + body + links translated
- [ ] Wikipedia article → infoboxes, tables, citations translated; internal links still functional
- [ ] English → Persian: translated blocks get `dir="rtl"` and `<html lang>` changes; the page layout is not flipped; Persian text renders correctly
- [ ] Persian page → English: LTR restored correctly on switch back to original
- [ ] Source language selector in Options works (auto-detect or manual)

## Protected content (must NOT be translated)
- [ ] `<pre>` and `<code>` blocks left untouched
- [ ] Code-heavy docs page (MDN / GitHub README) → commands, code snippets, variable names untouched
- [ ] URLs, email addresses, brand names untouched
- [ ] `translate="no"` and `class="notranslate"` elements untouched
- [ ] `alt`, `title`, `placeholder`, `aria-label` attributes translated where useful
- [ ] SVG elements (including `<style>` inside SVG) not translated
- [ ] Contenteditable elements not translated
- [ ] Extension's own tooltip and banner not translated

## Dynamic pages
- [ ] SPA / infinite-scroll site → newly loaded content auto-translates as it appears
- [ ] No infinite MutationObserver loops; page stays responsive
- [ ] Multiple rapid navigations don't corrupt earlier translations
- [ ] Shadow DOM (open) content translated; closed shadow roots accessed where available

## UX
- [ ] "Translate this page" button translates; "Show original" restores correctly
- [ ] Hover over a translated paragraph → tooltip shows original text
- [ ] Tooltip hides when pointer leaves translated text
- [ ] Tooltip listeners installed only once even after 3 translate/restore cycles
- [ ] Right-click → "Translate selection" and "Translate this page" both work
- [ ] Keyboard shortcut `Ctrl+Shift+Y` (Mac: `Cmd+Shift+Y`) toggles translation
- [ ] Progress indicator shows during translation (popup progress bar with done/total)
- [ ] Error message shown for bad key / rate limit / network failure (no crash)
- [ ] Per-site preference remembered; auto-translate on reload works
- [ ] Language select in popup not reset by storage events

## CORS & Provider calls
- [ ] With provider=openai, baseUrl=https://integrate.api.nvidia.com/v1 and a valid key/model, translating a page issues the HTTP request from the service worker; no CORS-related message exists anywhere in the code
- [ ] Ollama 403 shows helpful message about OLLAMA_ORIGINS

## Performance & reliability
- [ ] Reloading a translated page uses cache (no duplicate API call for identical text in-session)
- [ ] Cancelling (toggle back to original) stops in-flight translation cleanly
- [ ] Long page translated in chunks without mid-sentence cuts
- [ ] Provider failure after some chunks succeeded: translated chunks stay, banner explains failure, popup shows "Show original", restore works
- [ ] Failure before any chunk succeeded: page untouched, translated=false
- [ ] Calling restoreOriginal while a translation is in flight: no banner, no late writes to the DOM, a later translatePage works normally
- [ ] After saving Options, an already-open tab uses the new settings on the next translate without reloading

## Quality & segmentation
- [ ] Segments: no-letter strings are never sent; identical strings are sent once
- [ ] Chunks never exceed 2400 chars / 24 units (except a single oversized segment)
- [ ] Count/parse failure bisects instead of failing the page
- [ ] A single failing segment stays original and increments skipped count
- [ ] Whitespace around a block is preserved when textContent is replaced
- [ ] Leading/trailing spaces on attributes preserved
- [ ] A paragraph with one link and one bold word is sent as ONE segment with `<t1>`/`<t2>` tokens
- [ ] After translation the link still points to the same URL and its text is inside the link
- [ ] A model answer that drops a token leaves the paragraph unchanged and triggers one strict retry
- [ ] `<code>` inside a sentence is preserved verbatim and never sent to the model
- [ ] Persian output has `ی`/`ک` (not `ي`/`ك`), `،`/`؟`, and ZWNJ in `می‌شود`/`کتاب‌ها`
- [ ] Translation style Natural vs Literal produces visibly different tone on the same page
- [ ] Quality mode fixes a deliberately bad first pass when the source is available
- [ ] UI labels (placeholder, alt, aria-label) are translated separately and read like labels, not sentences
- [ ] `<title>` and the tab title are not translated
- [ ] Source language auto-detect makes one small extra request and does not block the page for long

## Direction handling
- [ ] Translating an RTL page into English sets dir="ltr" on translated blocks and restores the original dir on "Show original"
- [ ] Translating into Persian sets dir="rtl" on translated blocks; `<html lang>` becomes the target language and is restored
- [ ] The whole page direction is NOT flipped: centred headings stay centred, code blocks stay LTR
- [ ] translateSelection never changes page direction
- [ ] Restoring removes dir/lang attributes that were absent originally

## Frame handling
- [ ] Only the top frame answers popup/service-worker messages; sub-frames still translate themselves
- [ ] Popup never shows a sub-frame's state (uses frameId: 0)
- [ ] Context menu "Translate selection" targets the correct frame

## Validation & config
- [ ] validateConfig messages appear in popup (Translate disabled), Options Save status, and as a banner/response on translate attempts
- [ ] No hidden model/base-URL defaults exist anywhere (except Ollama base URL fallback)
- [ ] Options Save never overwrites sitePrefs
- [ ] Options shows/deletes sitePrefs entries with live refresh

## Parser robustness
- [ ] parseJsonArray handles: raw array, array inside ```json fences, object wrapper {"x":[...]}, text before/after the array, a 

block before the answer
- [ ] Errors map to 'parse' or 'count'
- [ ] Aborts are never retried and never shown as "timed out"
- [ ] Reasoning model 

content doesn't break JSON extraction

## Acceptance Criteria (from spec)
- [ ] AC1: No provider traffic uses fetch() inside a content-script context
- [ ] AC2: NVIDIA/OpenRouter/Groq work via service worker proxy, no CORS errors
- [ ] AC3: DOM integrity preserved (links, formatting, children intact)
- [ ] AC4: Protected content never collected (code, pre, script, style, svg, translate=no, notranslate, contenteditable, tooltip, banner)
- [ ] AC5: Restore returns everything to exact original state (text, attrs, dir, body align, classes, selections)
- [ ] AC6: Restore during in-flight translation cleanly aborts, no banner, later translate works
- [ ] AC7: Error banner and hover tooltip visible; tooltip hides on mouseout; listeners installed once
- [ ] AC8: Settings changes in Options take effect immediately in open tabs
- [ ] AC9: Partial success on provider failure; chunks stay, banner shown, restore works
- [ ] AC10: sitePrefs written on translate, kept when showing the original, auto-translate works, Options never overwrites
- [ ] AC11: Popup progress bar reflects done/total; language select not reset by storage events
- [ ] AC12: validateConfig messages in popup, Options, and banners; no hidden defaults
- [ ] AC13: RTL page → LTR sets dir=ltr; LTR → RTL sets dir=rtl; selection doesn't change page direction
- [ ] AC14: Only top frame answers popup; sub-frames translate independently
- [ ] AC15: Segments filtered (no-letter, deduped); chunk limits respected; bisect on parse/count; single fail stays original
- [ ] AC16: parseJsonArray handles all formats; aborts not retried; no "timed out" for aborts