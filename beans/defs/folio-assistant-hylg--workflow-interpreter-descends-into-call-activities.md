---
# folio-assistant-hylg
title: Workflow interpreter descends into call activities — subprocesses give increasing context
status: in-progress
type: task
created_at: 2026-09-18T20:26:42Z
updated_at: 2026-09-18T20:26:42Z
---


## Progress — 2026-09-18

Mechanism landed on `claude/festive-galileo-s7ibx0` ([PR #282](https://github.com/litlfred/folio-assistant/pull/282)).

Before: a `callActivity` was an opaque box completed in one step, so decomposing
a diagram made it read better and gate LESS. `editing-hci-validation` asked for
one `CallActivity_Evidence` and skipped the ten gated steps of
`evidence-retrieval`; `document-ingestion` was four boxes over four real
diagrams; `content-lifecycle` four more.

Now: `ProcessModel.children` resolves `calledElement` at load time (cycles
refused there, naming the path); a subprocess is entered automatically;
`workflow_next` reports the leaf with `inside: Phase ▸ Phase`;
`workflow_complete` refuses the call activity itself; `workflow_gate` answers in
the owning process and distinguishes "not entered yet" from "no such step";
`positionOf` gives `beans prime` the leaf instead of the call activity. A call
activity naming a process no file declares stays opaque.

11 new tests. Four existing test files now drain the subprocess through a shared
`drainSubprocess` helper.

### Next

Decompose the flat diagrams, now that decomposition costs nothing in gating:
`crdm-requirements` (25 activities, 0 call activities), `content-change-review`
(20), `ig-incremental-build` (18), `human-translation-workflow` (16).
