## What this changes

<!-- One or two sentences. If it fixes an issue, link it: Fixes #12 -->

## Why

<!-- The reason, especially when the diff alone does not explain it. -->

## Checks

- [ ] `npm run verify` passes locally (syntax + 95 tests + policy checks + packaging)
- [ ] No new permissions, no build step, no `innerHTML` / `eval`
- [ ] Provider traffic still goes through the service worker (`AIPT_FETCH`)
- [ ] Prompt/parser/normaliser changes come with a test
- [ ] If the English README changed materially, `docs/i18n/` is updated or a follow-up issue is open
- [ ] `node scripts/i18n-nav.mjs` was run if a translation file was added or renamed

## Browser check (only if the DOM, RTL or popup/options UI changed)

<!-- Say which TEST_CHECKLIST.md items you ran, and in which browser. "Not run" is a valid answer. -->
