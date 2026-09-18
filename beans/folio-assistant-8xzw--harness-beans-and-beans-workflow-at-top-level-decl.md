---
# folio-assistant-8xzw
title: 'HARNESS: beans/ and beans/workflow/ at top level, declared, with a writable no-CLI fallback'
status: completed
type: task
priority: normal
created_at: 2026-09-18T17:04:30Z
updated_at: 2026-09-18T17:22:26Z
---
## What

`.beans/` and `.folio/workflow/` were hidden behind dotfiles — invisible in a plain
`ls`, in most file browsers and in GitHub's web tree. They are the two artefacts a
person looks for first (what is being worked on; where it got to), so they move to
`beans/` and `beans/workflow/`, adjacent and visible.

Declared in `folio.config.json` under `harness`, schema `HarnessDirsSchema`. The
`beans` binary cannot read that file — it is third-party — so `.beans.yml` still
holds the path it follows, and `check:harness-dirs` fails when the two disagree.
The duplication is unavoidable; an unchecked duplication is not.

`scripts/beans-fallback.ts` makes the no-CLI path WRITABLE. The old fallback only
listed, so a session in a container where the CLI would not install could see the
plan and not touch it — which is how 2026-09-18 produced two merged PRs of
unclaimed work. Same store, same layout, and `create` refuses a duplicate title
because the CLI's own `create` does not.

Decision: Option A from docs/proposals/workflow-state-in-beans.md — two stores,
one link — now co-located rather than merged.

## Done when

Stores moved with history, every reference repointed, harness block in the
schema, drift check green, fallback round-trips with the CLI, full hard gate.
