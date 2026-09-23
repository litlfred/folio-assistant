---
# folio-assistant-8suc
title: 'PROMOTION AND DESCRIPTIONS ARE CIRCULAR: both narrative writers scan libraries only, and --promote refuses to file into one until the narratives exist'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-23T13:54:54Z
updated_at: 2026-09-23T14:51:12Z
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

## Fixed 2026-09-23 — owner chose the flag PLUS the wiring

Three measurements taken while working it changed the picture this bean
recorded, and two of them contradict what it assumed.

**`--promote` runs NO arms.** `ingest-document.ts`:
`for (const s of ingestMode(argv) === "promote" ? [] : plan.steps)`. So
promotion cannot clobber an applied verdict, and the two-step path was
already safe — this bean did not establish that and implied otherwise.

**But a plain stage re-run DOES clobber.** `pdf-images.py` opens the sidecar
with `"w"`: no existence check, no merge. Applying a verdict by hand therefore
works exactly once, and the next `ingest` erases it QUIETLY — the file still
parses and still validates, it simply has no narratives left.

**And options 1 and 3 were never alternatives: 3 contains 1.** Folding the
application into `ingest` still requires teaching the apply step a staging
target, which is the whole of option 1. The only real question was whether
`ingest` then calls it for you — and because of the clobber above, wiring it
in is what makes a re-run RE-APPLY rather than wipe. That is the argument the
option list was missing.

Option 2 fared worse on inspection than written: letting `--promote` file an
incomplete entry contradicts the contract `ingest` states in its own refusal
— *"nothing was filed under `<library>/`, so nothing reads as ingested"* — and
moves a gate that keeps the corpus clean into a check that fires after the
mess has landed.

## What shipped

- `apply-image-verdicts.ts` gains `--staging <entry-dir> --library <lib-dir>`,
  in a SEPARATE `runStaging` body. The whole-corpus runner exits 1 when it
  finds no verdicts — a completed pass over no work — and staging mode must do
  the opposite, because the first ingest necessarily runs before anybody has
  looked. Two callers with opposite error semantics sharing one body is how
  one of them ends up with the other's exit code.
- `--library` is REQUIRED with `--staging`, not guessed (`v1hw`).
- An orphaned verdict still fails, in either mode, and writes nothing.
- `withDerivedArms` gains the destination library and a **fourth arm**, placed
  after `pdf-images.py`. The ordering is asserted as an ORDER rather than as
  two presence checks, because presence is exactly what still holds in the
  broken case.
- The transformation stays `applyTo`, shared, so a staged sidecar and a
  promoted one cannot be written differently.

## Verified by reproducing, not by reasoning

The failure was observed this morning on `2602.12670v4`:
*"✗ NOT promoted — 1 requirement(s) unmet: image-descriptions"*. After the
change, the same document and the same command report **"every requirement met
— ready to promote"**, with the arm visible in the run:
`7 verdict(s) applied`. `pdf-images.py` had just rewritten all seven as
`figure` from geometry; the arm restored the four `logo` roles.

Both new arm tests were **falsified**: moving the verdict arm before
`pdf-images.py` fails the ordering test, and passing the staging root as
`--library` fails the destination test. The exit-code test was falsified by
making an absent verdicts file return 1.

`bun run gates` green; 8 new `runStaging` tests.

## The original option list, kept

## The shape of the fix was a DECISION, not an obvious patch

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

**Chosen 2026-09-23 by the owner: option 3** — "flag + ingest applies it",
after the three measurements above were put to them. Reporting rather than
deciding was right: the choice turned on a fact (the clobber) that only
showed up once someone read `pdf-images.py`'s write mode.
