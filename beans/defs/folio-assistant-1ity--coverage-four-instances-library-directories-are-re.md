---
# folio-assistant-1ity
title: 'COVERAGE: four instances'' library/ directories are rendered by the library viewer but do not declare it'
status: todo
type: task
priority: low
created_at: 2026-09-20T19:51:00Z
updated_at: 2026-09-20T19:51:00Z
parent: folio-assistant-yj32
---

---

## Coverage declared for what this work actually renders — 2026-09-20

PR #594 landed `coverage: { visualiser, docs, skill }` on a directory entry
while this branch was in flight, and `check:subgraph-coverage` immediately
reported `schemas`, `library` and `uploads` as **owing a visualiser** — with
the pages sitting right there. The check reads a DECLARATION, not the
existence of a file, and it is right to: a page nobody declared is a page no
consumer can find.

That is the `dh4f` shape pointed at this branch's own output, which is the
thing the branch exists to argue against. Declared:

| instance | directory | visualiser | docs | skill |
|---|---|---|---|---|
| cat-harness | `schemas/` | `docs/schemas/index.html` | `docs/subgraph-viewers.md` | `schema-management` |
| cat-harness | `library/` | `docs/library/index.html` | (already) | (already) |
| cat-harness | `uploads/` | `docs/library/index.html` | (already) | (already) |
| root | `uploads/` | `docs/library/index.html` | `docs/subgraph-viewers.md` | — |

**`uploads` names the SAME page as `library`, and that is deliberate.**
`uploads/` is the queue feeding `library/`, and the uningested badge is
computed by subtracting one from the other. Two pages would be two answers to
*"how many are queued"*, free to disagree.

Measured: findings **127 → 120**, major **20 → 17**.

## What is left, and why it was NOT taken here

The remaining `library / visualiser` findings belong to **other instances'
declarations** — `who-iris`, `agent-skills`, `folio-assist-sci`,
`who-style-guide`. The library viewer genuinely renders all of them (it reads
every declared `library` directory, and shows three today), so declaring
coverage on their entries would be TRUE rather than a claim.

It was not done in this PR for one reason: those are other instances'
declaration files, edited at merge time, and a concurrent branch owning one of
them pays for the conflict. The statement is true and the edit is small — four
`coverage.visualiser` lines — so this is a queued follow-up rather than an open
question.

**Done when:** the four instances above declare
`cat-harness/docs/library/index.html` as their `library` visualiser, and
`check:subgraph-coverage` drops the corresponding findings.
