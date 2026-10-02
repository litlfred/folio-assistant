---
# folio-assistant-bfyw
title: Two audits write into .beans/ and todos/ — locations AGENTS.md forbids
status: completed
type: bug
priority: normal
created_at: 2026-08-29T06:32:29Z
updated_at: 2026-08-30T10:37:02Z
---

Revived by #144. audit-status-sections defaults to .beans/status-section-audit.json (pollutes the bean store); qa-section-title-audit writes todos/section-title-audit.json (the todos/*.json store AGENTS.md says not to stand up) and its docstring claims it is gitignored, which is false in a folio_init layout.

## Summary of Changes

Found by running the tools `e1f6` had just revived: the first execution in a
scaffolded folio wrote two files into locations `AGENTS.md` forbids, and my own
`git add -A` on an unrelated submodule bump swept them into a commit.

    .beans/status-section-audit.json     bulk output in the WORK PLAN store
    todos/section-title-audit.json       the `todos/*.json` store AGENTS.md
                                         says not to stand up

Grepping rather than fixing the two observed turned up **four** writers, not
two:

| script | was | now |
|---|---|---|
| `audit-status-sections.ts` | `.beans/status-section-audit.json` | `build/…` |
| `extract-status-sections.ts` | `.beans/paper-todos.json` | `build/…` |
| `qa-agent-drain-queue.ts` | `todos/qa-agent-drain-queue.json` | `build/…` |
| `qa-section-title-audit.ts` | `todos/section-title-audit.json`, **hardcoded** | `build/…`, `--out` added |

`qa-section-title-audit` was the only one with no way to redirect its output,
and its docstring claimed the path was "gitignored" — true in `qou`, false in
anything `folio_init` scaffolds, which is exactly where it dirtied the tree.

### Why nobody noticed

Every one of the four was unreachable from a scaffolded folio until `e1f6`
fixed pipeline resolution. They only ever ran in `qou`, where `todos/` and
`.beans/` presumably were gitignored. Reviving them made a latent convention
violation observable on the first run.

### The risk I checked before changing a default

These are not my scripts and `qou` might read their output. Grepped for
consumers: **none anywhere in this repo** — only the writers and their own
docstrings. And `audit-status-sections` documents its sibling's output as
`.beans/qa-agent-drain-queue.json` while that sibling actually wrote to
`todos/` — an internal contradiction, which is evidence of drift rather than a
contract.

Mitigation regardless: only the **defaults** moved. `--out` is still honoured
by all four, so any caller passing an explicit path is unaffected, and anyone
depending on an old default restores it with one flag. Flagged in the PR as a
behaviour change.

### Verified

Deleted `todos/` and `build/` in folio-test, re-ran both audits through MCP:
artifacts landed in `build/` (gitignored) and `git status` showed only the
submodule — no stray files.

9 tests pin that no script defaults into `.beans/` or `todos/`, that each
defaults into `build/`, and that the formerly-hardcoded one honours `--out`.

Gates: 1190 pass / 0 fail, tsc clean, eslint clean.


## Closed 2026-08-30 — all four verified repointed

Status was `in-progress` while the "was / now" table already recorded the work.
Checked each of the four against the tree: zero live references to `.beans/*.json`
or `todos/*.json` remain; all four write under `build/`, and
`qa-section-title-audit.ts` has the `--out` flag the table promised.

**One near-miss worth recording.** A naive grep reports `qa-section-title-audit.ts`
as still carrying a forbidden path. It is a HISTORICAL COMMENT —
`// Was hardcoded to todos/section-title-audit.json` — explaining the fix. The
live default is `build/section-title-audit.json`. Counting comment text as a
live path would have reopened a correctly-closed bean.
