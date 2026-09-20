---
# folio-assistant-7u3g
title: bootstrap/workflows/ is scanned by nothing — workflowDirs composes <kgdir>/workflows
status: todo
type: task
priority: normal
created_at: 2026-09-20T14:47:57Z
updated_at: 2026-09-20T15:26:13Z
parent: folio-assistant-zzmr
blocked_by:
    - folio-assistant-pve3
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

## Worked 2026-09-20 — the diagnosis in this bean is half right, and the fix is a DECISION

### The cause is upstream of `workflowDirs`

This bean says `workflowDirs` composes `<kgdir>/workflows` and stops. It does
compose that — and it also has a FALLBACK, *"the directory itself when it holds
diagrams directly"*, whose own doc says it exists *"to cover today's
`skills/workflows/` and a topical `bootstrap/workflows/` without either being
written down."* The author's intent was already right.

The real cause is one level up: **`bootstrap/harness.json` declares BOTH of its
directories and the ROOT declaration carries only `skills/`.** `kgDirectories`
is root-only by design, so a directory declared exclusively by a nested instance
is a directory nothing scans.

Measured — adding one repository-scoped entry to `cat-harness/harness.json`,
**with no code change**:

| | before | after |
|---|---|---|
| `.bpmn` from `workflowFiles` | 50 | **53** |
| of those, bootstrap's | 0 | **3** |
| `skill-in-role-or-process` findings | 100 | **97** |
| kg-qa sidecars for the three | 0 | **3** |
| `workflow_list` / `workflow_start` | cannot see them | all three list and resolve |

(This bean predicted 49 → 52; baseline measured 50 because `graph-detanglement.bpmn`
landed between filing and working it. Both numbers quoted.)

`workflow_list` was verified **by running its code path**, as this bean demands,
not by reading it: all three load, and `workflow_start`'s stem resolver returns
`Process_InitializeHarness`, `Process_Discussion`, `Process_LogMessage`.

### Neither of this bean's two candidate fixes is the one

Option 1 (move `workflows/` under `skills/`) would contradict bootstrap's own
declaration, which states why they are siblings: `isSkillMd` is
declaration-over-location, so a graph rooted at `bootstrap/` reads README.md and
AGENTS.md as skill nodes and the scan contradicts the two assets the instance
has already declared.

Option 2 (declare workflow directories instead of composing) is still right on
principle and **would not have fixed this**: bootstrap's `workflows/` entry
declares `graphs: ["cat-harness"]`, so a declaration-driven `workflowDirs`
reading the ROOT declaration still would not see it.

### It is blocked on `pve3`, and a test says so

`kg-audit.ts` already named the cause in a comment — *"the real cause is bean
`pve3`, the root declaring `bootstrap/skills/` but not `bootstrap/workflows/`"*
— so this is the SECOND bean filed for one defect. `pve3` frames it as an owner
decision, **both halves of bootstrap or neither**, because "both" re-carries
bootstrap's process into the root's published graph, which `#432` removed
deliberately.

Measured, not argued: with the entry in place, references to bootstrap's
processes in the root's exported `_kg/folio-assistant.jsonld` go **0 → 238**.
And the suite fails, on a test that exists for exactly this:

> `a second instance in the tree stays out of the first's graph > the root
> instance's nodes include none of bootstrap's process`

The test was NOT touched. A guard that fires is the decision surfacing, not an
obstacle; skipping it would convert an owner's ruling into an agent's.

### Three defects the blindness was hiding, all fixed and all independent of the ruling

Making the directory visible for ten minutes was enough to find them:

1. **A phantom index row.** `every-workflow-in-the-repo.md` named
   `bootstrap/workflows/bootstrap.bpmn`, renamed to `initialize-harness.bpmn`
   long ago, while all three real diagrams went unnamed. `blv9` hiding behind
   `dh4f` — and the not-indexed check could not catch it, because it could not
   see the directory either.
2. **`log-message.bpmn` had NO diagram interchange.** Semantically valid,
   structurally unrenderable, and nothing failed because `render-bpmn` never
   reached it. Its sibling got one in `c06e827113`; this one was not in a set
   anyone could see. Authored, and it renders.
3. **The sidecar path escapes its own tree.** `kgQaSidecarPath` does
   `relative(repoRoot, subjectDir)`, which for a repository-scoped subject above
   the instance answers `../bootstrap/workflows` — and joining that climbs OUT,
   landing the sidecars in `test/results/bootstrap/`, a sibling of `kg-qa/`.
   Not cosmetic: `sweepOrphans` walks `KG_QA_RESULTS_DIR`, so the one mechanism
   that stops a verdict outliving its subject would have been blind to exactly
   the verdicts most likely to. Re-rooted under `_external/`.

All three shipped. The declaration entry is held at
`/tmp` in this session and is one insertion when `pve3` is ruled — the entry
text, with its measurements, is in the commit message.

## Done when — status

- [x] the three diagrams are reachable from `workflowFiles` — **demonstrated**, pending `pve3`
- [x] they have kg-qa sidecars, and the sidecars are read — **demonstrated**, and the escape that would have broken it is fixed
- [x] `workflow_list` can see them — verified **by running it**
- [x] `skill-in-role-or-process` no longer reports those three — 100 → 97
- [ ] a guard so a kg directory whose workflows are NOT at `<kgdir>/workflows` is a finding rather than silence — **still open**, and now clearly a separate piece: the silence here came from the DECLARATION, not from the composition, so the guard belongs on "a declared graph directory no consumer reached" rather than on `workflowDirs`

## Blocked on

`pve3` — both halves of bootstrap, or neither. Nothing else.
