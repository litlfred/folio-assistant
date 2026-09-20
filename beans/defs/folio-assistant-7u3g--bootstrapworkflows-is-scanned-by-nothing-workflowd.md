---
# folio-assistant-7u3g
title: bootstrap/workflows/ is scanned by nothing — workflowDirs composes <kgdir>/workflows
status: todo
type: task
created_at: 2026-09-20T14:47:57Z
updated_at: 2026-09-20T14:47:57Z
parent: folio-assistant-zzmr
---

Found 2026-09-20 while sampling the unbound skills for bean `y1w9`. Not what
that sample went looking for, which is the point of sampling.

## The gap

`bootstrap/skills/` is a declared `cat-harness` graph, so `kgRoots` returns it
and the audit reads its skills. `workflowDirs` then composes
`<kgdir>/workflows` — i.e. **`bootstrap/skills/workflows/`**, which does not
exist. The diagrams are at **`bootstrap/workflows/`**, a SIBLING of
`bootstrap/skills/`, not a child.

So `workflowFiles(root)` returns 49 diagrams and **none of the three in
`bootstrap/`**:

```
bootstrap/workflows/discussion.bpmn
bootstrap/workflows/initialize-harness.bpmn
bootstrap/workflows/log-message.bpmn
```

## What is blind, measured

Sixteen modules consume `workflowDirs`/`workflowFiles`. Confirmed
consequences:

- **`kg-audit` writes no sidecar for them.** `test/results/kg-qa/` holds
  `skills/` and `methodologies/` and nothing else — so these three diagrams
  have never been audited, and nothing says so.
- **`src/tools/workflow.ts`** — the MCP engine. `workflow_list` /
  `workflow_start` cannot see them. They are executable in principle and
  unreachable in practice.
- `translate-bpmn` (no `.pot`, so untranslatable), `render-bpmn` (no SVG),
  `check-workflow-refs`, `check-workflow-policy`, `check-workflow-coverage`,
  `check:raci`, `kg-export`, `gen-docs-pages`, `stakeholder-map`,
  `corpus-gate`.

## How it surfaced

`skill-in-role-or-process` reports `confirm-harness`, `discussion` and
`log-message` as *"no role carries it and no activity names it"*. **All three
ARE named** by `<folio:skill ref>` in `bootstrap/workflows/*.bpmn`. The
criterion is right about what it read and wrong about the corpus — its own
finding text even lists `bootstrap` at `bootstrap/skills/` among the
directories it read, which is what makes the report so convincing.

That is this repository's recurring defect in its purest form: **relied upon
and never declared.** A reader of the audit concludes three skills are
unreachable; the truth is that three diagrams are.

## Two candidate fixes, and the choice is not obvious

1. **Move** `bootstrap/workflows/` to `bootstrap/skills/workflows/`. Cheapest,
   and makes bootstrap match every other kg directory. But `bootstrap/` is
   built to be lifted out whole (issue #223), and `workflows/` beside
   `skills/` may be deliberate about what that extraction contains.
2. **Declare** workflow directories rather than composing them. Removes a
   hardcoded path composition, which is the `check:declared-paths` thesis —
   `workflowDirs` composing `<kgdir>/workflows` IS a hardcoded layout
   assumption, sitting inside the helper written to eliminate them.

(2) is the better answer on principle and the larger change. **Whoever takes
it should establish which by reading `bootstrap/`'s extraction intent, not by
picking the cheaper one.**

## Done when

- [ ] the three diagrams are reachable from `workflowFiles`
- [ ] they have kg-qa sidecars, and the sidecars are read
- [ ] `workflow_list` can see them — verified by running it, not by reading
      the code
- [ ] `skill-in-role-or-process` no longer reports those three
- [ ] a guard so a kg directory whose workflows are NOT at `<kgdir>/workflows`
      is a finding rather than silence. **The silence is the defect**: a
      composed path that resolves to nothing currently yields an empty list,
      which is indistinguishable from a graph that has no diagrams.

## Not in scope

The other 98 unbound skills. Those are the `y1w9` triage proper; these three
are a tooling blind spot wearing the same costume.

## x-ref — `b5f0`, 2026-09-20: this is now a PREREQUISITE, not an adjacent defect

The owner asked that harness initialization *"be part of ALL harness
initializations"*. The process that does it is
`bootstrap/workflows/initialize-harness.bpmn` — the one this bean shows is
invisible to `workflowDirs`, and therefore to `workflow_list` / `workflow_start`.

**So the step cannot be made mandatory until this is fixed**: nothing can list
it, and `folio_init` installs no workflow either (`grep -c '\.github/workflows'
init-folio.ts` → 0, measured for `52dz`). A mandate on an unlistable process is
decorative.

This bean was "found while sampling for `y1w9`" — incidental. It is now on the
critical path for `b5f0`.
