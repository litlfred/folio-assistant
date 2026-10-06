---
# folio-assistant-4wzf
title: 'RENAME: agent-harness -> cat-harness (computable agentic testing harness)'
status: completed
type: task
priority: normal
created_at: 2026-09-18T19:24:30Z
updated_at: 2026-09-30T10:23:23Z
parent: folio-assistant-vke6
---

## The ask

Owner, in chat 2026-09-18:

> need to rename agent-harness to "cat-harness" for
> "computable-agentic-testing-harness"

Queued rather than done inline: it arrived mid-`g6yr`, and the standing
instruction is to queue new tasks rather than pivot.

## Why it is bigger than a sed

The name is load-bearing in several distinct namespaces, and they do not all
rename on the same schedule.

**On disk and in code** — `schemas/agent-harness.ts`,
`schemas/agent-harness.test.ts`, `agent-harness.json` (the declaration file
name, `DECLARATION_FILENAME`), `AgentHarnessDeclaration`,
`AgentHarnessDeclarationSchema`, `readDeclaration`'s error strings.

**In the IRI namespace** — `FOLIO_NS` projects `@type` values such as
`fa:AgentHarness`. **Changing a published `@type` is not a rename, it is a
new vocabulary term**, and `stripJsonLd`/`forType` round-trip against it. Any
already-published JSON-LD carrying `fa:AgentHarness` stops resolving. That
needs a decision: alias the old term, or accept the break and say so.

**In prose** — `AGENTS.md`, `skills/kg/kg-core/directory-conventions.md` and
its generated mirror, `docs/`, and the many bean bodies that reference the
file by name. Bean bodies are history; rewriting them would falsify the
record of what was decided when.

**Across repositories** — `agentic-harness` is the planned split repo
(issue #223, bean `zmdo`). Whether IT becomes `cat-harness` too is part of
this decision, not a consequence of it.

## What must be decided before starting

1. Does the JSON-LD `@type` change, and is the old one aliased?
2. Does the planned `agentic-harness` repo rename as well?
3. Are historical bean bodies and merged PR text left as they are? (They
   should be — a record that says what it said is worth more than a
   consistent one.)

## Verification gate

`bun test`, `eslint`, `tsc`, `check:harness-dirs`, and a grep showing no
surviving `agent-harness` reference outside deliberately-historical prose.
Plus a round-trip test that `toJsonLd` -> `stripJsonLd` still recovers the
declaration under whatever `@type` decision is taken.

## Not established

Nothing measured yet. No count of affected files has been taken; the list
above is from memory of this session's work and should be re-derived with a
`grep -ri agent.harness` before anyone estimates it.

## Summary of Changes — closed on evidence 2026-09-30

The rename was done by other sessions' work, not by this bean. It is re-derived here against `origin/main`, not assumed:

- **On disk and in code:** `schemas/agent-harness.ts` became `cat-harness/schemas/cat-harness.ts` (`CatHarness` declaration), and `agent-harness.json` became `cat-harness/cat-harness.json`. The rename landed with the split, 2026-09-21/22 (`19bba334da3`, `ebdd1b6393b`). Measured: **0** non-markdown files mention `agent-harness`, `AgentHarness` or `AgentHarnessDeclaration`, outside historical prose, generated pages and QA results.
- **Decision 1 (the JSON-LD `@type`):** **no alias exists.** `fa:AgentHarness` occurs in 0 non-markdown files, so the break was taken rather than aliased. Recorded as what happened; this bean does not assert it was ruled on.
- **Decision 2 (the planned split repo):** the partition names were reconciled by `yx9p` (2026-09-26). `REPOS` names the target `cat-harness`, the same as its staging directory, and a test holds them equal.
- **Decision 3 (history):** bean bodies and merged PR text still say `agent-harness` where they did, as this bean said they should.
