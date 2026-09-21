---
# folio-assistant-hrv2
title: AGENTS.md names the wrong file for the health graph — and the wrong file FAMILY
status: in-progress
type: bug
priority: normal
created_at: 2026-09-21T16:51:13Z
updated_at: 2026-09-21T17:45:00Z
parent: folio-assistant-vke6
---

Found 2026-09-21 while closing `jijc`'s workflow half, and **not fixed there**
because it is a different file with a different owner.

`AGENTS.md` §"Repository health":

> Results are committed under `test/health/results/`, declared in
> `folio-assistant.config.json` as the `health` graph.

Both halves are wrong, and they are wrong in different ways:

| claim | measured on `main` @ `0fc29b9` |
|---|---|
| the file is `folio-assistant.config.json` | that file exists, and carries `contentType` + `dependencies` — **no `directories` at all** |
| ...so the graph is declared there | the `health` entry is in **`cat-harness/cat-harness.json`**, path `test/health/results/` |

**Two families, not one.** `<instance>/<instance>.json` is the HARNESS
declaration — directories and graph kinds, the file `harness.json` was renamed
to. `<name>.config.json` at a root is the FOLIO config — content type,
dependencies, skills. `AGENTS.md` names the second while describing the first.

## Why this is worth a bean rather than a one-line edit

The same sentence is the one a newcomer reads to find out where anything is
declared, and `AGENTS.md`'s own banner says the file is *"a cat-bootstrap
pointer, not the source of truth"* whose stale entries are **migration debt**.
So the fix is not only the sentence: it is whether anything CHECKS it.
`check:declaration-filename` covers `.ts` and, since `jijc`'s workflow half,
`.yml` — and `AGENTS.md` is neither.

That is the same shape `jijc` just closed one level out: a file class nothing
examines, reported clean because it was never read.

## Done when

- [x] The sentence names `cat-harness/cat-harness.json` and the right family —
      **and eight more like it**, see below.
- [ ] A decision, recorded either way: does the declaration-filename check
      extend to markdown, or is prose deliberately out of scope? *"A rename
      REWORDS prose"* is the existing argument for out-of-scope — but this
      entry is not reworded prose, it is a wrong path a reader will follow.
- [x] Sweep for the same confusion elsewhere in the docs before closing — done,
      and it found **158**, not one.

*Not started. Recorded by session_01AYHimvYMmf8h8e9fFN6dW5, which found it and
did not pivot to it.*

---

## Swept 2026-09-21 — the sentence was one of 158, and the cause is a reversal

### The cause, traced rather than guessed

`c7b8f80e` (bean `6n23`, PR #695) substituted `harness.json` →
`folio-assistant.config.json` across **15 markdown files**. That was *correct
when it was made*: #695 had merged the declaration and the config into one file
at the root.

Then **#727 split them back apart** — `<name>.json` for the declaration,
`<name>.config.json` for the config. Every one of those substitutions describes
the declaration half, so **all of them became wrong at the same moment**, and
nothing noticed, because markdown is a file class no check reads.

So this is not a typo. It is a reversal the prose did not follow, and the
bean's own framing — *"one instance found is not one instance existing"* — was
an understatement by two orders of magnitude.

### The measurement

983 markdown files read, excluding `beans/`, generated references and
`docs-auto`:

| kind | count |
|---|---|
| `harness.json` — retired, excised by #695 | 87 |
| `harness.config.json` — retired earlier still | 63 |
| `folio-assistant.config.json` where the DECLARATION is meant | 8 |
| **total** | **158**, in 80 files |

Classified by whether the mention **names a current path** or **records
history**, because this repository writes its own history in place and
rewriting those would falsify the record:

| | |
|---|---|
| names a current path | **113** |
| record — `fsh-guts/proposals`, `fsh-guts/retired`, `memory/`, agent memory | 23 |
| translated — pipeline-owned, not hand-edited | 4 |
| historical — states a former name beside its replacement | 7 |

The heuristic for "historical" is crude (past-tense vocabulary on the same
line), so 7 is a **lower bound** and some of the 113 will be history too. That
is exactly why the fix below is not a substitution.

### What was fixed here, and why only this

The **8 config-for-declaration** mentions, in `AGENTS.md` (7) and `README.md`
(1). Each was read in context and given its own replacement rather than
sed-substituted — a second blanket substitution is what caused this. Plus
`AGENTS.md`'s `harness.config.json` claim about what `folio_init` writes, which
is in the same sentence family and measurably wrong: `init-folio.ts` calls
`instanceDeclarationFilename` and `instanceConfigFilename`, writing
`<slug>.json` **and** `<slug>.config.json`.

The remaining **113** are left deliberately. They are ~70 files of live
instructional prose — skills, guides, READMEs — and the worst-hit is
`cat-harness/skills/folio-core/directory-conventions.md` at 8, which is the
file `AGENTS.md` names as the source of truth for exactly this question. A
70-file rewrite is a scope decision, and each line needs the current-path /
history judgement that no regex makes reliably.

### The second Done-when, answered with evidence

> does the declaration-filename check extend to markdown, or is prose
> deliberately out of scope? *"A rename REWORDS prose"* is the existing
> argument for out-of-scope.

**That argument does not survive this measurement.** It holds when a rename
rewords prose — but #727 was a *reversal*, and a reversal does not reword
anything: it silently inverts what the existing words mean. 113 live path
claims went stale in one commit and nothing read them for ten days.

So: markdown should be checked, and it must **classify** rather than match a
string — the same three-way split `jijc` built for YAML in #747, since 23 of
the 158 are records and 4 are pipeline-owned translations. Not built here,
because a gate that fails on 113 findings reds the build on its first run; it
needs either a baseline (the `bean-bodies-baseline.json` precedent) or the 113
fixed first, and which comes first is the owner's call.

## Still to do

- [ ] The 113 current-path mentions of retired filenames, in ~70 files
- [ ] `check:declaration-filename` extended to markdown, classifying rather
      than matching — with a baseline, or after the 113
