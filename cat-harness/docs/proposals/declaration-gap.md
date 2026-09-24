---
title: "Which top-level directories are not declared subgraphs?"
kind: proposal
issue: 1223
bean: folio-assistant-0uu2
summary: >-
  The first half of the owner's 2026-09-23 subgraph ruling, measured. 80 top-level directories across 17 instances; 62 declared; 18 not. Twelve of the 18 hold at least one file no declared directory covers, and one of those twelve (cat-harness/content, 718 files) is already another bean's. Outside it the entire remaining gap is 11 directories and 26 files. Each is classified declare / fold / remove / already-declared / not-mine, with the evidence for the classification. Three separate corrections to an earlier count are recorded, because the way that count went wrong is the same defect the ruling is about.
---

# Which top-level directories are not declared subgraphs?

Issue [#1223](https://github.com/litlfred/folio-assistant/issues/1223) · feature bean `0uu2` · parent epic `zzmr`.

The owner, 2026-09-23:

> bootstrap/ should be its own subgraph.... in fact QA: in harness `<stub>/*.*` should be a subgraph.

This proposal answers the **first** half: which top-level directories are not
declared, and what each should become. The second half — *"if sub1 depends
(directly or through chain) stub0, no references/context etc points stub0 →
sub1"* — is a separate question with its own session and is not touched here.

## Why an undeclared directory is a defect and not an untidiness

Discovery in this repository reads **declarations**, not the tree.
`resolveDirectories` walks the `directories` list an instance declares; nothing
walks `readdirSync` looking for graphs. So a directory that is not declared is
not part of the graph however many files sit in it — the `v8gh` property this
corpus already relies on everywhere else: **an undeclared file is one no
checker has a reason to look at.**

`dh4f` is its mirror: declared and absent, where a consumer scans nothing and
reports a clean run over it. That direction already has a gate —
`check:declared-dirs`, which also catches the quieter second case of an
`absent` exemption that outlived its cause. **Nothing gates this direction.**

## What the question has to be asked over, or the answer is wrong

Three framings of "undeclared" give three different answers, and only the third
is the defect.

1. **Top-level directories of the repository root.** Wrong: it counts the 16
   sibling instances as subdirectories of the root instance. They are instances
   in their own right, with their own declarations. This framing reported
   **38 directories holding 13,315 files** and every one of the sixteen was an
   artefact of the framing.
2. **Top-level directories of each instance, minus that instance's own
   `directories` list.** Better, and still wrong, for a reason worth writing
   down: a declaration entry may carry `scope: "repository"`, which resolves
   against the **repository** root rather than the declaring instance's root.
   Eight root-level directories are declared exactly this way — by
   `cat-harness`, not by the root instance — so joining each entry onto its
   declarer's root loses them. This framing reported 20, of which 8 were
   phantom.
3. **Files covered by no declared directory, wherever declared from.** This is
   the one that matches what a consumer actually does. A directory is only
   interesting here if something inside it is invisible.

Framing 2's error is the same shape as the one `check-declared-dirs.ts` records
in its own header, where a first measurement joined repo-scoped paths onto the
instance root and reported ten phantom absences out of 35. It is an easy error
to make twice, which is the argument for `resolveDeclaredPath` being exported
and named.

## Measured, 2026-09-23, on `7c4c7fd23`, and re-measured after merging `main`

Instances discovered with `instanceRootsIn`, never by globbing — a path literal
is what `check:declared-paths` refuses, and one written earlier was silently
missing six nodes (64 → 70 once resolved properly).

```
instances discovered:                        17
top-level directories across them:           80
covered by a declared subgraph:              62
undeclared as a directory:                   18
  ...of which hold zero uncovered files:      6
DIRECTORIES HOLDING UNCOVERED FILES:         12   (744 files)
  ...of which is cat-harness/content:         1   (718 files — bean ylj7)
THE REMAINING GAP:                           11   (26 files)
```

Re-derive rather than quoting; these move, and this document is a claim about
one commit. They moved during the writing of it: after merging `origin/main` and
removing the three QOU directories below, the same script reports **82 top-level
directories, 72 fully covered, 9 holding an uncovered file** (excluding the
gitignored `node_modules/`) — `cat-harness/content` plus **8 directories holding
22 files**. `main` declared several `<instance>/skills/` and `library/`
directories in the interval, which is also how the double-declaration below came
into view.

### Three corrections, and why they are in the proposal rather than a footnote

An earlier pass reported **19 directories holding 1,731 files**. Each of the
three ways that was wrong is an instance of the thing being fixed.

**One — repository-scoped entries were read as undeclared.** `memory/` (44
files), `fsh-guts/` (27), `issue-marks/` (2) and root `docs/` were all reported
as gaps. All four are declared, by `cat-harness`, with `scope: "repository"`:

| directory | id | graph kinds | declared by |
|---|---|---|---|
| `beans/` | `beans` | `beans` | cat-harness |
| `todos/` | `todos` | `todos` | cat-harness |
| `memory/` | `memory` | `memory`, `waiver` | cat-harness |
| `interaction/` | `interaction` | `interaction` | cat-harness |
| `issue-marks/` | `issue-marks` | `issue-marks` | cat-harness |
| `fsh-guts/` | `fsh-guts` | `fsh-guts` | cat-harness |
| `docs/` | `root-docs` | `docs` | cat-harness |
| `smart-kg/methodologies` | `smart-kg-methodologies` | `methodology` | cat-harness |

This also settles a question that was posed as open: whether **self-declaration**
in a directory's own `<name>.json` is sufficient, or whether the parent must
also list it. The question is moot as asked, because the parent already does.
`beans/beans.json` and the `beans` entry above are not competing answers and
neither is redundant — the repository-scoped entry says *this directory is part
of the graph*, and `beans/beans.json` says *these are its internal nodes*
(`defs/`, `workflows/`). One fact, one place, at each of two levels. The same
holds for `todos/` and `interaction/`.

**Two — `issue-marks` and `fsh-guts` were reported as undeclared while their
graph KINDS were already registered.** Both are in
`schemas/graph-kind-registry.ts`. A registered kind with no declaring directory
would have been a genuine and sharper finding than the one reported; the
registry is where to look before concluding that a directory has no model.

**Three — the headline arithmetic disagreed with its own table.** The prose said
19; the table beneath it listed 17 rows. 19 came from subtracting 3
self-declaring directories from 22, where 22 still included `_kg/` and
`test-results/` — the two the same paragraph had just excluded as gitignored.
The table was right. This is precisely the failure `bpmn-processes` names when
it says **count the directory rather than quoting a number from this paragraph**,
and the reason no count in this document is written without the command that
produced it.

### Six directories that are undeclared and hold nothing uncovered

These are pass-through containers: every file inside is covered by a declared
child.

| directory | files | the declared child that covers them |
|---|---|---|
| `folio-assistant-core/skills/` | 36 | `skills/voices` |
| `who-style-guide/skills/` | 6 | `skills/voices` |
| `folio-assistant-sci/skills/` | 2 | `skills/voices` |
| `smart-base/skills/` | 2 | `skills/voices` |
| `agent-skills/skills/` | 1 | `skills/voices` |
| `smart-kg/` | 1 | `smart-kg/methodologies` |

In all six the parent holds **no files of its own** — `folio-assistant-core/skills/`
contains exactly one entry, `voices/`, and nothing else. They are therefore not
the `v8gh` defect: no file is invisible. Whether the ruling nonetheless wants a
declaration on the parent is a real question, but it is a question about the
*model*, not about a gap, and it is the one question in this document that five
instances would answer identically. It is listed separately for that reason.

## The split

### not mine — 1 directory, 718 files

**`cat-harness/content/`.** Bean `ylj7` found 304 `.ts` there accounted for by
nothing and deferred it explicitly, with the reason recorded: the directory
holds `content/pipeline/` (core's subject) beside `content/docs/` (folio
content), so declaring it needs the repo-partition split settled first.
Declaring it now would either give one directory two kinds or pre-empt a
boundary `scripts/repo-partition.ts` exists to enforce. Left alone.

`folio-assistant-sci/content/` (1 file, `pipeline/qa-checkers-cost.ts`) is the
same question one instance along and travels with it.

### declare — 4 directories, 13 files

Real content, actively referenced, belongs in the graph.

| directory | files | evidence it is live | proposed kind |
|---|---|---|---|
| `cat-harness/ns/` | 1 | copied into `_site/ns/content/v1.jsonld` by `docs-site.yml` and `feature-staging.yml`; watched by `jsonld-gen-check.yml`; **8 commits, last 2026-09-23** | needs a decision — see below |
| `cat-harness/ui/` | 5 | the Folio Assistant SPA; shipped in `package.json` `files`; three assertions in `test-server.e2e.ts` | `code` |
| `cat-harness/deploy/` | 6 | `deploy-access.json` capability detects on `cat-harness/deploy/.env` | `code` |
| `tools/` (root) | 1 | the Tool barrel; imported by five modules (`check-tools`, `kg-export`, `harness-schema-export`, `tool-coverage`, the MCP projection); in `tsconfig.json` `include` | `code` |

`cat-harness/ns/` is the one that needs thought rather than a row. It holds the
JSON-LD `@context` the whole graph is published against — which is not code,
not a folio, and not a skill. Issue #1078 and bean `ovkk` are both about that
file's contents disagreeing with the graph. Whatever kind it gets must decide
`renderable` and `holds`, and both are required, so a kind that has not decided
does not compile. Registering a kind for a single file is exactly the ceremony
§3.1 of `instance-versioning.md` objected to — but this file is served at a
public URL and validated by CI, which is a reader, so the objection does not
land here.

### fold — 1 directory, 2 files

**`cat-harness/types/`** — `bpmn-moddle.d.ts` and `dmn-moddle.d.ts`, ambient
module declarations for two untyped dependencies. They are already named by
`tsconfig.json` (`cat-harness/types/**/*.d.ts`), so the compiler finds them and
no discovery is involved. Folding them into `cat-harness/src/` puts them inside
an already-declared `code` directory and removes a tsconfig entry. Declaring
them instead would be a graph of two ambient declarations that nothing
traverses.

### remove — 4 directories, 9 files, 528K

**Nothing here is deleted by this proposal.** `deletion-requires-confirmation`
governs: sizes and ages are reported, and the owner decides. All four are QOU
folio content that the 2026-09-20 partition moved into the platform stub — which
`AGENTS.md`'s own banner forbids in as many words: *"folio-assistant is the
platform, not the content. … If you are about to write subject matter here … you
are either in the wrong repo."*

| directory | files | size | content | referenced by |
|---|---|---|---|---|
| `cat-harness/blueprint/` | 4 | 72K | the QOU formalization blueprint. `src/content.tex` is 1,192 lines of `\begin{definition}[Frobenius–Hopf Data]` with `\lean{QOU.FrobeniusHopfData}` refs; `web.tex` titles itself *"Quantum Observable Universe — Formalization Blueprint"* | **nothing** |
| `cat-harness/home_page/` | 2 | 12K | a Jekyll site root with `baseurl: "/qou"`, `title: "litlfred's Papers"`, and a table linking one paper | **nothing** |
| `cat-harness/latex/` | 1 | 48K | `preamble.tex`, 830 lines, self-described as *"Shared LaTeX preamble for all papers in the folio"* | four workflow steps and a skill — **by a path that does not resolve**; see below |
| `cat-harness/computations/` | 1 | 8K | one `wall-violations.witness.json` | `wall-violations-sweep.ts` — **by a path that does not resolve**; see below. Two `fsh-guts/scripts/` documents already note the directory: *"Their subject is absent. `cat-harness/computations/` holds one file, a `.witness.json`, and no Python…"* |

On **age**, honestly: this clone's history begins 2026-09-19 (2,601 commits in
four days), and the 2026-09-20 partition `git mv`'d these into `cat-harness/`,
so every one shows a single commit and a first-seen date that is the move, not
the origin. What can be said is narrower and is the part that matters: **none of
the four has changed since the partition**, and `git log --follow` on
`blueprint/src/content.tex` reaches the shallow boundary without finding an edit.
True ages need a full clone.

`cat-harness/computations/` is also named in AGENTS.md as the reason the
`witness-refresh` workflow fails by design here — *"the second needs
`folio-assistant/computations/`, and the platform carries no folio."* That is
about the folio-side path, but it is the same observation: the witness belongs
where the computations are, and they are not here.

### the sharp one — 1 directory, 2 files, 396K

**`cat-harness/viewer/`** does not fit any of the four, and is the decision this
proposal most wants a person for.

- Its `package.json` reads `"name": "qou-viewer"`, `"description": "Pure SPA
  viewer for QOU content objects."`
- `index.html` is 7,973 lines and hardcodes `'quantum-observable-universe'` as
  the fallback paper id in four places, and downloads `qou-latex-source.sh`.
- **And it is live**: `test-server.e2e.ts` asserts `/cat-harness/viewer/` serves,
  and bean `1dfh` cites it as the implementation of *"a viewer over it"*.

So it is simultaneously folio-specific content in the platform repo *and* a
tested platform artefact. It is the largest single directory in the gap by bytes
and the only one where `declare`, `fold` and `remove` are all defensible. It is
plausibly the pre-split ancestor of `cat-harness/ui/`, which is the same kind of
thing with none of the QOU hardcoding — but that is a guess, and this proposal
does not act on guesses.

### Corrected: two of the four ARE referenced — by paths that cannot reach them

A first sweep of this document searched for the literal prefixes
`cat-harness/latex/` and `cat-harness/computations/` and reported both as
referenced by nothing. That was wrong, and the way it was wrong is the same
mistake the measurement section already records once: **searching for the path
a file is at rather than the path a consumer writes.**

- `--preamble ../latex/preamble.tex` appears in `lean_ci.yml`, `publish.yml`,
  `blueprint.yml` and `lean-build.yml`, and in
  `skills/folio-core/docs-generation.md`.
- `folio-assistant/computations/wall-violations.witness.json` is the default
  output path in `content/pipeline/wall-violations-sweep.ts`.

Neither resolves. The four workflow steps carry no `working-directory`, so they
run at the repository root, where `../latex/preamble.tex` points **above the
checkout** — and the file is at `cat-harness/latex/preamble.tex`. The witness
path names `folio-assistant/computations/`, and the file is at
`cat-harness/computations/`. Both are the folio-side layout, left behind by the
2026-09-20 partition; AGENTS.md already records the same shape for
`witness-refresh`, which *"needs `folio-assistant/computations/`, and the
platform carries no folio."*

So the finding is sharper than "unreferenced": these are files no consumer
scans (`v8gh`) named by consumers that scan nothing and report a clean run
(`dh4f`) — **both defects over one pair of files**. The workflow step is
`continue-on-error: true` and guarded by `if [ ! -d content ]`, so nothing ever
went red over it.

Fixing those five dangling references is **not** part of this proposal. They are
qou-shaped invocations in a repository that carries no folio, and they are
listed here so the next reader does not rediscover them.

## Verified against `litlfred/qou`, 2026-09-24

The owner chose: check that `litlfred/qou` already holds each removal candidate,
and remove only what it does. Checked against qou's default branch `main`
(`7aafd8dbe`) and its `gh-pages` branch. qou carries 6,443 branches, so this is
a claim about those two and not about all of them.

| candidate | in `litlfred/qou`? | verdict |
|---|---|---|
| `cat-harness/computations/wall-violations.witness.json` | **yes**, at the same relative path, `computations/wall-violations.witness.json` | **removed** |
| `cat-harness/latex/preamble.tex` | **yes**, as `qou/main.tex` — 811 of its 830 lines are common | **removed** |
| `cat-harness/blueprint/` | **no** — no `blueprint/` on `main` or `gh-pages` | **held** — pushed to qou as [qou#7453](https://github.com/litlfred/qou/pull/7453); removed here once that merges |
| `cat-harness/home_page/` | **no** — qou holds no `_config.yml` at all | **held**, like `blueprint/` — removed here only once qou has it. Reversed once; see below |

Two of the four are not a matter of degree, and both are worth stating exactly.

**The witness is not a duplicate; it is a zero-run.** qou's copy was computed
`2026-05-02` and reports `fileCount: 9, totalHits: 20`. The folio-assistant copy
is *later* — `2026-08-08` — and reports `fileCount: 0, totalHits: 0`, with every
category zeroed. It is the sweep run in the platform repo against the folio that
is not there. Nothing is lost by removing it and the real one is in qou.

**The preamble in this repository is the SUPERSEDED one, and the divergence is
a mathematical correctness fix.** qou's `main.tex` removed a block of 16 macros
on 2026-08-22 and replaced it with a comment saying why, which is still there:

> This block defined 16 macros whose names are author typos — a control
> sequence written without the space that separates it from the next token
> (`\pi c_s` → `\pic_s`, `\xi Z` → `\xiZ`, `\lambda L` → `\lambdaL`). Defining
> the glued name makes the page compile, and that is the problem: it converts a
> loud failure into silently-wrong printed mathematics. Two did exactly that.
> `\pic` expanded to `\pi`, so `2\pic_s` printed `2\pi_s` and the sound speed
> vanished from a Hawking-temperature denominator … Every source site is fixed;
> **do not restore these.**

`cat-harness/latex/preamble.tex` still defines all sixteen. It is not a spare
copy of a live file; it is the version qou deliberately reverted, sitting in a
repository whose own banner says it should hold no folio content. Keeping it is
the standing risk that something restores it.

### `blueprint/` goes to qou; `home_page/` goes

The owner's second decision, 2026-09-24: push the blueprint to the folio
repository that owns it, and drop the site index.

**`blueprint/` is not stale, and the first measurement of it here was wrong.**
`content.tex` carries 128 distinct `\lean{QOU.*}` references. A first pass
searched for the fully-qualified string — `QOU.Boson` — against qou's 3,971
`.lean` files and found 33, which would have argued for discarding the file.
That was a defect in the search: **Lean writes `namespace QOU` and then the
unqualified declaration**, so the qualified form never appears in source.
Matched by bare declaration name after a declaration keyword:

```
resolve to a live declaration in qou:   111 / 128   (87%)
do not resolve:                          17
```

Read 111 as an **upper bound**, not a verification — it is a name match, so two
declarations sharing a name in different namespaces both count, and only the
elaborator could say whether a reference binds to the object the blueprint
means. That caveat travels with the file: it is in the imported README and in
the PR.

This is the third measurement in this document to come out wrong on a first
pass and be corrected on a second, and all three failed the same way — **asking
about the string a path or a name is written as, rather than the string a
consumer writes.** The repository-scope join, the `../latex/preamble.tex`
reference, and this. That is the finding under the finding.

One more thing settles the direction. `web.tex` and `print.tex` both
`\bibliography{../../references}`, which from `blueprint/src/` is the
repository root. **qou has `references.bib` there; folio-assistant has none
anywhere.** The blueprint's own relative paths resolve in the folio repository
and do not resolve here — it was written for that checkout.

So it is imported rather than deleted: [qou#7452](https://github.com/litlfred/qou/issues/7452),
[qou#7453](https://github.com/litlfred/qou/pull/7453). `cat-harness/blueprint/`
stays here until that PR merges, and is removed in a follow-up rather than in
this one — deleting the only copy on the strength of an unmerged PR is the
thing `deletion-requires-confirmation` exists to prevent.

**`home_page/` was removed, and that was reversed.** Two files: a Jekyll
`_config.yml` with `baseurl: "/qou"` and an `index.md` linking to `papers/…`,
`blueprint/` and `blueprint.pdf`. Checked against qou's `gh-pages`, which is the
site those links would have to land on: it carries `papers/`, and it carries
**no `blueprint/` and no `blueprint.pdf`**. The page indexes a site missing two
of the three things it points at, in a repository that does not publish it — so
the first decision was to drop it rather than push it anywhere.

That was overruled, and the reason given is the one that governs both
directories rather than just one: **qou does not have these files, so removing
them here loses them.** It applies to `home_page/` exactly as to `blueprint/`.
The dead links are an argument about the file's *value*, which is a question for
whoever reviews it in qou; they are not an argument for destroying the only
copy, which is a question about *reversibility*, and the two were being
conflated.

So `home_page/` is restored and travels with `blueprint/`: it leaves this
repository once qou has it and **that has been confirmed**, not merely opened as
a PR. Restoring cost nothing and the end state is identical under either
reading — both have the directory gone from here — so the ordering was the whole
disagreement, and the safer order wins.

**One thing the qou reviewer should know before deciding where it lands**: those
two dead links. `index.md` points at `blueprint/` and `blueprint.pdf`, and
neither is published on qou's `gh-pages` today. Importing the page does not make
them resolve. It is carried here rather than buried, because a page whose links
do not resolve is a different artefact from one whose links do, and the person
choosing its home should be choosing with that in front of them.

## The mirror defect: 15 paths are declared TWICE, and the gate counts them as 15 extra directories

A sibling session working the same ruling flagged one double declaration and
suggested counting the rest was worth more than the files still uncovered. It
was. Measured on this branch:

```
declared directory ENTRIES:                                      91
distinct PATHS declared:                                         76
paths carrying more than one entry:                              15
  ...sharing ONE id, so the by-id override collapses them:        4
  ...with DIFFERENT ids on the same path:                        11
```

**`bun run check:declared-dirs` reports `91 declared director(ies) across 17
instance(s) … 0 finding(s)`.** Seventy-six directories exist. The gate that
guards the declaration layer counts fifteen of them twice and calls the result
clean, because the only question it asks is whether each declared path is on
disk — and a path declared twice is on disk twice over.

Every one of the fifteen has the same shape: **`cat-harness` declares the
directory with `scope: "repository"`, and the instance that owns it declares it
too**, at instance scope.

| path | cat-harness's id | the owner's id |
|---|---|---|
| `agent-skills/library` | `agent-skills-library` | `library` |
| `who-iris/library` | `who-iris-library` | `library` |
| `folio-assistant-sci/library` | `folio-assistant-sci-library` | `library` |
| `folio-assistant-core/library` | `folio-assistant-core-library` | `core-library` |
| `smart-base/library` | `smart-base-library` | `library` |
| `smart-base/methodologies` | `smart-base-methodologies` | `methodologies` |
| `smart-base/methodologies/processes` | `smart-base-processes` | `processes` |
| `folio-assistant-core/methodologies` | `folio-assistant-core-methodologies` | `core-methodologies` |
| `folio-assistant-core/skills` | `folio-assistant-core-skills` | `core-skills` |
| `folio-assistant-core/schemas` | `folio-assist-core-schemas` | `core-schemas` |
| `folio-assistant-core/processes` | `folio-assistant-core-processes` | `core-processes` |

**Why the differing id is the whole problem, and not a cosmetic one.** AGENTS.md
states the resolution rule: *"Overrides match on the entry's `id`, not its
`path` — matching on path makes two knowledge graphs out of one relocation, and
every consumer then scans a directory that is not there."* That rule is right,
and it is exactly what makes these eleven bite: **two entries with different ids
over one path are not one entry overriding another. They are two graphs.** A
consumer that fans out over instances resolves both and scans the directory
twice.

The remaining four — `bootstrap-tools/schemas`, `large-datasets/skills`,
`who-iris/skills`, `large-datasets/schemas` — carry the **same** id on both
sides, so the by-id override does collapse them to one. They are duplicates in
the file and not in the resolved set. That distinction is the finding: the same
surface shape has two very different consequences, and only the id says which.

`directory-conventions` permits an unavoidable duplicate and refuses an
unchecked one. These are unchecked: nothing reports them, and the gate nearest
to them reports a count that already includes them.

**Not fixed here**, because the fix is a decision and not an edit. Deleting
cat-harness's repository-scoped copy is the obvious move and it is not
obviously right: those entries are what let the root instance see a sibling's
directories without depending on it, which is the same mechanism that correctly
declares `beans/`, `memory/` and `issue-marks/`. Whether the duplicate should be
removed, or the ids reconciled so the override collapses them, or the checker
taught to report a path with two entries, is one question with three answers and
it belongs to whoever owns the declaration schema.

## Coordination — a sibling session declared three of these

Branch `claude/declare-three-subgraphs-clean`, commit `675ffa4f8`, pushed and
not merged at the time of writing, declares `cat-harness/deploy/`,
`cat-harness/ui/` and `cat-harness/blueprint/` as `graphKinds: ["code"]`. It
reached the `scope: "repository"` correction independently, which is worth
recording: two sessions measuring the same thing found the same bug, so it is a
property of the model rather than of one agent's carelessness.

Two things need saying across that boundary.

**`blueprint/` should not be declared, because it is leaving.** It is imported
to [qou#7453](https://github.com/litlfred/qou/pull/7453) and removed here once
that merges. Declaring a directory that is about to be deleted mints the `dh4f`
defect the same commit's message cites — declared and absent, every consumer
scanning nothing and reporting clean. `deploy/` and `ui/` are unaffected and
their reasoning holds; only the third entry conflicts.

**The two preambles are not two copies of one file, and the question that
blocked `latex/` has an answer.** That commit recorded the open question
faithfully — `blueprint/src/preamble.tex` is 26 lines, `latex/preamble.tex` is
830, they differ, nothing says which is live — and deliberately left `latex/`
undeclared so it stayed visible. Measured:

- `blueprint/src/preamble.tex` is the **blueprint's own** preamble. `web.tex`
  and `print.tex` each `\input{preamble}`, resolving to the sibling in
  `blueprint/src/`.
- `latex/preamble.tex` is the **shared paper** preamble, self-described as such,
  and it is `qou/main.tex` — 811 of its 830 lines in common.

They share a basename and nothing else: one is 26 lines of blueprint setup, the
other 830 lines of document-class, packages and macros. Both were live, for
different documents. `latex/` is now removed rather than declared, because qou
holds the newer and corrected copy.

## What would falsify this

- **If any of the four `remove` candidates is reachable from a workflow, a
  script or a published page that the reference scan missed**, it is not dead
  and the classification is wrong. The scan covered `*.ts`, `*.json`, `*.md`,
  `*.yml`, `*.yaml`, excluding the directory itself and the generated
  `docs-auto`/`docs/reference` trees. It did not cover `.tex` `\input`, shell,
  or HTML `src`/`href`.
- **Checked, and it decided two of the four**: qou carries the witness and the
  preamble and does not carry `blueprint/` or `home_page/`. The check covered
  qou's `main` and `gh-pages` only; it holds 6,443 branches and one of them
  could carry either.
- **If the pass-through `skills/` parents turn out to be read by something that
  walks declarations one level deep**, they stop being a model question and
  become a real gap.

## What this does not do

No declaration is added by this proposal. No file is moved and none is deleted.
The one thing it changes on disk is itself.
