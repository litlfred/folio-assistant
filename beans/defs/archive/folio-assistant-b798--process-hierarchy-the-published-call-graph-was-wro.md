---
# folio-assistant-b798
title: 'PROCESS HIERARCHY: the published call graph was wrong in both directions — a phantom self-edge read out of prose, and one process missing entirely'
status: completed
type: bug
priority: normal
created_at: 2026-09-20T09:53:22Z
updated_at: 2026-09-20T09:54:45Z
parent: folio-assistant-d308
---


Found 2026-09-20 while wiring `options-analysis` into `upstream-version-adoption`
(bean `u4hs`). Not caused by that change — the change is only what put the object
in a diff where the defect was legible. **Both halves are fixed in the same
commit**; this bean is the record of what was wrong and why nothing caught it.

`processHierarchy()` in `cat-harness/scripts/gen-docs-pages.ts` publishes the
BPMN call graph to `docs/assets/todos/index.json`, which is what the todo board
stacks by. It reads the XML with a **regex** rather than `loadProcessModel`, for
a stated and good reason: that loader is async and pulls in `bpmn-moddle` for a
page generator that otherwise touches no XML.

## Defect 1 — a phantom self-edge, read out of documentation prose

```
/calledElement="([^"]+)"/g   ← over the WHOLE file
```

`upstream-version-adoption.bpmn` documents itself, correctly, with:

> Callers invoke it with `calledElement="Process_UpstreamAdoption"`

So the published hierarchy carried `Process_UpstreamAdoption → itself`. That
edge is not merely wrong, it is one **`loadProcessModel` refuses outright** —
`process-model.ts:570`, *"A process cannot contain itself"*, because an
interpreter entering A → A settles forever. The generated artefact asserted an
edge the engine rejects, and the board would stack a process under itself.

Fixed by scoping the match to `<callActivity …>` opening tags, then reading the
attribute within the tag so attribute order is not assumed.

**Why the pattern invited it rather than this being a typo.** Naming your own
process id in `<bpmn:documentation>` is the ordinary way to document a reusable
subprocess — it is what a caller needs to know. Any diagram that does it mints a
phantom.

## Defect 2 — one process missing from the graph altogether

```
/<bpmn:process id="([^"]+)"/   ← PREFIX-BOUND
```

`translation-workflow.bpmn` binds the BPMN MODEL namespace as its **default**
(`xmlns="…/MODEL"`) and writes a bare `<process id="Process_Translation" …>`.
That is valid BPMN; the regex is what is wrong. `Process_Translation` was absent
from the published hierarchy entirely, so a todo tagged with it would have read
as naming a process no diagram declares.

Fixed with `/<(?:\w+:)?process\b[^>]*\bid="([^"]+)"/`. One file in the corpus is
affected today, which is exactly why it went unseen.

## Why nothing caught either — and this is the transferable part

`scripts/tests/todos.test.ts` has a test whose whole purpose is guarding this
function, and it could not have caught either half:

1. **Every assertion in it is `toContain`.** It pins edges that must be
   PRESENT, because the failure it was written for is the regex matching
   NOTHING and the board coming out flat. **A phantom edge is an addition**, and
   no `toContain` can see one. Matching too much is the same class reversed and
   is worse than matching nothing: a flat board is visibly empty, a phantom
   edge renders as a real one.

2. **The key-order test replicated the generator's regex** to build its own
   expectation. So both sides missed `translation-workflow.bpmn` identically and
   the assertion passed over a hole. That test's own comment says *"a test that
   pins an order must derive it from the same source as the thing it pins, or it
   pins the past"* — and it was deriving from the same **implementation**, which
   is how a test blesses a bug. Same source, different implementation, is the
   rule.

## The guard

One new test, `no PHANTOM edge — the real parser is the oracle for the
generator's regex`: reconstruct the hierarchy with `loadProcessModel` and
`toEqual` the published object. The real parser is async and pulls in
bpmn-moddle — the exact reason the GENERATOR cannot use it and a test can.

Deliberately **not** written as "assert `Process_UpstreamAdoption` does not
contain itself". That pins the past: the generator reads a regex, and the next
diagram to name its own id in prose would mint a fresh phantom the assertion
would not know about.

The key-order test now takes its ids from `loadProcessModel` too.

**Falsifier run in both directions**, not assumed. Re-broke the prefix regex,
regenerated, and confirmed BOTH tests fail (the oracle on the missing key, the
order test on the sequence); restored and confirmed 14/14. The phantom half had
already been observed failing before the fix went in.

## Done when

- [x] `calledElement` scoped to call-activity tags
- [x] `<process>` matched prefix-agnostically
- [x] an oracle test comparing the published graph to `loadProcessModel`
- [x] the key-order test no longer replicates the generator's regex
- [x] falsifier verified in both directions

Verified: 3312 tests 0 failures, `gen-docs-pages --check` clean, eslint clean,
46 gates — the whole set.
