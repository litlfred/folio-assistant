---
# folio-assistant-zmdo
title: 'SPLIT: bootstrap agentic-harness + folio-assist-core as forks, then prove an empty-repo bootstrap'
status: todo
type: task
created_at: 2026-09-18T17:24:16Z
updated_at: 2026-09-18T17:24:16Z
parent: folio-assistant-vke6
---

## The ask

Owner, in chat 2026-09-18, verbatim intent:

> when we get to an MVP for agent-harness and folio-assist-core, create
> the two repo as forks of folio-asst. then delete/modify the new repos
> until we get to a state we can test under a new/empty repo "bootstrap a
> litlfred/folio-assistant here"

So: **fork twice, subtract, then prove the result bootstraps from nothing.**

## Why fork-and-subtract rather than build-up

Forking keeps history for every file that moves, which matters here more
than usual: the partition work (#223, #244, PR #251) has been classifying
modules as harness vs core for weeks, and a fresh repo would discard the
provenance of each decision. Subtracting from a fork means every deletion is
a reviewable diff against a known-good state, and `git log --follow` still
answers "why is this file shaped this way".

## The gate that makes this real

The end state is not "two repos exist". It is:

> a new, empty repository can say **"bootstrap a litlfred/folio-assistant
> here"** and get a working instance.

That is an executable acceptance test, and it should be written as one —
the same discipline as `scripts/tests/profile-scoping.test.ts` building its
own repositories rather than reaching into the ambient checkout. A bootstrap
that only works in a checkout that already has the platform is not a
bootstrap.

## Sequencing — blocked, and on what

**Blocked on MVP** of both layers. Do not start the forks before then: a
fork taken mid-partition inherits the unfinished classification and the
subtraction has to be redone.

Depends on:
- **#223** — separation of concerns (the parent)
- **PR #251** — `AgentHarness` / `agent-harness.json`, which defines what an
  instance declares and inherits. Its own "Not verified" section says the
  target layout (`tools/`, `kg/`, `folio/`) is declared by the schema but
  **not yet inhabited by any repo** — this bean is where it first is.
- `x4mt` — cross-agent skill installation. A bootstrap that cannot install
  skills into the host agent is not finished.
- `x3h9` — gettext + accessibility must be settled as harness-core concerns
  before the split hardens, or they land on the wrong side.

## Known hazards, from this repo's own history

- **`folio_init` is registered among the GENERIC tools, deliberately** —
  it runs before a folio has a content type, and a bare repo falls back to
  the paper adapter. Whatever bootstraps the new repos has the same
  constraint: it cannot live behind an adapter it is supposed to create.
- **The builder shim** exists so the path to folio-assistant is written down
  once. A two-repo split doubles the number of paths that could be written
  down more than once — check this before, not after.
- **"Could not determine" is a third state.** A bootstrap that cannot tell
  whether it is in a harness, a core or a folio must say so, not guess.

## Not yet established

Nothing here is measured. MVP is not defined for either layer, no fork has
been taken, and the acceptance test does not exist. This bean is the
placeholder that keeps the sequencing visible; it is not a plan yet.
