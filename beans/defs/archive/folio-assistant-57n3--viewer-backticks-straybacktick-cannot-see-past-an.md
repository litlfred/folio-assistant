---
# folio-assistant-57n3
title: 'VIEWER BACKTICKS: strayBacktick cannot see past an interpolation, so its file list cannot be derived'
status: completed
type: bug
priority: normal
created_at: 2026-09-21T11:09:08Z
updated_at: 2026-09-21T11:51:33Z
parent: folio-assistant-1xhc
---

`check-viewer-backticks.ts` names its files in an array. The obvious fix is to
derive them — every `.ts` whose source contains `return <backtick><!doctype
html>` — and that finds twelve where the array names five.

## Why it was NOT derived, measured 2026-09-21

Running `strayBacktick` over every candidate reports two findings on files
that COMPILE:

    FINDING line 402   cat-harness/scripts/gen-docs-auto.ts
    FINDING line 365   cat-harness/scripts/dak-pdf.ts

Both are a nested template literal inside an interpolation:

    <title>${esc(type.title)}${scope ? ` — ${esc(scope)}` : ""} · docs-auto</title>

The detector's rule is that the first unescaped backtick after the opening
closes the page template. It does not follow `${…}`, so a nested template
reads as the close, and the text before it is not `</html>`.

**So the array is not a list of the files somebody remembered** — it encodes a
PRECONDITION. The files in it obey their own NO BACKTICKS warning absolutely,
which is the condition that makes the naive scan sound. Deriving without
fixing the detector would trade one missed file for two false alarms, and an
author told twice that correct code is wrong stops reading the gate.

## The fix

Teach `strayBacktick` to skip a balanced `${…}` — tracking brace depth and
recursing into nested templates — then scan for the opener and delete
`VIEWER_SOURCES`. Tests should pin both directions: a real stray backtick
still found, and a nested template no longer reported.

## Done when

[ ] `strayBacktick` reports clean on `gen-docs-auto.ts` and `dak-pdf.ts`
[ ] a stray backtick planted in EITHER of them is still found
[ ] `VIEWER_SOURCES` is gone and the file set is derived from the opener
[ ] the derived set is reported, so a generator that stops matching is visible

## Not this

Widening the array further by hand. `who-iris/scripts/gen-iris-pages.ts` was
added on 2026-09-21 because the trap caught it for the third time in one
session and the detector reports it clean — checked, not assumed. Every
addition after that should be the derivation instead.


---

## Summary of Changes — 2026-09-21 (session_014HGPQoUnzXGqSspA8x6YyD)

`strayBacktick` follows interpolations now, and `VIEWER_SOURCES` is gone.

### The detector

Three small scanners rather than one regex, because `${…}` holds JavaScript:
`endOfTemplate` walks the page and hands `${` to `endOfInterpolation`, which
tracks brace depth and hands a backtick back to `endOfTemplate` (a nested
template) and a quote to `endOfQuoted`. All three appear in the real files —
`${who ? \`…\` : "…"}` is one line of `dak-pdf.ts` — so none could be waved
through.

**A backtick OUTSIDE an interpolation still closes the page**, which is what
keeps the trap caught: a backtick in a comment is ordinary text to the parser,
and ending the literal there is exactly the defect.

An unterminated template returns `null` rather than pointing somewhere: the
file is broken for another reason and a backtick would be a guess.

### Falsified both ways, on the real corpus rather than on fixtures

| | before | after |
|---|---|---|
| `dak-pdf.ts` | FINDING line 365 (compiles) | clean |
| `gen-docs-auto.ts` | FINDING line 402 (compiles) | clean |
| the other five | clean | clean |

And with a backtick planted in a comment inside each one's page template, **all
seven are still found** — including the two that could not be scanned at all
before. Losing the true positives to fix the false ones would have made the
detector worse than the list.

### The derivation

`viewerSources(root)` walks for `PAGE_TEMPLATE_OPENER`, skipping dot-prefixed
segments and `node_modules`. It finds **7** where the array named 5.

**Tests are excluded by shape, measured rather than tidy:**
`scripts/tests/check-viewer-backticks.test.ts` carries a planted stray at line
28 as a fixture, so scanning it would fail the gate on its own evidence. The
`.e2e.ts` files report clean, so they are excluded for the other reason — a
test is not a generator, and a gate watching fixtures reports on pages nobody
ships.

**The set is PRINTED, not counted.** A generator that stops matching the
opener drops out of a derived set in silence, which is the one way this can
quietly stop watching something. A number could not show a name going missing.
An empty set is exit 2.

### Done when

- [x] `strayBacktick` reports clean on `gen-docs-auto.ts` and `dak-pdf.ts`
- [x] a stray planted in EITHER of them is still found — in all seven, in fact
- [x] `VIEWER_SOURCES` is gone and the set is derived from the opener
- [x] the derived set is reported, so a generator that stops matching is visible

13 tests. Gates **85/85**, `bun test` **5135 pass / 0 fail**.
