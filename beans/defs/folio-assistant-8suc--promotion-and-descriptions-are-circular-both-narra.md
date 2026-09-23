---
# folio-assistant-8suc
title: 'PROMOTION AND DESCRIPTIONS ARE CIRCULAR: both narrative writers scan libraries only, and --promote refuses to file into one until the narratives exist'
status: todo
type: bug
created_at: 2026-09-23T13:54:54Z
updated_at: 2026-09-23T13:54:54Z
parent: folio-assistant-slw1
---

Found while closing `xeg6` on 2026-09-23, by hitting it.

## The cycle

- **`--promote` refuses** while the `image-descriptions` requirement is unmet.
  Observed directly on `2602.12670v4`: *"✗ NOT promoted — 1 requirement(s)
  unmet: image-descriptions, 7 describable image(s) with no narrative"*.
- **Neither narrative writer can reach an unpromoted document.** The only two
  are `scripts/apply-image-verdicts.ts` and `scripts/narratives.ts`, and both
  resolve their targets through `directoriesForGraph(root, "library")` —
  `apply-image-verdicts` at `join(libDir, docId, "images.json")`, `narratives`
  at `queue()`. `ingest-staging/` is not a declared library, so neither sees it.

So a document with describable images cannot be promoted until it has
descriptions, and cannot be given descriptions until it is promoted.

Checked against **every** tool that touches `images.json`: `library-graph.ts`
and `check-image-roles.ts` write nothing, `pdf-images.py` writes the sidecar
before any judgement exists, `check-l1-complete.ts` and `gen-library-jsonld.ts`
only read. There is no third writer and no staging-aware path.

## Why it went unnoticed

Every library entry carrying applied verdicts today — the two WHO documents,
`milnorlink` — was in its library **before** the promotion gate existed, so
`apply-image-verdicts` always found it. The cycle only bites a document
promoted for the first time WITH describable images, which is why it surfaced
now rather than when the gate landed.

This is the `1xhc` shape once more: nothing was red, because the path that
fails is one nothing had walked.

## Blast radius

The seven staged documents blocked on `image-descriptions` (`r8br`, issue
#722) are all in this state. `r8br`'s capture rung addresses the browser
prints; `2602.12670v4` was never a capture print, which is what `xeg6` was
about. **The cycle is underneath both** — a capture-print document whose
chrome is correctly filtered still needs descriptions for whatever real
figures remain, and it cannot get them either.

## Worked around once, deliberately not fixed

`xeg6` got `2602.12670v4` through by calling the tool's own exported `applyTo`
on the **staged** sidecar from a scratchpad script, so the bytes written are
the tool's rather than hand-authored, and `apply-image-verdicts --check` agrees
after promotion (`31 verdict(s) applied … ✓ every image is judged and every
verdict lands`).

That is not a fix. It is an uncommitted step no one can re-run from the
repository, and the next document meets the same wall.

## Done when

A document staged with describable images can be given its descriptions and
promoted using only committed commands, with no step that exists solely in
somebody's scratchpad.

## The shape of the fix is a DECISION, not an obvious patch

Three candidates, and they differ in what they say a verdict *is*:

1. **Teach both writers a staging target** (`--staging <dir>`, or accept a
   path). Smallest change. But it makes `ingest-staging/` a second place a
   judgement can be written, and the verdicts file lives in the library.
2. **Promote first, describe second** — let `--promote` file the entry with
   `image-descriptions` unmet and have `check:l1-complete` hold the line. Turns
   the requirement from a promotion gate into a completeness gate. Changes what
   "promoted" means.
3. **Fold verdict application into `ingest`**, so the staged sidecar is written
   from `library/image-verdicts.json` as one of the arms. Keeps one writer and
   one home for judgements, but couples ingest to a file that may not exist yet.

Not chosen here. Each moves a boundary this repository has drawn on purpose,
and `deletion-requires-confirmation`'s sibling rule applies: report, do not
decide.
