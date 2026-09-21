---
# folio-assistant-1ity
title: 'COVERAGE: four instances'' library/ directories are rendered by the library viewer but do not declare it'
status: completed
type: task
priority: low
created_at: 2026-09-20T19:51:00Z
updated_at: 2026-09-21T07:28:24Z
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

## Verified done — 2026-09-21, and one of the four never owed it

Re-derived rather than taken. Every declared `library` directory in the
repository now carries `coverage.visualiser`, and
`check:subgraph-coverage` reports **zero** `library / visualiser` findings.

| instance the bean named | declares a `library`? | `coverage.visualiser` |
|---|---|---|
| `who-iris` | yes | **declared** |
| `agent-skills` | yes | **declared** |
| `folio-assist-sci` → `folio-assistant-sci` | yes | **declared** |
| `who-style-guide` | **no — it declares only `voices`** | n/a |

So three of the four got the line and the fourth never owed one. Recording
that rather than writing "4/4 done", because a bean that closes by rounding
up is one whose count nobody can reproduce.

Closed on the EVIDENCE that the findings are gone, not on authorship — the
`bean-coordination` rule for work that has already landed. Whoever declared
them did so between 2026-09-20 19:51 and now.

## What the check taught, and it belongs to `yt7j`

A first pass called three cat-harness entries defective because their `path`
values (`who-iris/library/`, `agent-skills/library/`,
`folio-assistant-sci/library/`) do not resolve from the instance root. They
are not defective: each carries **`scope: "repository"`**, which is the
declared disambiguator, and they resolve perfectly from the repo root.

That is a fact `yt7j` needs and did not have — see its own note.

