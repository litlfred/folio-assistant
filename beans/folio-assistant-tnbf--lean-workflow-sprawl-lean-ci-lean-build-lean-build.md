---
# folio-assistant-tnbf
title: 'Lean workflow sprawl: lean_ci / lean-build / lean-build-sidecar / lake-cache-refresh'
status: completed
type: task
created_at: 2026-08-07T15:01:58Z
updated_at: 2026-08-07T15:01:58Z
---

Four overlapping Lean workflows plus two scripts and five skills. Audit what each actually does now that lake-cache.sh is the single service, and fold the redundant ones.


Audited by session `3bada08b` on branch `claude/agent-4673-validation-9hffrd`.

## The framing was wrong — they do not overlap, they are all FOLIO workflows

The bean asked what each does "now that lake-cache.sh is the single service"
and which are redundant. That is not the finding. **All four build
`content/<paper>/lean/`, which is folio content — folio-assistant is the
platform and has no papers, so none of them can run here at all.**

`lake-cache-refresh.yml` already says so, in a ⚠ block: "THIS WORKFLOW BELONGS
IN THE CONTENT REPO, NOT HERE (bean 8agu)". The other three have exactly the
same dependency and no such warning.

**23 hardcoded `quantum-observable-universe` references** across three of them
— `lean_ci.yml` (13), `lean-build.yml` (6), `lean-build-sidecar.yml` (1) — one
folio's paper name baked into platform CI. Same defect class as
`q-usage-audit`, `export-json`, `readme-metadata`, `refresh-authors-note` and
the MCP server, at CI level. `lake-cache-refresh.yml` is the exception and
shows the pattern: it reads its roster from `.github/lake-packages.json`, whose
own `$comment` states the copy here is a SAMPLE because "the lake-root paths
below resolve only in a CONTENT repo".

## Fixed here

- **Preflight on all three**, mirroring `qa-sweep.yml`: refuse with a clear
  message when no `content/<paper>/lean/lakefile.toml` exists, instead of
  failing partway through `lake build` with an opaque error. Verified in both
  repos — refuses in the platform, finds 3 Lean packages in qou.
- **Header drift.** `lean_ci.yml` documented `push (main)` and
  `pull_request (main)` triggers it does not have, and `lean-build-sidecar.yml`
  said it builds "on every push to a working branch". Both are
  `workflow_dispatch`-only, per the 2026-06-30 auto-trigger directive. A header
  claiming triggers a workflow lacks reads as coverage that is not there —
  the same failure mode as `eslint .` being a documented command that had never
  run.

## NOT done, deliberately

**Moving them to the folio.** That is the real fix — it is what was done for
`qou-paper-builder` earlier in this session, and what bean 8agu already
concluded for `lake-cache-refresh.yml`. Not done here for two reasons:

1. `lake-cache-refresh.yml` is inside a sibling's active cluster
   (`folio-assistant-02kc`, `-5d7z`, `-ga7e`, two live branches). Moving a
   workflow they are changing invites a conflict.
2. It is a cross-repo change with a licence/ownership dimension, which the
   owner decided explicitly last time rather than having it inferred.

**De-hardcoding the 23 paper references.** The correct pattern exists
(`.github/lake-packages.json` + the shared `lake-cache-restore` action), so
this is a port rather than a design problem — but it is ~550 lines of CI I
cannot execute from here, and shipping untested CI that *looks* folio-agnostic
is worse than CI that is honestly folio-specific behind a preflight. It should
be done in the folio, after the move, where it can be dispatched and observed.
