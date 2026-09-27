---
name: gate-tree-mutation
description: >
  Reading `bun run gates`' "NOT clean" verdict. Why every gate can pass and the
  run still exit 1, the two causes and how to tell them apart in one command, and
  the question that settles whether a churning field is a defect in the writer:
  does it describe the SUBJECT or the RUN?
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
clean.

**Two causes, and they are answered differently. Read `git status --short`
before you decide which one you have.**

---

## Cause 1 — you changed an input and did not regenerate

The ordinary case, and [`platform-gates`](platform-gates.md) §"What a `*:check`
failure is telling you" is the whole of it: run the generator, commit its output,
and run the gates **after** the last edit. Never hand-edit the artefact into
agreement.

---

## Cause 2 — the artefact records the RUN, and your run differs

This is the one that looks like cause 1 and is not. The generator is behaving
correctly, the input has not changed, and the file still gets rewritten — because
a field in it describes **the run that produced it** rather than **the subject it
is about**, and your run is not the last one.

**The question that settles it:**

> Does this field describe the SUBJECT the artefact is about, or the RUN that
> produced it? **Only the first is a reason to write.**

A field that records the environment — a timestamp, the checked-out HEAD, the
runtime version — will differ on every machine, so counting it as a reason to
write makes the artefact churn everywhere and reports that churn as though an
input had moved.

### The worked example, and it is fixed

Bean `3ozg`, 2026-09-27. The committed QA script sidecars under
`cat-harness/content/pipeline/script-sidecars/` carry three such fields:

```
last_run_at     wall-clock time of this run
last_run_sha    the checked-out HEAD
engine_version  `bun-${Bun.version}` — the local runtime
```

`saveQaScriptSidecar` already skipped the write unless a **substantive** field
moved, and it already excluded the two `last_run_*` fields. It counted
`engine_version`, so a run under any other Bun rewrote every sidecar whose
recorded engine disagreed — 72 of 86 from a container at `1.3.11` against CI's
`1.3.14`. `init-folio-qa.test.ts` runs a real sweep (found by bisecting 432 test
files), which is how `bun test` came to dirty the tree, and `bun run gates`
therefore ended `NOT clean` on **every branch, pristine `main` included**.

Two changes landed, and the order matters for reading the history:

| | |
|---|---|
| **#1442** | pinned Bun in `.bun-version`, with `check:bun-pin` holding all 22 `oven-sh/setup-bun` sites to it. Makes **CI** consistent — and a container image is not something a repository can pin, so it could not reach an agent container. |
| **#1452** | dropped `engine_version` from the comparison, joining the two `last_run_*` fields. Closes the residual: no engine difference rewrites anything. |

The owner kept both. They answer different halves: the pin makes the recorded
engine consistent where the repository controls it, the skip stops any other
engine from rewriting a file whose checker did not change.

### The argument that decided it, because the wrong one is tempting

#1442 defended keeping `engine_version` substantive with *"a verdict produced by a
different engine is a different verdict"*. **That is true and it is about a
different artefact.** A *script* sidecar holds no verdict — it records a
checker's source file, its hashes and its dependencies. Verdicts live in block
sidecars. And no reader consults a script sidecar's `engine_version` for
freshness: `entryIsFresh` compares `field_hash` and the script hashes, nothing
else. So the field is a record of the last real change's engine, not an input to
any decision.

The generalisable half is **not** "engine versions do not matter". It is that a
soundness argument has to be checked against the artefact in front of you: the
same field can be load-bearing in one sidecar and pure provenance in another.

---

## If you meet a churn whose writer has not been fixed yet

Discard it rather than committing it, and then **fix the writer**:

```sh
git checkout -- <the churning paths>
```

Committing such a churn stamps whatever your environment happens to be as though
it were a fresh measurement — with an older local runtime, a *downgrade*. That is
`sfjo`'s rule (*read what a regeneration writes before committing it*) applied to
a regeneration that is **faithful and still wrong to keep**: the generator records
your container correctly, and your container is not the repository.

**But discarding is a workaround, and the habit is the defect.** `3ozg` was filed
**three times in one day** — as `3ozg`, as `rmcf`, and `ymsu` is a different
defect over the same files — because every session that ran `bun run gates` on a
clean tree saw the same always-red line, discarded the churn, and moved on.
A signal that is always red is one nobody reads, and then it cannot report the
next real in-run repair, which is the whole reason the detector exists.

So the sequence is: discard, ask the question at the top of cause 2, and fix the
comparison. Do not add the paths to an ignore list — that removes the signal
instead of the cause.

---

## Do not read past the line

Cause 2 has a narrow signature. If `NOT clean` names paths outside the artefact
family you expect, or fields other than the run-provenance ones, it is **not**
this: the gate is telling you something new, and cause 1 is the likelier answer.

---

## Related

| | |
|---|---|
| [`platform-gates`](platform-gates.md) | which gates to run, and cause 1 in full |
| `scripts/gate-tree-guard.ts` | why the detector cannot live in a gate |
| `content/pipeline/qa-utils.ts` | `saveQaScriptSidecar`'s comparison, with `3ozg`'s reasoning beside it |
| [`generalise-the-fix`](generalise-the-fix.md) | the same shape one level up: fix the class, not the instance |
| [`upstream-version-adoption`](upstream-version-adoption.md) | moving a pin forward — a person's decision, never a gate's |
