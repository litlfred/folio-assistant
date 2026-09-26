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

- [ ] One name per package, used by both `repo-partition.ts` and the instance
      declaration; a gate or a test that they cannot drift again.
- [ ] `smart-kg` is either given a directory and declaration, or removed from the
      partition with a note saying what it was for — a bucket that can never be
      non-empty is `dh4f` pointed at a name.

## Not claimed

Found while answering *"where are we in code separation"* (2026-09-26), and
offered to the owner as the recommended next step there. Recorded and left
`todo` pending that ruling.
