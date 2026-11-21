# Translation quality design — 1.3.0

## Intent

The extension translated text nodes, not sentences. A paragraph with one link became four
fragments, the model never saw the sentence, and inline markup could not be reordered, so the
target language kept the source word order. On top of that the prompt had no language-specific
guidance, the "quality" pass could not see the source, and the Persian typography the model
produced was never normalised. The goal of this work is output that reads as if written in the
target language, without changing meaning.

## Goals

- Whole-sentence (block-level) translation input with inline markup preserved and reorderable.
- Native-sounding target text: idiom, register, word order, terminology, punctuation, ZWNJ.
- Exact, lossless restore of the original DOM.
- No regression in safety: no `innerHTML`, no new permissions, no key in prompts.
- Measured, not asserted: segmentation benchmark + unit tests + static verification.

## Non-goals

- Side-by-side bilingual view, PDF translation, persistent IndexedDB cache.
- Translating closed shadow roots or cross-origin iframes (browser limitation).
- Supporting new providers or new UI languages.

## Anti-goals

- Dropping inline elements (links, emphasis) to make translation easier.
- Silently leaving a paragraph half-translated without telling the user.
- Promising quality that was not measured with a real provider.

## Approaches considered

1. **Prompt-only rewrite.** Cheapest, keeps the fragment architecture. Fixes some tone problems
   but cannot fix word order across inline elements. Rejected as the primary fix.
2. **Sentence grouping inside each block, still writing text nodes.** Groups text runs for the
   model, but the answer must be split back at the old boundaries, so order stays fixed and
   alignment is guesswork. Rejected.
3. **Block units + inline placeholder tokens + validated rebuild.** Whole sentences reach the
   model, tokens let it place links where the target language needs them, validation protects
   the DOM. Chosen.

## Design

Collection: a unit is the highest element with no block-level descendant. Serialisation turns
inline elements into `<tN>…</tN>` (translatable) and `<vN/>` (opaque: code, images, controls,
`translate="no"`). Text is trimmed at the edges, internal whitespace preserved.

Request: `{segments:[{id,text}], page:{domain,title,headings}, glossary}` plus injected
target-language style guide and few-shot examples. Response must be `[{id,text}]`; ids are
matched, so reordering or a missing entry is detected instead of silently shifting translations.

Apply: tokens are validated for balance, uniqueness and completeness. Only then is the unit's
child tree snapshotted and rebuilt: text becomes text nodes, `<tN>` reuses the original element
(so `href`, listeners and nested markup survive). Failure leaves the unit untouched and is
retried once with a stricter instruction.

Restore: the snapshot of node references is re-appended in the original shape; per-unit `dir`
and the `<html lang>` attribute are restored.

Typed errors: `parse`/`count` bisect the chunk; `network`/`timeout`/`ratelimit`/`server` retry;
`abort` never retries. Chunks are budgeted by characters (2400) and units (24), with the output
token ceiling derived from the input size.

Direction: each translated unit gets `dir` for the target language and `lang` is set on `<html>`;
no global `text-align !important` so centred layouts and code blocks keep their geometry.

## Decisions left to the builder

- Exact wording of the style guides for non-Persian languages.
- Whether to expose the `style` (natural/literal) switch in Options — implemented.
- Benchmark sample selection.

## What is left to the user

- A live quality check with their own provider key and preferred model.
