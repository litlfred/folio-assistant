---
# folio-assistant-vzur
title: 'The markdown backlog: 162 occurrences of the retired declaration filename in skills an agent reads'
status: completed
type: task
priority: normal
created_at: 2026-09-21T17:43:09Z
updated_at: 2026-09-21T21:05:00Z
parent: folio-assistant-vke6
---

Split out of `hrv2`, which was about a **wrong** filename. This is the
**retired** one, and the owner scoped it out of that change deliberately.

**Measured 2026-09-21 on `main`:** `harness.json` appears **162 times across 83
markdown files**, excluding `beans/` (historical records, correct as written).
Among them the skills an agent reads to learn how this repository works —
`directory-conventions.md`, `instance-kinds.md`, `kg-export.md`,
`agent-memory.md`, `skills-and-tools.md`, `bootstrap/AGENTS.md`.

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
      with an empty backlog. **The gate reported all four STALE and failed until
      they were gone** — the shrink rule working, not merely declared.
- [x] A decision recorded on whether `check:declaration-filename` now extends
      to markdown, with the backlog cleared so it can. **The owner ruled: yes.
      It is on**, and the backlog was cleared first, in this bean's own order.

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

---

## 2026-09-21, later — a second session worked this in parallel, and the overlap is the finding

Session `017MEZnJxx7WeekiNCabx4hx` (PR
[#769](https://github.com/litlfred/folio-assistant/pull/769)) was clearing the
same backlog while #780 was open, and neither saw the other until the merge.
**80 conflicting files.** Everything above is #780's and stands; this records
only what the second pass adds, and where the two disagreed.

### The gate was counting less and reporting the same tick

**This is the one that matters, because it makes the work above partly
invisible.** `check:declaration-claims` matched a filename as
`[A-Za-z0-9._/-]+\.json` — no angle brackets. Both sessions correctly wrote
`<name>.json` in generic skills, and **every such sentence fell OUT of the
gate's corpus**: it went 5 claims → 3 as the backlog was cleared, each
disappearance reading as a fix.

That is precisely the near-miss `hrv2` recorded about the `/` character,
arriving for real one character over — and it lands hardest on #780, whose 50
generic replacements are the bulk of the newly-invisible prose.

A placeholder is now a **third state** — counted, reported, never a
contradiction — rather than folded into agreement, so "fix the gate by making
the sentence vague" cannot work. Five tests, including one asserting a
placeholder does not mask a wrong concrete name beside it.

### Where the two sessions disagreed: the 7 held

#780 held 7 deliberately, three of them the **argument that lost** in
`kg-export.md:233`, `directory-conventions.md:454` and `migration-plan.md:185`,
on the ground that *"recording that the owner's own architectural decision
reversed … is the owner's to author, not an agent's to slip into a 41-file
diff."*

The second session rewrote all three before seeing that. **The merge keeps
#780's held versions** — the more conservative call, and the one already
reviewed. The rewrites are not discarded: they are on #769 for the owner to
accept or drop, which is what #780 asked for.

Both sessions independently reached the **same substantive conclusion** about
`directory-conventions.md:454`, from different evidence: `artefactStub()` is
`stub ?? name` while the declaration is spelled by
`instanceDeclarationFilename(name)`, so *"NOT stub-named"* was right all along
and only the filename was stale. #780 measured 12 declarations, the second
session 15; `stub` is set on exactly one, equal to its `name`.

### What the second pass adds beyond the prose

- **Twelve BPMN/DMN documentation strings** across ten diagrams — a file class
  neither sweep counted, `folio-intent.dmn` among them.
- **Two stale doc comments** in `schemas/cat-harness.ts`: `findDeclarationFile`
  said it scans `*.config.json` when it scans `.json`.
- **An executable test that was wrong, not misnamed.** `getting-started.md`
  used `test -f harness.config.json` for folio-ness; since the split, presence
  alone is the `harness` membership and a folio is a `<name>.config.json`
  **declaring a `contentType`** (`folioMarkerFilename` says so). The DMN input
  it quotes said the same and is fixed with it.
- **A measurement that had moved under the prose.** `domain-fencing` quotes
  `readDeclaredFolioProfile()`, so fixing its filename meant re-running it —
  and it no longer reproduces. Bean `zq3f`: the resolver was fixed by a side
  effect of #727, but 235 sidecars still carry verdicts from the old
  behaviour, and **a fixed resolver is not a fixed verdict**.

---

## Closed 2026-09-21 — the owner ruled on all four open questions

PR [#769](https://github.com/litlfred/folio-assistant/pull/769). `bun run
gates` 93 of 93.

### 1. Restore the filenames — corpus 1 → 3

Pass B's phrase replacement (`harness.json` → *"the declaration"*) removed the
pairing `check:declaration-claims` verifies. The prose stopped being wrong and
stopped telling a reader which file to open; the gate built one day earlier
fell to **1 claim across 747 files**.

26 lines restored by rebuilding from the ORIGINALS with the retired name
swapped for `<name>.json`, rather than patching the phrased form back. That
also repaired four grammar defects Pass B's own repair sweep missed — *"a the
declaration at the instance root"*, *"the declaration declares"* twice, and
*"The stub (the declaration → `stub`)"*.

### 2. The held 7 — landed

The owner authored the reversal by ruling. Three were the same argument in
three places; each now records that the **discovery half was answered rather
than traded away**. Two were the layer-naming argument, which the declaration
file no longer exemplifies.

`docs/getting-started.md:250` was **checkable rather than a judgement call**,
and the caution was the right instinct aimed at the wrong file: every key in
that JSONC block — `title`, `description`, `icon`, `images` — is a top-level
field of the DECLARATION, verified against `cat-harness.json`.

### 3. The gate is on, and found a bug in its own matcher

`check:declaration-filename` reads markdown, classifying: `record` (derived
from the declarations), `generated` (prefixes composed from each instance's
`siteDirFor()`), `historical`, `jekyll-data`, `use`. Only `use` fails.

**History is tested by the PARAGRAPH, not the line.** A line-local test read
`kg-export`'s retirement note as a stale path, which would make
correctly-written history the one thing the gate cannot recognise — pushing an
author to delete the record rather than mark it.

**`boundedIndexOf` checked only the LEFT boundary**, so `harness.jsonld`
matched. The bean that added that check named `harness.jsonld` in the same
sentence as `cat-harness.json`, then guarded only the side it had a failing
example for. Half a filename rule fails as a FINDING rather than a miss, so it
looks like the check working.

Falsified both ways; 16 tests.

### 4. `TODOS_DIR` removed

Verified unused across the whole tree, not only `.ts`. The only other
occurrences are an unrelated Python local in `fsh-guts/`.

### What this bean leaves behind

`zq3f` — the profile resolver was fixed by a side effect of #727, but 235
sidecars still carry verdicts from the old behaviour. **A fixed resolver is
not a fixed verdict**, and that was not measured here.
