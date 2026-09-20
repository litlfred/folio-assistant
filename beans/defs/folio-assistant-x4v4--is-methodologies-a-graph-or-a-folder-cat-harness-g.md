---
# folio-assistant-x4v4
title: Is methodologies/ a graph or a folder? cat-harness graphs now nest inside it
status: todo
type: task
created_at: 2026-09-20T13:18:05Z
updated_at: 2026-09-20T13:18:05Z
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
