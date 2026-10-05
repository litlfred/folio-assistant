---
# folio-assistant-7uao
title: '27 QA witnesses record a stale auditor scriptHash while claiming freshness: fresh'
status: todo
type: bug
created_at: 2026-10-03T02:43:27Z
updated_at: 2026-10-03T02:43:27Z
parent: folio-assistant-1xhc
---


Found 2026-10-03 while regenerating after a merge, not by looking for it: a
`docs:pages` run rewrote 27 witness files, and the ONLY change in each was the
`scriptHash` of the auditor that produced it.

## The measurement

`auditorHash` is `sha256` of one file and nothing else —
`cat-harness/scripts/kg-audit.ts:2380`:

```ts
const auditorHash = sha256(readFileSync(join(AUDITOR_ROOT, "scripts", "kg-audit.ts"), "utf-8"));
```

So the recorded hash can only disagree with the script if the witness was
written by a different version of it. Measured against `origin/main` at
`0844d868ddc`:

| what | sha256 |
|---|---|
| `kg-audit.ts` **as it is on main** | `7c7a7d43cb5d8b8a…` |
| what 27 witnesses on main **record** | `0186df69604450688…` |

`git diff --name-only cat-harness/scripts/kg-audit.ts` is empty — the script is
not locally modified. The witnesses are simply old.

## Why this is a finding and not cosmetic churn

The field exists to say WHICH auditor produced a verdict, and every one of
these 27 records sits beside `"freshness": "fresh"`. An artefact that asserts
its own currency while naming a script that no longer exists is worse than one
with no provenance at all: a reader who checks the provenance is told it was
checked.

**And the whole gate set is green over it.** Main's `Code-quality gates`
passed on `0844d868ddc` with these 27 files in this state, so nothing compares
a witness's recorded `scriptHash` against the script it names. That is this
epic's subject exactly — the gate did not fire, and from a green run that is
indistinguishable from the gate having passed.

Adjacent to `ymsu` (a gate that writes what a later gate reads) but not the
same: there the writer dirties a sidecar a later gate reads, here no gate reads
the field at all.

## Done when

- [ ] A check fails when a QA sidecar or witness records a `scriptHash` that is
      not the current hash of the script it names
- [ ] It distinguishes "stale" from "could not read the script" — the second is
      not a pass
- [ ] The check is in the fast gate set, so `bun run gates` covers it
- [ ] The 27 witnesses are refreshed (this branch does that as a side effect of
      regenerating, which is the symptom, not the fix)

## Not done here

The 27 files are corrected on this branch because `docs:pages` rewrites them as
part of regenerating after a merge — that removes today's instance and leaves
the gap. The gate is the fix, and it is a separate change.
