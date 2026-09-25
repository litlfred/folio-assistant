---
# folio-assistant-7e59
title: 'INGEST: decision-making methodologies — skill takes decision context as input, outputs ranked applicable methods with criteria and rationale. Source: qou bd0c2cb7 (3 arxiv PDFs: 2508.21620 probabilistic/bandits, 2509.06388 MCDM/AHP/SAW, 2607.20636 sequential/social). Covers all methodology families with when-to-use criteria.'
status: todo
type: task
created_at: 2026-09-25T15:38:03Z
updated_at: 2026-09-25T16:43:37Z
parent: folio-assistant-slw1
---

**Body written 2026-09-25 by a session that did not open this bean**, because
`check:bean-bodies` is red on `main` over it — `todo` with front matter and
nothing else. Every sentence below is taken from the repository, not supplied:
the title carries the request verbatim, and the work is already on `main`.

## What landed

`0f7b35aa636` — *"feat: decision methodology selector — skill + schema"*:

- `cat-harness/skills/folio-core/decision-methodology-selector.md`, declaring
  `graph-kinds: [methodology]`, which *"reads the graph's applies-when
  declarations, matches them against the context, and returns the ranked
  applicable methods with rationale"* and *"extends `methodology-adoption`'s
  four-question protocol with quantitative method-selection criteria from the
  MCDM literature"*.
- `cat-harness/schemas/decision-methodology-context.ts` — the typed context the
  skill takes as input.

## Not filled in here

The title names three arXiv sources (2508.21620, 2509.06388, 2607.20636) from
`qou` `bd0c2cb7` and says the skill *"covers all methodology families with
when-to-use criteria"*. **Whether it does is not something this session
measured**, so no box is written claiming it. The bean's opener knows what was
intended; a stranger inventing a `## Done when` would be the defect
`check:bean-bodies` exists to prevent, one step further on.

Parented to `slw1` (the INGEST epic) in the same turn, for the same reason:
`check:bean-parents` was red on `main` over it.

