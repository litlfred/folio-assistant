---
# folio-assistant-57n3
title: 'VIEWER BACKTICKS: strayBacktick cannot see past an interpolation, so its file list cannot be derived'
status: todo
type: bug
created_at: 2026-09-21T11:09:08Z
updated_at: 2026-09-21T11:09:08Z
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
