---
# folio-assistant-hylg
title: Workflow interpreter descends into call activities — subprocesses give increasing context
status: completed
type: task
priority: normal
created_at: 2026-09-18T20:26:42Z
updated_at: 2026-09-23T19:25:46Z
parent: folio-assistant-ahvw
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

_2026-09-18T23:17:17Z_ — Conflict with origin/main resolved by a sibling session at the owner's request; head ac6ef29b5, merged never rebased. main's `A_CodeAudit` (callActivity -> `Process_Review`) and `A_DeployStaging` (`feature-staging`) moved into `crdm-deliver.bpmn`, since the monolith main added them to had already been decomposed on this branch — which makes `A_CodeAudit` a call activity INSIDE a called process, exercising this PR's nesting rather than the one-level case. The eight BA-lane `folio:skill` refs the decomposition dropped were restored from main's monolith (`kg:audit`: 8 major -> 0). Two renames a textual merge could not see: `roles.json` `name`/`summary` -> `title`/`description` carrying main's two new roles, and `ToolDefinitionSchema.summary` -> `description` in main's new `tools/mcp.ts` (20 Tool nodes, clean merge then 20 tsc errors). Bean deliberately NOT resolved — that is this branch's own session's call.

_2026-09-19T00:41:16Z_ — Checked 2026-09-19 — GENUINELY LIVE. The mechanism this bean describes landed on claude/festive-galileo-s7ibx0 as PR #282, which is still OPEN. Nothing to verify on main until it merges.

## Summary of Changes

Closed 2026-09-23 **on evidence, not authorship**, in the owner's "go through remaining beans" sweep. A read-only check against `main` called it landed, and it was re-verified before closing:

PR #282's mechanism is on `main`: `ProcessModel.children` resolves call activities and refuses cycles, subprocesses are reported with `inside: A ▸ B`, and `workflow_gate` separates "not entered yet" from "no such step". Six test files drain subprocesses. The "Next" list (two diagrams with no call activities) is follow-on content, not this bean's mechanism.
