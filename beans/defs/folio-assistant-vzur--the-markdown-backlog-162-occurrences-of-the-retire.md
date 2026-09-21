---
# folio-assistant-vzur
title: 'The markdown backlog: 162 occurrences of the retired declaration filename in skills an agent reads'
status: todo
type: task
priority: normal
created_at: 2026-09-21T17:43:09Z
updated_at: 2026-09-21T17:43:09Z
parent: folio-assistant-vke6
---

Split out of `hrv2`, which was about a **wrong** filename. This is the
**retired** one, and the owner scoped it out of that change deliberately.

**Measured 2026-09-21 on `main`:** `harness.json` appears **162 times across 83
markdown files**, excluding `beans/` (historical records, correct as written).
Among them the skills an agent reads to learn how this repository works —
`directory-conventions.md`, `instance-kinds.md`, `kg-export.md`,
`agent-memory.md`, `skills-and-tools.md`, `cat-bootstrap/AGENTS.md`.

## Why it is not a find-and-replace

`directory-conventions.md:454` says:

> **The declaration file is `harness.json` and is NOT stub-named.**

The filename is stale AND the assertion is now false in substance — the
declaration *is* stub-named (`cat-harness/cat-harness.json`). Several of the 8
occurrences in that file are claims about how the system works, not mentions of
a path. Fixing them is editorial work on a skill, and
[`AGENTS.md`](../../AGENTS.md) says the skill is where the discipline lives.

## Four of them already fail a gate, and are baselined

`check:declaration-claims` (`hrv2`, 2026-09-21) fails on prose pairing a
declared graph id with a declaration file that does not declare it. Four such
pairings are in `scripts/declaration-claims-baseline.json`:

| file | |
|---|---|
| `skills/folio-core/directory-conventions.md` | `folio` ← `harness.json` |
| `skills/folio-core/skills-and-tools.md` | `beans` ← `harness.json` |
| `docs/reference/skill-instructions/directory-conventions.md` | **generated** — follows its source |
| `docs/reference/skill-instructions/skills-and-tools.md` | **generated** — follows its source |

A NEW contradiction fails; these are listed every run; an entry that stops
matching is reported **stale** so the file shrinks. **Removing a baseline entry
is part of doing this work** — the gate fails if one fossilises.

## The open question this inherits from `hrv2`

Should `check:declaration-filename` scan markdown for the retired name at all?
`hrv2` decided **not now**, and recorded why: its existing argument for
exempting prose — *"a rename REWORDS these"* — is sound for a doc comment and
weak for markdown, whose whole job is telling a reader where to look. 162
occurrences is a real backlog, but a gate turned on before the backlog is
cleared is a gate that is red on arrival.

**Order matters: clear the backlog, then turn the gate on.** Not the reverse.

## Done when

- [ ] The 83 files say the right thing, `directory-conventions.md:454`'s
      substantive claim included.
- [ ] The two generated files are REGENERATED, never hand-edited.
- [ ] All four baseline entries removed, and `check:declaration-claims` green
      with an empty backlog.
- [ ] A decision recorded on whether `check:declaration-filename` now extends
      to markdown, with the backlog cleared so it can.

*Not started. Recorded by session_01AYHimvYMmf8h8e9fFN6dW5 while closing `hrv2`.*
