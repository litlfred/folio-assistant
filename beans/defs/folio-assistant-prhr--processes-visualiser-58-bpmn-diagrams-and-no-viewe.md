---
# folio-assistant-prhr
title: 'PROCESSES VISUALISER: 58 BPMN diagrams and no viewer — a searcher over lanes, skills, bean ops and methodology'
status: todo
type: task
priority: normal
parent: folio-assistant-p5wm
created_at: 2026-09-21T22:01:44Z
updated_at: 2026-09-21T22:01:44Z
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

- [ ] The count is re-measured from the directory, not taken from this bean or
      its title
- [ ] A person can answer "what runs skill X" and "which processes have a
      Stakeholder lane" without opening a file
- [ ] The viewer reads the committed instances for position and renders no
      position of its own
- [ ] A process with no rendered SVG is reported as such rather than omitted —
      third state, same as everywhere else

