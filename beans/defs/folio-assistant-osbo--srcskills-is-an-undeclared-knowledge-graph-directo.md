---
# folio-assistant-osbo
title: src/skills is an undeclared knowledge-graph directory, and declaring it surfaces three hardcoded-path sites
status: todo
type: task
priority: normal
created_at: 2026-09-19T12:40:01Z
updated_at: 2026-09-19T12:40:28Z
---

## The measurement

`src/skills/` holds exactly one skill — `corpus-grep.md`, beside the
`corpus-grep.ts` that implements it — and it is **not a declared knowledge-graph
directory**. So `resolveSkillDirs` cannot see it, and `LOCAL_PACKAGES` names it
as an explicit exception (`CO_LOCATED_PACKAGES`) rather than discovering it.

Declaring it was tried and measured on 2026-09-19, not guessed:

- With `{ id: "cat-harness-src", path: "src/skills/", graphs: ["cat-harness"] }`
  added to `harness.json`, discovery reproduces the old hand-written table
  **exactly** — no gain, no loss.
- And `scripts/tests/declared-paths.test.ts` goes red: three files exceed their
  recorded baseline of hardcoded path literals —
  `scripts/gen-skill-docs.ts` 3 → 4, `scripts/tool-coverage.ts` 2 → 3,
  `scripts/check-agents-xref.ts` 0 → 1.

## Why it was not done in that change

That ratchet is real debt the declaration **surfaces rather than creates**: once
`src/skills/` is declared, a bare `"skills"` literal in those files names a
declared path they should be resolving. Raising a ratchet baseline to absorb it
would be recording new debt as though it were progress — the same shape as
pinning a coverage count as a regression guard.

Fixing the three sites is the actual work, and it did not belong in a change
whose subject was the skill overlay.

## Done when

- [ ] the three sites resolve the path instead of spelling it
- [ ] `src/skills/` is declared in `harness.json`, with an id that is NOT
      `cat-harness` (override is by id, and `skills/` already holds that one)
- [ ] `CO_LOCATED_PACKAGES` in `src/tools/skill-fetch.ts` is removed, and
      `discoverLocalPackages` alone reproduces the table
- [ ] `declared-paths` stays green without its baseline being raised
