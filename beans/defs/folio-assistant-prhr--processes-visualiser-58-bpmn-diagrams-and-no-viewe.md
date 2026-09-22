---
# folio-assistant-prhr
title: 'PROCESSES VISUALISER: 58 BPMN diagrams and no viewer — a searcher over lanes, skills, bean ops and methodology'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T22:01:44Z
updated_at: 2026-09-22T08:20:36Z
parent: folio-assistant-p5wm
---

## What — owner, 2026-09-21

> bean, we also need a processes/ visualization as it is controlled.... its
> basically a bpmn searcher tool or so. with various filters.

## THE TITLE SAYS 58 AND THE NUMBER IS 61

Not a typo worth quietly fixing — it is this repository's own rule catching
its author mid-sentence. `bpmn-processes` says *"Count the directory rather
than quoting a number from this paragraph."* I counted
`skills/workflows/**` and `methodologies/*/workflows/**`, got 58, wrote it
into the title, then widened the glob to include instance-level `*/workflows/`
and got **61**.

The title stands as the evidence. **Re-count before quoting either.**

## Why a viewer, and why this one is not optional

`workflows` is one of the 16 kinds with no visualiser (bean `yunp`), and it is
the one where absence costs most: these diagrams are **executable**.
`workflow_list` / `workflow_start` / `workflow_next` / `workflow_gate` /
`workflow_complete` run them, instances are committed under
`beans/workflows/`, and `workflow_complete` refuses a step that is not
enabled. A corpus that governs what agents may do, and no way for a person to
search it.

The owner's *"as it is controlled"* is the point: a controlled process whose
only index is a hand-maintained markdown page is controlled in name.

## The filters come from the corpus, not from taste

Measured across the 61 files, 2026-09-21:

| facet | distinct | note |
|---|---|---|
| **lane** | 89 | `Agent` (12), `CI/CD Pipeline` (9), `Work plan — beans` (9), `Ingestion Engine` (8), `BA / Feature Requestor` (7), `Stakeholders` (5) |
| **`folio:skill ref`** | 84 | every activity carries one — this is the join to the skills graph |
| **`folio:bean op`** | 3 | `note` 24, `claim` 17, `resolve` 8 |

So the useful searches are already implied by the markup:

- *"which processes does a **Stakeholder** appear in?"* — lane
- *"what runs **this skill**?"* — the reverse of `folio:skill ref`, which is
  the join nothing currently exposes and which `kg:audit` checks one criterion
  of
- *"which steps **claim** a bean?"* — bean op, and this is the audit trail for
  who reserves work
- *"which processes are **strict** vs advisory?"* — `bpmn-processes` names
  four steps no package may relax
- **methodology** — CRDM and RACI have their own `workflows/` directories, and
  an instance may add more

## What it is NOT

Not a re-render. `render:bpmn` already produces the SVGs and
`render:bpmn:check` fails if they are stale. This is an INDEX over them —
search, filter, and the joins — so it consumes generated art rather than
generating any.

And not a second answer to "where are we": workflow STATE lives in committed
instances under `beans/workflows/`. A viewer that displayed its own idea of
position would be a second store free to disagree with the first, which
`workflow-state` names explicitly.

## Done when

- [x] The count is re-measured from the directory, not taken from this bean or
      its title
- [x] A person can answer "what runs skill X" and "which processes have a
      Stakeholder lane" without opening a file
- [x] The viewer reads the committed instances for position and renders no
      position of its own
- [x] A process with no rendered SVG is reported as such rather than omitted —
      third state, same as everywhere else

## Built — `gen-processes-viz.ts`, and the count is 62

**Re-measured from the directory, as the first done-when demands.** The bean's
title said 58, its body said 61; both are wrong now and were wrong differently.
This page carries no number in prose — every figure on it is counted at
generation time, which is the only form of the rule that survives the corpus
moving.

| fact | bean | my first pass (regex) | parser |
|---|---|---|---|
| diagrams | 58 / 61 | 62 | **62** |
| distinct lanes | 89 | 93 | **96** |
| distinct skill refs | 84 | 85 | **85** |
| bean ops | 49 | **30** | **49** |

### Three defects, all mine, all during construction

**1. It swept nothing and called that success.** `workflowFiles` takes an
INSTANCE root; handed the repository root it returns `[]`. The first run printed
*"Wrote processes-index.md — 0 diagram(s)"* and exited 0, over a corpus of 62.
The `dh4f` shape, produced by the generator written to report it. Fixed at the
cause (iterate every instance declaration) **and** at the symptom (a vacuity
guard that refuses to write an index over nothing).

**2. It claimed a gap that was not there.** The SVG path was composed from each
`.bpmn`'s own location instead of the docs layer `render:bpmn` writes to, so it
reported **11 of 62** diagrams as unrendered — all 8 CRDM, all 3 bootstrap.
Every one of those SVGs exists, and `render:bpmn:check` was green throughout.
**A finding that contradicts a passing gate is a finding to verify, not to
publish**, and this repository paid for the same mistake in
`viewer-undiscovered.test.ts` the same week.

**3. It measured with a regex.** 30 bean ops found, 49 present. Two legal
markup variants missed: a `store=` attribute before `op=`, and attributes
wrapped onto the next line. `check:workflow-refs` already says *"the real parser
is the oracle for the generator's regex"* — measured again, on the generator
written to index the corpus that sentence is about. It now consumes
`loadProcessModel`, the same bpmn-moddle parse the engine runs.

### A third state the bean did not know about

**24 of 62 processes declare no `folio:policy`.** `loadProcessModel` reads an
undeclared policy as `strict`, which is right for the ENGINE and its comment
says why — *"a process that forgot to say is governed, not exempt"*. It is not
right for a reader: *somebody chose strict* and *nobody said, so the engine
assumed strict* are different facts. The page asks the FILE whether a policy is
declared — a presence check, not a second reading of its meaning — and reports
`declared` and `defaulted` in separate columns. The engine keeps one answer; the
reader gets its provenance.

### The finding the page surfaces that nothing else did

**31 activities across 19 diagrams carry no `<folio:skill ref>`.**
`bpmn-processes` requires one on every activity: without it an agent reaching
the step is told what it is called and not what to run. Not fixed here — 19
diagrams is its own change — but it is now visible instead of being a thing
nobody counted.

### Where the done-whens are answered

The checklist above is ticked in place rather than restated here.
`check:bean-bodies` calls a second `Done when` a **shadow-checklist**, and it is
right: two of them are two answers to "is this done", and the one a reader finds
first is not the one the bean has always carried. I appended one anyway, and the
gate caught it.

- **count re-measured** — the table at the top of this section; the page carries
  no number in prose.
- **"what runs skill X"** — the reverse `folio:skill` join, 85 skills.
  **"which processes have lane Y"** — the lane table, 96 distinct names.
- **renders no position of its own** — the index consumes generated SVGs and
  reads nothing from `beans/workflows/`; workflow state stays the one store.
- **no rendered SVG reported, not omitted** — and the **zero** case is stated
  too, because "all rendered" and "the check did not run" are different facts an
  absent section cannot tell apart.
