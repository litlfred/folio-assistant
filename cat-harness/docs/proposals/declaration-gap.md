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

## Measured, 2026-09-23, on `7c4c7fd23`

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
one commit.

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
| `cat-harness/latex/` | 1 | 48K | `preamble.tex`, 830 lines, self-described as *"Shared LaTeX preamble for all papers in the folio"* | **nothing** |
| `cat-harness/computations/` | 1 | 8K | one `wall-violations.witness.json` | **nothing** — and two `fsh-guts/scripts/` documents already say so: *"Their subject is absent. `cat-harness/computations/` holds one file, a `.witness.json`, and no Python…"* |

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

## What would falsify this

- **If any of the four `remove` candidates is reachable from a workflow, a
  script or a published page that the reference scan missed**, it is not dead
  and the classification is wrong. The scan covered `*.ts`, `*.json`, `*.md`,
  `*.yml`, `*.yaml`, excluding the directory itself and the generated
  `docs-auto`/`docs/reference` trees. It did not cover `.tex` `\input`, shell,
  or HTML `src`/`href`.
- **If `litlfred/qou` does not already carry `blueprint/` and the LaTeX
  preamble**, then removing them here loses the only copy, and the move is to
  push them there first. This was not checked; it needs the other repository.
- **If the pass-through `skills/` parents turn out to be read by something that
  walks declarations one level deep**, they stop being a model question and
  become a real gap.

## What this does not do

No declaration is added by this proposal. No file is moved and none is deleted.
The one thing it changes on disk is itself.
