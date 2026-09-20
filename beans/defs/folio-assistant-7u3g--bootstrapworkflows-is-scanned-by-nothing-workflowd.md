---
# folio-assistant-7u3g
title: bootstrap/workflows/ is scanned by nothing — workflowDirs composes <kgdir>/workflows
status: scrapped
type: task
priority: normal
created_at: 2026-09-20T14:47:57Z
updated_at: 2026-09-20T15:32:27Z
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

---

## SCRAPPED 2026-09-20 — this bean is wrong, and the corpus already said so

**There is no blind spot.** The audit does not read a nested instance's graph
**by design**, and `instance-graph-isolation.test.ts` enforces it against a
leak that was live on `main` on 2026-09-19: `findBpmnDirs` walked the tree, so
`_kg/folio-assistant.jsonld` carried **88** references to
`Process_InitializeHarness`. Bootstrap's process was published as part of
folio-assistant's graph.

### I implemented the fix this bean proposed, and it re-introduced that leak

Declared `bootstrap/workflows/` at the root with `scope: "repository"`, built
a `check:nested-declarations` guard, fixed a real `..`-escape in
`kgQaSidecarPath`, updated CI and the partition, and regenerated. All of it
verified as working: `workflowFiles` 49 → 53, all four bootstrap skills bound,
`workflow_list` loading three processes with their activities.

Then `bun run gates` failed on *"a second instance in the tree stays out of
the first's graph"* — which is the invariant, doing its job. **Everything
above is reverted.**

### The correction was already written, and it describes me

`kg-qa.ts`, criterion `nested-instance-audited`, authored earlier the same
day:

> *"On 2026-09-20 a session read 'named by no activity' as absolute, concluded
> the audit had a blind spot, declared the nested directory at the root and
> re-introduced the leak the test exists to prevent."*

A sibling made this mistake hours before me. Their fix — bean `sa8y` — scoped
the finding's wording and added `nested-instance-audited` so the unread
corpus is a reported number rather than something to deduce.

**And the scoping worked; I ignored it.** The finding I quoted in full says:
*"In this instance's graph only (read: `cat-harness` at `skills/`, `bootstrap`
at `bootstrap/skills/` …) — a nested instance may name it, and this audit
does not read one."* I pasted that sentence into my own notes and still wrote
a bean asserting a blind spot. The defect was not the wording; it was that I
treated a disclaimer as boilerplate.

### What was actually true, and where it went

- **`workflow_list` cannot start bootstrap's diagrams from cat-harness's
  root** — correct, and correct BEHAVIOUR: bootstrap is its own instance and
  the engine run against `bootstrap/` sees all three. Not a defect.
- **`kgQaSidecarPath` normalises a `..` straight out of the results tree** —
  a real latent bug, and reverted with the rest because nothing can reach it
  while the isolation invariant holds. It becomes live the day a subject
  legitimately sits outside an instance, and is recorded here rather than
  fixed in the dark.
- **`every-workflow-in-the-repo.md` names `bootstrap/workflows/bootstrap.bpmn`,
  which does not exist** (the file is `initialize-harness.bpmn`). A genuine
  dangling reference, unrelated to any of the above. Carried to bean `rl3h`,
  where the other 46 live.

### For whoever reads this next

If `skill-in-role-or-process` names a skill you believe is bound, **read the
finding's scope clause before concluding anything.** It tells you which
directories were read and that a nested instance was not. Three sessions have
now walked at this; two got as far as editing `harness.json`.
