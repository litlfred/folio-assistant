---
# folio-assistant-yx9p
title: 'SEPARATION: the 5 partition package names and the 5 instance directory names do not agree — 1 of 5 does'
status: todo
type: task
created_at: 2026-09-26T06:33:48Z
updated_at: 2026-09-26T06:33:48Z
parent: folio-assistant-vuip
---

Measured 2026-09-26. `repo-partition.ts` partitions 1143 modules into five
target packages. The repository holds sixteen declared instances as sibling
directories. **The two naming schemes agree on one of five.**

| partition package | directory | the directory's declared `name` |
|---|---|---|
| `agentic-harness` | `cat-harness/` | `cat-harness` |
| `folio-assist-core` | `folio-assistant-core/` | `folio-assistant-core` |
| `folio-asst-sci` | `folio-assistant-sci/` | `folio-assistant-sci` |
| `smart-kg` | *none* | — |
| `smart-base` | `smart-base/` | `smart-base` ✅ |

Three are near-misses (`folio-assist-core` vs `folio-assistant-core`), which is
worse than being plainly different: a reader skims them as the same string.

`smart-kg` is a partition bucket with **no directory and no declaration**,
currently holding 0 modules. A name with nothing behind it.

## Why now rather than at the split

A rename before any repository is cut is a **one-repo change**. After the cut it
is a cross-repo change touching every dependent's declaration, pin and
submodule path — and `folio-assistant/docs/folio-assistant-migration.md` exists
precisely because cross-repo coordination here is expensive.

`avatars.ts:80` records that the split has not happened. That is the window.

## What is NOT being proposed

Not that the partition is wrong. `check:partition` is clean — 0 unassigned, 0
wrong-direction — and its buckets are correct about which module belongs where.
The defect is that its bucket NAMES and the instance directory names are two
vocabularies for one set of things, with nothing reconciling them.

## Done when

- [x] One name per package, used by both `repo-partition.ts` and the instance
      declaration; a gate or a test that they cannot drift again.
- [x] `smart-kg` — CORRECTED, see below. It needed neither.

## Not claimed

Found while answering *"where are we in code separation"* (2026-09-26), and
offered to the owner as the recommended next step there. Recorded and left
`todo` pending that ruling.

---

## 2026-09-26 — done, and this bean was wrong about `smart-kg`

**The rename was five lines, not a sweep.** `instance-rules.ts` keys every rule
on stable ids (`"harness" | "core" | "sci" | "kg" | "base"`); `REPOS` maps each
to a DISPLAY name whose only consumer is `repo-partition.ts:87`. So the 118 /
133 / 23 / 43 files mentioning the old strings were almost entirely docblock
prose and one published page slug, not references that resolve. `check:partition`
after: 0 unassigned, 0 wrong-direction, unchanged.

`REPOS` now carries `name` (the TARGET repo) and `instance` (the directory
staging it today) as two fields, because they are two facts and were one string,
which is how they drifted.

### `smart-kg` needed neither a directory nor removal

This bean said a bucket that can never be non-empty is `dh4f` pointed at a name.
**That was wrong.** `smart-kg` is a Phase III target for WHO L1 document and KG
schemas this checkout does not hold — 0 modules because the code is not here
yet, not because the bucket is dead. A target not yet staged is a PLAN; `dh4f`
is a consumer scanning nothing and reporting a clean run. Conflating them would
have deleted a real target from the #223 design to satisfy a tidiness rule.

`kg` therefore carries no `instance`, deliberately, and the test asserts that
third state still exists rather than treating it as an omission.

### The guard caught a defect in itself first

`partition-names.test.ts` was written, passed 7/7, and then **failed its own
falsifier**: reverting `core` to `folio-assist-core` while leaving
`instance: "folio-assistant-core"` passed all seven. Two causes, and the second
is the one worth recording:

1. `"folio-assistant-core".startsWith("folio-assist-core")` is **false** — they
   diverge at `a` vs `-`. The near-miss shape this bean recorded is not a prefix
   relation, so a test built on prefixes passes on the exact defect.
2. More basic: nothing compared `name` to `instance` at all. The tests compared
   `declared` to `instance` and never closed the triangle.

Replaced with equality, which is the only relation that catches a near-miss —
near-misses are near by eye, not by any string operation. Re-falsified: the same
sabotage now fails with a sentence naming both strings and which one to change.

**A test that passes on the defect it was written for is worse than no test**,
because it is evidence of coverage. This one was that for about ten minutes.

