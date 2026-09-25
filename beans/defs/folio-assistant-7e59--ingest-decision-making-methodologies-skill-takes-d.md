---
# folio-assistant-7e59
title: 'INGEST: decision-making methodologies — skill takes decision context as input, outputs ranked applicable methods with criteria and rationale. Source: qou bd0c2cb7 (3 arxiv PDFs: 2508.21620 probabilistic/bandits, 2509.06388 MCDM/AHP/SAW, 2607.20636 sequential/social). Covers all methodology families with when-to-use criteria.'
status: todo
type: task
created_at: 2026-09-25T15:38:03Z
updated_at: 2026-09-25T15:38:03Z
parent: folio-assistant-slw1
---

---

## Filed under `slw1` 2026-09-25 — and why this was urgent

Created 2026-09-25T15:38 with **no `parent`**, which fails
`check:bean-parents`. That check sits inside `bun test`, at **step 5** of the
`TypeScript — tests, lint, types` job, so its one failure took `main` red and
**skipped the 44 gate steps behind it** — run 3636 on `a83f8bee90`. A
work-plan hygiene slip blacked out the whole gate set.

Parent is **`slw1`** — *"INGEST: one pipeline from uploads/ to a complete L1
library"* — on this bean's own naming: its title opens `INGEST:`, which is how
every other child of `slw1` is named, and what it describes is three arXiv PDFs
ingested from `qou bd0c2cb7`.

**`ahvw`** (*"PROCESS: how an agent decides what it is doing"*) was the real
alternative, filing it by what it PRODUCES — a selector over decision
methodologies — rather than by how the material arrived. Put to the owner with
both readings; `slw1` chosen.

Nothing else about the bean is touched: its scope, status and body are its
author's.

## The ordering is arguably the larger defect

`7e59` is one line. That one line could dark 44 unrelated gates because
`check:bean-parents` runs *behind* `bun test` in a single job rather than as its
own step. Not fixed here — that is a change to the gate topology, and this
change exists to get `main` green. Worth a bean of its own.
