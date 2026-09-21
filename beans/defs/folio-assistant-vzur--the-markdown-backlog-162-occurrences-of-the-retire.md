---
# folio-assistant-vzur
title: 'The markdown backlog: 162 occurrences of the retired declaration filename in skills an agent reads'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T17:43:09Z
updated_at: 2026-09-21T19:40:00Z
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

- [x] The 83 files say the right thing, `directory-conventions.md:454`'s
      substantive claim included.
- [x] The two generated files are REGENERATED, never hand-edited.
- [x] All four baseline entries removed, and `check:declaration-claims` green
      with an empty backlog.
- [ ] A decision recorded on whether `check:declaration-filename` now extends
      to markdown, with the backlog cleared so it can. **The blocker is gone —
      this is now only the owner's call**, put to them on
      [#768](https://github.com/litlfred/folio-assistant/issues/768).

*Recorded by session_01AYHimvYMmf8h8e9fFN6dW5 while closing `hrv2`. Worked by
session_017MEZnJxx7WeekiNCabx4hx, PR
[#769](https://github.com/litlfred/folio-assistant/pull/769).*

---

## Summary of changes — 2026-09-21

**123 current-path mentions → 1**, and the one left is `kg-export` quoting the
argument it retires. What remains repo-wide is records: 309 in `beans/`, 23
under `fsh-guts/` and `memory/`, 4 historical.

`check:declaration-claims` is green with an **empty** baseline — the finished
state, not a disabled one. The file is kept: a new contradiction fails whether
or not anything is listed.

### The bean's own worked example was wrong, and it mattered

`vzur` says `directory-conventions.md:454` is false in substance because *"the
declaration **is** stub-named"*. It is not. `artefactStub()` is `stub ?? name`
and the declaration is spelled by `instanceDeclarationFilename(name)` — the
file is named for the instance's `name`, the published artefacts for its
`stub`. The line's claim was still TRUE; only its filename was stale.

They coincide for every instance in the tree, which is why it reads as
stub-naming: of fifteen declarations only `cat-harness` sets `stub` at all,
and it sets it equal to its `name`. **A coincidence in the data is not the
rule** — an instance declaring a differing `stub` would publish
`<stub>.jsonld` beside a `<name>.json`.

### The gate was counting less and reporting the same tick

`check:declaration-claims` matched a filename as `[A-Za-z0-9._/-]+\.json` — no
angle brackets. A generic skill has to write `<name>.json`, so every sentence
fixed that way fell OUT of the corpus: **5 claims → 3** as the backlog was
cleared, each disappearance reading as a fix. That is the `/`-character
near-miss #767 recorded, arriving for real one character over.

A placeholder is now a THIRD state — counted, reported, never a contradiction
— with five tests, including one asserting it cannot mask a wrong concrete
name beside it. Corpus back to 5: 2 generic, 3 concrete.

### Three arguments a rename does not fix

`kg-export` and `migration-plan` both argued FOR the old name in the same
terms — a consumer needs **one fixed filename to open first**. Substituting
into that leaves an argument for fixedness illustrated by a name that is not
fixed. The concern was discovery and the split answered it:
`findDeclarationFile()` never computes a name from a directory (the failure
`migration-plan` warned of by name) but scans for a `*.json` whose stem equals
the `name` inside it, throwing on two rather than picking one.

`fsh-guts` was stale twice in one sentence — *"declares nine graph kinds and
none of them renders"* is 19 kinds across 34 directories, and `folio` is among
them. No count replaces it.

### A measurement had moved under the prose

`domain-fencing` quotes `readDeclaredFolioProfile()`, so fixing its filename
meant re-running it — and it no longer reproduces. `findContentRepoRoot()`
returns `cat-harness/`, not `cat-harness/folio/`, and the profile resolves to
`document` from both roots. #727 gave `cat-harness` a config of its own; a
defect closed by a side effect, with nothing recording it had been.

**The consequence is not thereby established**: 235 sidecars still carry
`detangler-archimedean-wall` verdicts written under the old behaviour, and
whether a fresh run still emits them was not measured. Bean `zq3f`.

### Also fixed

Twelve BPMN/DMN documentation strings (a file class the sweep did not count),
two stale doc comments in `schemas/cat-harness.ts`, four agent-memory entries,
and three things that were wrong rather than misnamed: `instance-kinds`
measured the corpus with a glob that now matches nothing, `installation`
copied the example config to a fixed destination name, and
`serving-renderings` called this instance's rendering `harness.jsonld` three
lines under a table saying artefacts are `<stub>.jsonld`.

`bun run gates` — 93 of 93.
