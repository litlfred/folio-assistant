---
# folio-assistant-x4v4
title: Is methodologies/ a graph or a folder? cat-harness graphs now nest inside it
status: completed
type: task
priority: normal
created_at: 2026-09-20T13:18:05Z
updated_at: 2026-09-20T14:37:38Z
parent: folio-assistant-zzmr
---

Raised while landing PR #500 (bean `g43o`), **flagged rather than assumed**, because it is
the sibling author's structure and not mine to settle unilaterally.

## What the shape is

`harness.json` now declares `cat-harness/methodologies/crdm/` and
`cat-harness/methodologies/raci/` as graphs of kind `cat-harness`. They sit inside
`methodologies/`, which a sibling created for Kepner-Tregoe, MADR and DMN. So a
`cat-harness` graph now **nests inside** a `methodology` directory.

That is the shape [#263](https://github.com/litlfred/folio-assistant/issues/263) warns
about — a graph inside a graph, where a consumer scanning the outer one has to decide
whether the inner one's nodes are also its own.

## Why it is not obviously the same defect

In #263 the two kinds were on opposite **layers**: one `content`, one `state`, so a
process writing to the outer graph was writing into a graph declared read-only. Here both
are `context` and neither is written by a running process, so the specific failure #263
names cannot occur. **That is an argument for "not the same defect", not an argument for
"fine"** — it rules out one failure mode, and the containment question is untouched.

## The actual question

Is `methodologies/` a **graph** or a **folder**? Those are different answers and only one
is declarable:

- If it is a folder — a place several independent graphs happen to live — then nothing is
  nested and the whole question dissolves. But then `methodologies/` should not itself be
  declared, and the entries under it are just siblings with a shared path prefix.
- If it is a graph — with nodes of its own, so a methodology *is a node* — then the
  containment is real and the schema needs a story for it.

## Done when

- The question above is answered by whoever owns `methodologies/`, in writing, where the
  next agent will find it — the directory conventions skill, not a bean comment.
- `harness.json` matches the answer.
- If `methodologies/` is a graph, `schemas/cat-harness.ts` says what nesting means and a
  check enforces it. **Absent that, a consumer scanning the outer directory is free to
  guess**, and the two plausible guesses differ by every node underneath.

## Not in scope

Moving CRDM or RACI back. The owner asked for one tree and got one; this is about what
the tree's declaration *means*, not where the files are.

---

## Settled by the owner 2026-09-20 — it is a SUBGRAPH

> *"`cat-harness/methodologies/` is a subgraph. should be disconnected.
> convention folder corresponds to subgraph (but may be in process of being
> disentangled). use schema declaration/definition."*

So option 2 of the two this bean posed, and with a general rule attached that
is bigger than the one directory: **a folder corresponds to a subgraph.**

### A correction to this bean's own framing

It asked *"is `methodologies/` a graph or a folder?"* and said the folder
reading would mean **"`methodologies/` itself is never declared"**. That was
wrong on the facts: it **is** declared, id `methodologies`, kind
`methodology` — and its description already reads *"one sub-graph each"*. The
sibling's intent already matched the owner's answer. What was missing was
never the declaration of the parent; it was anything saying that
`methodologies/crdm/` is a subgraph **of** it.

### Containment is DERIVED, not declared

`subgraphTree` and `owningDirectory` in `schemas/cat-harness.ts`. A `parent`
or `contains` field would restate what the paths already say, and this
repository has paid for one fact in two places often enough — the retired
skill `roles:` field (260 dangling values) and `fallbackRole` (bean `85e8`).
`id` still governs overrides; path governs only containment.

The property that matters, verified: `methodologies/crdm/crdm-detect.md`
belongs to `methodology-crdm`, **not** to `methodologies`, while
`methodologies/kepner-tregoe.md` belongs to `methodologies`. That is this
bean's defect in concrete form — a sweep that attributes the first to the
outer graph makes every count computed from it wrong with nothing reporting
it.

Scope is honoured: `smart-kg/methodologies/` is repository-scoped so the
extraction stays literal, and it is **not** read as a child.

### "Should be disconnected" — measured, and it is not, which you predicted

`bun run subgraphs`. **21 cross-subgraph edges across the corpus.** It
REPORTS and does not gate, because the owner's own framing is that
disentangling is in progress, and a gate on known-outstanding work is the
*"cries wolf"* failure — reached once already this session by another route
(`dhol`, counting test literals). `--check` exits non-zero only on the third
state: a file whose edges could not be read.

### What the check found that I did not go looking for

**My own breakage.** Relocating CRDM in `g43o` left **13 broken links** in
`crdm-requirements-workflow.md` — `interaction-modality.md`,
`staging-review.md`, `todo-manager.md` and the rest were siblings when CRDM
lived in `skills/folio-core/`. Nothing caught it for hours.

And the first draft of this very check **would have kept them invisible**: it
skipped links whose target does not exist, reasoning that a dangling link
belongs to `blv9`. In a check about disentangling subgraphs that is exactly
backwards — a dead link *out of* a subgraph is the strongest available
evidence of an **incomplete move**, and skipping it made a half-finished
relocation read as a clean disconnection.

11 were real and are fixed, with a regression test naming the move. 2 were
`[main](…)` in an illustrative table and never named a file; the check now
skips placeholders, on the same rule and for the same reason
`check-declared-paths` skips `${…}` and `<locale>`.

A further **46 dangling links** corpus-wide are pre-existing and NOT this
bean's: bean `rl3h`.

### One more correction

I reported "7 outbound edges from CRDM" from a grep. That counted **mentions**
in prose, not resolvable links. The resolver found 0 resolving and 13 broken —
a different finding, and the important one.

### Guards

`scripts/tests/subgraphs.test.ts`, nine tests, each pinning a property that
was WRONG at some point while this was written: `owningDirectory` keyed on
`absPath` unconditionally so every relative query answered `undefined` — and
`undefined` is a legitimate answer here, so the bug read as a finding and a
sweep built on it would have reported a clean, empty corpus.

Registered in CI and classified in `repo-partition.ts` — `check:partition`
caught both omissions, which is the same "declared and never run" class.

Verification: `bun run gates` **57/57**; `bun test` **3870 pass, 0 fail**.
