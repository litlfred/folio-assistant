---
# folio-assistant-t5dm
title: 'INSTANCE NAME FROM THE CHECKOUT FOLDER: library-graph attributes root uploads to basename(repoRoot), so a clone''s directory name is published'
status: todo
type: bug
created_at: 2026-09-26T10:38:48Z
updated_at: 2026-09-26T10:38:48Z
parent: folio-assistant-zzmr
---

Found 2026-09-26 resolving #1290's conflicts in a worktree named `pr1290` (session_01ERf1yH3k69x37rXCrb6GYt). `bun run library:viz` wrote `"uploadInstance": "pr1290"` into 12 entries of `cat-harness/docs/assets/library/index.json` and emitted a page at `cat-harness/docs/cat-harness/library/pr1290/index.html`. Caught before push; regenerated from a directory named `folio-assistant`, after which all 12 read `folio-assistant`.

## Where

`cat-harness/scripts/library-graph.ts:388` — `return parts.length > 1 ? parts[0]! : basename(repoRoot);`. An upload at the repository root is attributed to whatever the checkout's DIRECTORY is called. `gen-library-viz.ts:1004` also records `built: basename(ROOT)`.

## Why it is a defect, not a convention

The root instance DECLARES its name: `folio-assistant.json` → `"name": "folio-assistant"`. A generator's output should be a function of the repository, not of where it was cloned; today `git clone … foo` publishes `foo`. Worktrees, CI checkouts under a different path, and the `space_cats` layout all make the directory name arbitrary. It went unnoticed because the canonical clone happens to be named after the declared instance.

Sibling of `r1vw` (package ids from a directory basename), which fixed the same class for package ids.

## Also observed, possibly the same class

Two tests fail in any worktree whose folder is not named `folio-assistant` and pass in the canonical clone: `FOLIO_ROOT detection > INSTANCE_ROOT is this platform checkout` and `this repository's own instances > every instance is found`. Recorded here as a hypothesis to check, not a finding.

## Done when

- [ ] `library-graph.ts` and `gen-library-viz.ts` take the root instance's name from its declaration, not `basename`
- [ ] Falsified: `library:viz` run from a checkout directory with a different name produces byte-identical `index.json` to one run from `folio-assistant/`
- [ ] Every other `basename(repoRoot|ROOT)` used as an INSTANCE NAME is found and either fixed or recorded (a grep, then a reading — not a count)
- [ ] The two worktree-failing tests are confirmed or ruled out as the same class
