---
# folio-assistant-3w0i
title: 'RETIRE: generate-docs.ts — present since the root commit, never wired, never run'
status: completed
type: task
priority: normal
created_at: 2026-09-20T06:24:17Z
updated_at: 2026-09-20T06:43:48Z
parent: folio-assistant-zzmr
---


**The owner's word, 2026-09-20**: *"retire -> put in fsh-guts w/ as much
metadata as known. do some git commit archealogy"* — answering the wire-or-
retire question left open by `folio-assistant-3lbz`.

Record: `fsh-guts/scripts/generate-docs.md`, with the body beside it.

## The archaeology, by commit

| | |
|---|---|
| created | `04092f37`, 2026-09-15 — **the repository's ROOT COMMIT** (no parents, ancestry 1) |
| that commit | 1,169 files / 266,728 insertions, titled *"docs: diagrams are figures…"* |
| ever in `package.json` | **never**, in any commit |
| ever in a workflow | **never**, in any commit |
| output `schemas/generated/` ever committed | **never** |
| size | 843 → 908 lines over 8 commits |
| those 8 commits | Lean-lexer extraction, actor-kind split, `wlqd`, two literal drains, the `cat-harness/` move… **not one about this script** |

It was not decided on; it was swept in with an initial import, and then kept
compiling for a year of sweeps by people fixing other things.

`eslint.config.mjs` also carried `"schemas/generated/**"` — an ignore for the
output — added in **the same root commit**. Removed with the retirement: its
referent can now never exist.

## What the retirement settles

`generate-docs.ts` was the only code referencing three declared fields. With
it gone the count is ZERO for each, and the four places that called it "the
only reader, which renders it" are corrected in place:

- `SkillDefinition.schemas` — 11 of 22 skill modules declare one
- `SkillCapabilityRef.degradation` — 23 values across 24 modules
- `SkillCapabilityRef.fallbackRole` — static checker only

Whether those fields survive losing their last citation is NOT decided here.

## Two consequences the tests caught

- `manifest-remote-resolution.test.ts` enumerates readers of
  `skills/remote-packages/`. It was four; it is three. Updated with the
  reason, which is the opposite of the last removal's: this one really did
  read the directory and was never reached.
- `remote-packages-honest-docs.test.ts` read the script at import. **Kept and
  repointed**, not retired with it: `wlqd` corrected a false present-tense
  claim in its output, and fsh-guts is a relocation rather than a grave — so
  the honesty property must survive the move, or the fix un-fixes on the day
  someone revives it.

## Done when

- [x] archaeology recorded by commit, not by reading
- [x] the body and the metadata are in fsh-guts
- [x] every stale citation corrected, including the ones that are dated
      measurements (appended, not rewritten)
- [x] the phantom eslint ignore removed
- [x] `bun test` 3116 / 0 fail — the same count as clean `main`; gates 43

## Not doing

Deleting anything. `fsh-guts` is where a retired artefact lives, and actual
deletion needs the owner's explicit word.
