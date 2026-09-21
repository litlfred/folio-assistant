---
# folio-assistant-vzur
title: 'The markdown backlog: 162 occurrences of the retired declaration filename in skills an agent reads'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T17:43:09Z
updated_at: 2026-09-21T18:22:21Z
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
- [x] The two generated files are REGENERATED, never hand-edited.
- [x] All four baseline entries removed, and `check:declaration-claims` green
      with an empty backlog. **The gate reported all four STALE and failed until
      they were gone** — the shrink rule working, not merely declared.
- [ ] A decision recorded on whether `check:declaration-filename` now extends
      to markdown, with the backlog cleared so it can.

*Not started. Recorded by session_01AYHimvYMmf8h8e9fFN6dW5 while closing `hrv2`.*

---

## 2026-09-21 — 71 of 78 done, **7 held deliberately**, and the count was wrong

### The measurement in this bean's own header is wrong; do not quote it

| | |
|---|---|
| this bean said | 162 occurrences, 83 files |
| naive grep on today's head | 152 / 78 — main had moved |
| **boundary-correct** | **78 authored occurrences in 41 files**, plus 68 generated mirrors that follow |

The gap is the substring collision: **`cat-harness.json` contains
`harness.json`**, and so does `harness.jsonld`. I fixed exactly that defect in
the YAML checker this morning (`jijc`), then made it again with `grep` an hour
later. The corrected count uses the same left-boundary rule.

### What was done

**Pass A — 16 qualified paths** (`cat-harness/harness.json` →
`cat-harness/cat-harness.json`), each verified to exist on disk.

**Pass B — 50 generic references**, by PHRASE rather than token swap.

**Pass B damaged the prose, and that is worth recording rather than hiding.** A
blanket phrase pass produced 10 broken lines — *"The cause is one segment. the
declaration declares…"*, *"declaration: the declaration at the repository
root"*, *"from the instance's / the declaration and read from"*. Found by
scanning for the damage classes, and each repaired by hand. **This repository
already knew:** *"a blanket migration cannot tell a literal that IS the code
from a literal DESCRIBING code"* (`jijc`). The same trap, one file type over.

**9 more by hand** — table cells, the layout diagram, `instance-kinds`'s
`ls -d */harness.json` command (which returns nothing now), and
`directory-conventions.md:7`, the opening sentence of the conventions skill.

**The rule written into that sentence was CHECKED, not assumed.** I was about
to write *"named after the instance"*. `findDeclarationFile` matches on
`name === stem`, and `cat-harness.ts` explicitly warns against *"deriving a
declaration's location from a directory name"*. Measured across 12
declarations: `name` always equals the stem; `stub` is **absent on 11 of 12**.
So it is `name`-named, and *"NOT stub-named"* was right in substance all along
— only the filename was stale.

### The 7 held, and why

Three of them are the same **argument that lost**, stated in three places:

> *"The declaration file itself is deliberately NOT stub-named. It stays
> `harness.json`, exactly as smart-base's config stays `dak.json`. A consumer
> bootstrapping into a repository it knows nothing about needs one fixed
> name… Renaming it per-repo fails silently."*
> — `kg-export.md:233`, and again at `directory-conventions.md:454` and
> `migration-plan.md:185`

The REPLACE ruling overturned it. The declaration IS per-repo-named now, and
`findDeclarationFile` answers the old objection by scanning for a `*.json`
whose `name` matches its stem. **Rewriting that is recording that the owner's
own architectural decision reversed, and why the objection no longer bites.**
That is the owner's to author, not an agent's to slip into a 41-file diff.

The other four are narrower judgement calls:
`directory-conventions.md:47` and `kg-navigation.md:47` (a quotation about
which layer names things), `docs/getting-started.md:250` (a `// harness.json`
label on a JSONC block whose contents look like a FOLIO config, not a
declaration — naming it wrongly would be the `hrv2` defect again), and
`create-sticky-note.md:89`.

### Still open

The last Done-when — whether `check:declaration-filename` extends to markdown
— stays open **by this bean's own rule: clear the backlog first.** 7 remain,
so the gate would be red on arrival. It is unblocked the moment the owner
settles the three above.

`bun run gates` — 93 of 93.
