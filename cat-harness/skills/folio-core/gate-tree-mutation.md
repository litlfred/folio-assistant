---
name: gate-tree-mutation
description: >
  Reading `bun run gates`' "NOT clean" verdict. Why every gate can pass and the
  run still exit 1, the two causes and how to tell them apart in one command, and
  why the QA script-sidecar churn in an agent container is discarded rather than
  committed.
adapters: [document, paper, dak]
profiles: [document, paper]
---

# "NOT clean" is a verdict about the RUN, not about your diff

`bun run gates` snapshots the tree before the first gate and after every one, so
a gate that **repairs** something on its way past is named. Every gate can pass
and the run still exit 1:

```
✗ every gate passed, and the run is NOT clean — 1 gate(s) changed the tree.
```

That is not tidiness. The gates that ran after the mutation were handed the
repaired tree, so their verdicts describe a state you have not committed — bean
`ymsu`, where `152 gate(s) pass` was printed **152 of 152 times** over a value
nobody had committed.

No gate can observe what another gate did, which is why the detector can only
live in the runner (`gate-tree-guard.ts`) and why its predicate is a per-gate
**delta** rather than "the tree is dirty": running gates over your own
uncommitted work is the normal case. A failure to read the tree is carried as
`undetermined` and reported rather than thrown, because `undetermined` is not
clean — the [third state](content-context-and-state-graphs.md) again.

**Two causes, and they are answered differently. Read `git status --short`
before you decide which one you have.**

---

## Cause 1 — you changed an input and did not regenerate

The ordinary case, and [`platform-gates`](platform-gates.md) §"What a `*:check`
failure is telling you" is the whole of it: run the generator, commit its output,
and run the gates **after** the last edit. Never hand-edit the artefact into
agreement.

---

## Cause 2 — your Bun is not the Bun the artefacts were produced with

```sh
bun --version            # this container
cat .bun-version         # what the repository runs
```

`.bun-version` is the one answer to that question, and `check:bun-pin` holds all
22 `oven-sh/setup-bun` sites across 12 workflow files to it, so **CI** is
consistent. **A container image is not something a repository can pin**, and an
agent container is free to differ: measured 2026-09-27, this one ran `1.3.11`
against a pin of `1.3.14`.

When it differs, a full `bun test` rewrites the committed QA script sidecars
under `cat-harness/content/pipeline/script-sidecars/`, changing three fields and
nothing else:

```
last_run_at     wall-clock time of this run
last_run_sha    the checked-out HEAD
engine_version  `bun-${Bun.version}` — the local runtime
```

**Only the third is *causing* the write.** `saveQaScriptSidecar` skips the write
entirely unless a **substantive** field moved; `last_run_at` and `last_run_sha`
are excluded from that comparison and `engine_version` is not — correctly, since
a verdict produced by a different engine is a different verdict. The two
`last_run_*` fields are passengers, which is why the bean's original remedy
("write into a temp directory") would have treated a symptom.

### The churn count is a fact about your container, not a blast radius

The 86 committed sidecars hold two engine values — 72 at `bun-1.3.14`, 14 at
`bun-1.3.11`, measured 2026-09-27 — and what moves is *whichever set disagrees
with you*: 72 files at Bun 1.3.11, 14 at 1.3.14, none at neither. Bean `3ozg`'s
title says 72 for that reason and it is not a constant. Quoting it as one is how
a reader concludes their own run is worse or better than it is.

### Discard it; do not commit it

```sh
git checkout -- cat-harness/content/pipeline/script-sidecars/
```

Committing stamps a **downgrade** — a pin of 1.3.14 with a local 1.3.11 writes
`engine_version` backwards — as though it were a fresh measurement. That is
`sfjo`'s rule (*read what a regeneration writes before committing it*) applied to
a regeneration that is **faithful and still wrong to keep**: the generator is
recording the container correctly, and the container is not the repository.
`script_hash` and `source_file` do not move — verified across all 86 — so nothing
a reader uses is being discarded.

Adopting the newer Bun is a different question and not this gate's to wave
through: [`upstream-version-adoption`](upstream-version-adoption.md), whose
accepting step is a `bpmn:userTask` in a person-only lane. Upstream's newest was
`bun-v1.4.2` on 2026-09-27; `check:upstream-pins` reports the pin as `behind`,
maintains its tracking issue, and is deliberately **not** a step in
`code-quality-gates.yml`, so a `behind` pin does not redden CI.

---

## Do not read past the line

`3ozg` was filed **three times in one day** — as `3ozg`, as `rmcf`, and `ymsu` is
a different defect over the same files — because an always-red signal is one
every session rediscovers and none of them finds written down. That is what this
skill exists to stop, and it is also the warning against using it too widely:

> If `NOT clean` names paths **outside** that directory, or fields other than
> those three, it is **not** this. The gate is telling you something new.

Neither bean is scrapped and neither is merged: `3ozg` holds the claim and the
fix, `rmcf` carries a pointer to it, and a deleted bean would stop the next
session reconstructing the reasoning
([`bean-coordination`](bean-coordination.md)).

---

## Related

| | |
|---|---|
| [`platform-gates`](platform-gates.md) | which gates to run, and cause 1 in full |
| `scripts/gate-tree-guard.ts` | why the detector cannot live in a gate |
| `content/pipeline/qa-utils.ts` | `saveQaScriptSidecar` and its substantive-field guard |
| [`upstream-version-adoption`](upstream-version-adoption.md) | moving the pin forward — a person's decision, never a gate's |
| [`qa-witness`](qa-witness.md) | the other QA projection, and why "could not determine" is a third state there too |
