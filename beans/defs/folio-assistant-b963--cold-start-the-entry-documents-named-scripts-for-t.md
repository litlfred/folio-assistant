---
# folio-assistant-b963
title: 'COLD START: the entry documents named scripts/ for the whole split, and nothing checks a command path'
status: in-progress
type: bug
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T21:55:00Z
parent: folio-assistant-ahvw
---

## The register — the shapes have NAMES, not numbers

*2026-09-20T23:1xZ, on the owner's instruction ("2 resolve").*

The ordinals collided: this bean numbered **shapes** in discovery order, while
`7iog` called itself "a fourth class beyond `b963`'s three" — numbering
something else entirely, the **readers** `check:command-paths` had at the
time. Two incompatible schemes, one word. And by the time anyone noticed,
this bean's own list had reached six, so `7iog`'s "the three known classes"
was stale as well.

Both were **counts in prose**, which this repository already refuses as
evidence everywhere else. An ordinal is a count that rots the moment a
seventh arrives, and renumbering breaks every commit and sibling bean that
cites it. So the shapes are named, and the names do not move:

| name | where the literal hides | reader |
|---|---|---|
| `fenced-command` | a fenced block in prose — `AGENTS.md`, docs | `check:command-paths` (`checkFile`) |
| `hook-command` | a JSON `command` field — `.claude/settings.json` | `check:command-paths` (`checkHooks`) |
| `printed-command` | a string a script prints for a human to run | `check:command-paths` (`checkPrintedCommands`) |
| `re-rooted-ascent` | a relative ascent whose anchor moved under it | **none** — not decidable; `check:anchor-names` ships the decidable neighbour |
| `interpolated-command` | verb and path split by an interpolation (`bun run ${SELF}`) | **none** |
| `declared-manifest-path` | `main` / `exports` / `files` in a JSON manifest | **none** |
| `execution-context` (`7iog`) | resolves in the repo; consumed where the repo is not | `check:workflow-paths` |

`execution-context` is a **peer**, not a seventh instalment of this bean: the
others are all *the literal is stale*, and that one is *the literal is fine
and the frame is wrong*. It has its own bean and its own reader, and naming
it stops the two being merged by a later reader who sees only the number.

Ordinals below are left as they were WRITTEN, with the name beside them.
Rewriting dated entries would be editing the record rather than correcting
it; the register is what a reader should navigate by.


Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
`AGENTS.md` line 3 (the cold-start line every agent runs first), lines 192 and 351, `README.md` lines 4 and 371, and `cat-harness/docs/guides/agent-onboarding.md` lines 96–97 named `scripts/install-beans.sh`, `scripts/beans-fallback.ts`, `scripts/gen-schema-docs.ts` and `scripts/gen-skill-docs.ts`. There is no root `scripts/`; all four live under `cat-harness/scripts/` since the split. `bash scripts/install-beans.sh` fails with "No such file or directory", so a fresh container following the first instruction it reads gets no work-plan CLI. Nine occurrences, repointed on branch `claude/sharp-fermi-xvs06i`.

## The gap
`check:agents-claims` reads LOCATION claims of the shape `symbol` in `module.ts` and ABSENCE claims; `check:agent-entry-links` reads links. Neither reads a **command line**, so a path inside a fenced command can rot silently. AGENTS.md itself records the same defect for the two generator commands "until 2026-09-20" — it was fixed in one file and not in the other two.

## Done when
- [x] A check reads every fenced command in the entry documents (AGENTS.md, README.md, the onboarding guide) and fails when a path in it does not resolve
- [x] The nine occurrences are confirmed repointed on main

*Ticked IN PLACE 2026-09-21, not appended below.* This bean carried its own
`shadow-checklist` defect — three ticked copies further down while these two
read open, so the section every reader and tool consults said the work had not
started. `check:command-paths` shipped in #604 and is in the gate set; it
passes on main over every fenced command, printed command and hook, which is
the confirmation the second item asks for and is stronger than a count of nine.
The later copies stay where they are: they are dated entries and rewriting them
would edit the record rather than correct it.

---

_2026-09-20T19:30Z_ — **Done-when 1 landed** (PR #589, issue #588).
`bun run check:command-paths` reads every fenced command in the entry documents
and every skill, and fails when a repository-relative path in one does not
resolve. Wired into `code-quality-gates.yml`.

**The nine were not all of them.** Sweeping with the check found **seven more**,
every one in text a link checker structurally cannot see:

| where | was |
|---|---|
| `session-start-coord-sweep.sh` ×4 | `scripts/install-beans.sh`, `scripts/beans-fallback.ts`, `scripts/harness-dirs.ts` — printed for an agent to copy, in the file every session runs first |
| `AGENTS.md` §Commands ×2 | `bun run src/index.ts --http`, `bun run src/index.ts --check-deps` |
| `README.md` | `bun run src/index.ts --stdio` |
| `agent-onboarding.md` ×2 | `scripts/session-start-coord-sweep.sh`, `bun run src/index.ts --check-deps` |

That is this bean's own argument, measured: *"it was fixed in one file and not
in the other two, because nothing swept."*

**Two corpora, different verdicts, and the distinction is the design.** An
entry document is about THIS repository by definition, so every
repository-relative path in it must resolve. A skill may be about a FOLIO —
`bun run content/pipeline/qa-sweep.ts` is correct in a folio and unresolvable
in a platform that carries no content, which is this repository's first banner.
So in a skill a path is judged only when it CLAIMS to be about this tree: its
first segment is a directory that exists at the root, or it is a bare
root-level markdown document (the `z9eb` case). The rest is **counted** as
folio-relative — 150 of them — rather than passing silently.

Exemptions carry a required reason (`<!-- command-path-ok: … -->`) and are
counted, same shape as `declared-path-literal:`. Four exist, all real: a probe
whose answer IS whether the directory is there, and three blocks that run
inside a folio.

**The falsifier was run.** Reintroducing `scripts/install-beans.sh` into
AGENTS.md line 353 fails the check with exit 1; removing it passes. 18 unit
tests, each one a false positive the first draft produced over this corpus.

- [x] A check reads every fenced command in the entry documents (AGENTS.md, README.md, the onboarding guide) and fails when a path in it does not resolve
- [ ] The nine occurrences are confirmed repointed on main — #579 is not merged yet

_2026-09-20T20:40Z_ — **A third class — `printed-command` — found by CI going red.** The count is
now nine plus **thirteen**.

`docs:harness:check` failed on this branch and its own failure message read
*"Run `bun run scripts/sync-docs-harness.ts`"* — the message CI prints while
failing, telling a reader to run a path that does not exist. `gen-schema-docs.ts`
writes the same shape into the banner of every generated schema page.

**Neither is reachable by `check:command-paths`**, and that is the finding
rather than an oversight: they are **path literals inside strings the program
PRINTS**, not fenced blocks and not markdown. Three classes now, each invisible
to the checks that cover the others:

| class | example | read by |
|---|---|---|
| a fenced command in a document | `AGENTS.md` line 3 | `check:command-paths` |
| a `command` field in JSON config | the `SessionStart` hook | `check:command-paths` (hook reader) |
| **a path inside a printed string** | `Run \`bun run scripts/x.ts\`` | **nothing** |

The third wants its own reader and is deliberately not bolted onto this one: a
`.ts` string literal is `check:declared-paths`' corpus, which already walks
every literal in the tree and has a 509-entry unaccounted baseline. The
question there is not *does this path resolve* but *is this literal a COMMAND
somebody will type*, and answering it needs the surrounding string, not the
token. Left as a distinct piece of work rather than guessed at.

**And the reason it reached CI at all is worth more than the fix.** This session
ran `bun test`, `eslint`, `typecheck` and a dozen named `check:*` scripts and
called that green. `bun run gates` runs sixty-eight, and it was **not in
AGENTS.md's Commands block** — so the subset was chosen from memory. Added
there, with the measurement: a subset of the gate set is not the gate set.

_2026-09-20T20:20Z_ — **`printed-command` has a reader, and it found 237.**
`checkPrintedCommands` in `check-command-paths.ts`, run over every `.ts` and
`.sh` under the instance.

**Two signals, and the second is the one that makes it decidable.** A **runner
verb** (`bun run`, `bunx`, `bash`, `npx`, `python3`, `deno run`) separates a
command from a cross-reference: `scripts/x.ts` appears both ways in this source
and only one is wrong. Then the path must **resolve under an instance but not
from the repository root** — that is not "might be wrong", it is wrong *with a
known fix*, so the finding names it.

**Two defects in the first draft, both instructive.** It reused `aboutThisTree`,
which judges a path only when its first segment exists at the repository root —
and `scripts/` does not, *which is this bean's entire defect*. The check
declined the one case it was written for: **43 checked where a hand grep found
370**. And `node` and `sh` were in the verb list; they are ordinary words here
("node" is in nearly every graph module) and matched prose — four findings, all
four false. A verb that is also English is not a signal. Both are tests now.

Instance roots are **discovered** as the directories carrying their own
`harness.json`, never listed: a hardcoded list would rot on the next split,
which would be a poor joke in this check.

## The 237, and why they are HELD rather than failed

| first segment | n |
|---|---|
| `scripts/` | 123 |
| `content/` | 109 |
| `src/`, `library/`, `docs/` | 5 |

The two groups may not be the same defect. `scripts/` has no meaning in a folio
— `init-folio` scaffolds `content/`, `uploads/`, `library/` and never
`scripts/` — so those commands can only mean this repository's and are broken
from the root. `content/pipeline/…` is a **folio's** layout and those commands
are correct where they are meant to run; the onboarding guide already carries
three such blocks marked *"run IN A FOLIO"*.

**Neither name is declared in any `harness.json`**, so the declarations do not
settle it. Put to the owner with the counts; **held** in the meantime — a third
state that is neither a baseline (which asserts "accepted") nor a pass, printed
in full every run and excluded from the exit code. Collapsing it into either
would be deciding the question by default.

## Done when

- [x] A check reads every fenced command in the entry documents and fails when a path in it does not resolve
- [x] A reader covers `command` fields in `.claude/settings.json`
- [x] A reader covers printed commands and module-header usage lines
- [x] The 237 held findings get their verdict, and the `scripts/` group is repointed
- [ ] **The basis is tightened.** The `scripts/`-versus-`content/` distinction rests on the folio LAYOUT rather than on a declaration, which is weaker than this repository's usual standard. Stated rather than dressed up.

_2026-09-20T20:45Z_ — **Verdict: fail on `scripts/`, count `content/`** (the
owner, 2026-09-20). The 237 split 127 / 110 under it.

**127 repointed** across 52 files — 123 `scripts/`, 3 `src/`, 1 `docs/`. Applied
from the check's own findings, each of which already carried its fix, with a
negative-lookbehind guard so an already-correct `cat-harness/scripts/…` could
not become `cat-harness/cat-harness/…`. **110 counted**: 109 `content/`, 1
`library/`.

`FOLIO_OWNED` encodes the verdict: `folio`, `content`, `uploads`, `library`,
`lean`, `.lake`. `init-folio` writes the first, third and fourth — read from
the scaffolder, not from prose. `content/` because a folio may declare its
content root there and `qou` does; `lean/` and `.lake/` because the paper
adapter puts proofs and build output there.

## And the scaffolder was handing the defect to every new folio

Found while establishing that basis. `init-folio` wrote `${assistant}/src/index.ts`,
`${assistant}/scripts/session-start-coord-sweep.sh` and `${assistant}/viewer` —
**nine sites**, every one correct before the split and none after it, because
the code moved under `cat-harness/` while `assistant` still names the CHECKOUT
root.

**Two of the nine are the new folio's `.mcp.json` and its `SessionStart` hook.**
So every folio scaffolded since the split got an MCP server that cannot start
and a hook that silently does nothing — the same defect that had killed this
repository's own session-start sweep, reproduced in the one place that hands it
to every downstream repository at once.

Fixed through a single `HARNESS_SUBDIR` constant and a `platformDir()` helper,
for the reason `AGENTS.md` gives for the builder shim: the path to the platform
is a fact with one home, so the next relocation is a one-line edit rather than
a nine-site sweep that misses two.

**Count so far: nine, plus thirteen, plus 127, plus nine.**

## Still open

- [ ] **The basis is a LAYOUT, not a declaration.** No `harness.json` separates
      `scripts/` from `content/`, which is why the question went to the owner
      rather than being decided here. Disclosed on `FOLIO_OWNED` and guarded by
      a test that asserts the disclosure itself, so a later session that derives
      the set from a declaration has to update the note too.

_2026-09-20T20:50Z_ — **A fourth class — `re-rooted-ascent` — and the test fixture was hiding it.**

Fixing `init-folio` turned two of its tests red, and the tests were wrong
rather than the fix. `PLATFORM` read `resolve(import.meta.dir, "../..")`, which
was the REPOSITORY root while those tests lived at `scripts/tests/` and
silently became the `cat-harness/` directory when they moved to
`cat-harness/scripts/tests/`. The suite went on passing — **by modelling a
layout that no longer exists**, and so asserting that the scaffolder should
keep emitting the pre-split paths.

That is the same rot in its most dangerous form: **a path inside a test
fixture**, where a green suite is the evidence everybody trusts. A fenced-block
reader cannot see it, a printed-string reader cannot see it, and the test that
would notice is the one that broke.

Also found: `README.md`'s scaffold command, `bun run
folio-assistant/scripts/init-folio.ts`. A folio runs `git submodule add
…/folio-assistant.git folio-assistant`, so the linked directory is the
repository root and the script is at `folio-assistant/cat-harness/scripts/`.
**It was inside a `command-path-ok:` exemption this session added earlier** —
the exemption was correct that the block runs in a folio, and wrong to imply
the path was therefore fine. An exemption suppresses the check, not the defect.

**Running total: nine, plus thirteen, plus 127, plus nine, plus two.**

- [x] `re-rooted-ascent` was ATTEMPTED and the direct check is **not decidable**
      by the means available. Three designs measured and falsified — see below.
      `check:anchor-names` ships the decidable neighbour instead.
- [ ] A reader that catches a re-rooted ascent itself, by comparing it against
      what the fixture then DOES with the value. Deferred with evidence, not
      with a shrug.

_2026-09-20T21:00Z_ — **The check had the defect it exists for, in its own
corpus.** `sourceFiles` listed `cat-harness/{scripts,src,content,schemas}`. A
merge from `main` brought a `who-iris/` instance with its own `scripts/`, and
the check walked straight past it — a hardcoded list going stale *inside the
check whose whole subject is hardcoded paths going stale*.

Now derived from `instanceRoots()`, which the module already computes for the
other half of its rule. **824 files instead of 811, and 0 new findings**, so
the widening cost nothing and the other instances are clean. A test asserts a
new instance is picked up without anyone editing this file.

Noticed because the `stage` job went red on a stale base: the merge that fixed
it is what brought the instance in. Worth recording that the finding came from
handling an unrelated failure rather than from looking for it.

_2026-09-20T21:55Z_ — **`re-rooted-ascent`: three designs measured, all
falsified, and the decidable neighbour shipped.**

| signal | findings | why it failed |
|---|---|---|
| refuse hand-rolled ascents | 301 sites | most ARE this repository's idiom (`resolve(import.meta.dir, "..")` for an instance root); unimplementable |
| lands on a directory that does not exist | 8 | 7 were ordinary WRITE targets — temp dirs, generated output, a junit report |
| the ascent's depth is wrong | — | **there is no literal to check.** `"../.."` is always valid and the right depth is a fact about where the file sits |

**What made the real case wrong was none of those.** `PLATFORM` →
`cat-harness/` is defensible. It was what the fixture then DID with the value:
symlinked it as `folio-assistant` and expected `schemas/` directly beneath.
That is a semantic relation between an ascent and its downstream use, and every
signal that tried to infer intent produced false positives.

## What shipped: `check:anchor-names`

> `REPO_ROOT`/`REPO`/`repoRoot` must land on the repository root.
> `INSTANCE_ROOT`/`instanceRoot` must land on a directory with its own
> `harness.json`. `PLATFORM`/`platformRoot` name neither and are refused.

Definitional rather than a guess, so it has no false positives. **19 findings,
all fixed** — 13 names that lied (`REPO_ROOT` → `cat-harness/`) and 6
ambiguous, 122 identifier occurrences renamed across 19 files.

**The measurement that justifies refusing `PLATFORM`:** within
`cat-harness/scripts/tests/` alone, `init-folio.test.ts` used it for the
repository root while **five siblings used it for `cat-harness/`**. One name,
two anchors, one directory — which is the confusion the original defect lived
inside.

**It does not catch `re-rooted-ascent` and says so** — in the module header, in
the report footer, and in a test that asserts a truthfully-named re-rooted
ascent passes clean, so a later session cannot read a green run as coverage it
does not have.

**Found while building it:** the check reported three findings against its own
test file, whose fixtures embed sample ascents as strings. A check that cannot
tell code from a quoted example of code is reported to by every test that
exercises it. Fixed, with a test.

_2026-09-20T22:00Z_ — **A fifth shape, found by my own rename turning a gate
red.** Renaming `REPO_ROOT` in `translation-block-qa.ts` staled a sidecar; the
failure message read:

```
1 sidecar(s) stale — run: bun run content/pipeline/translation-block-qa.ts
```

From the repository root, where a reader stands, that does not resolve. **The
instruction telling somebody how to fix the failure named a path that does not
exist** — this bean's subject again, in a shape none of the three readers can
see: the source is `bun run ${SELF}`, so the **verb and the path are separated
by an interpolation** and no single line carries both.

`SELF` was doing double duty — the reviewer id written into every sidecar AND
the re-run message. Those are different facts, and changing the constant would
have rewritten `reviewer.id` across the corpus. So `SELF` stays as the id and
`RERUN_COMMAND` names the **package script**, which cannot rot when the file
moves — the same remedy `docs:harness` got in `sync-docs-harness.ts`.

**And the owner's verdict exempts it.** `content/` is in `FOLIO_OWNED`, so even
a reader that DID see this would count rather than fail it. That is the stated
cost of "count `content/`", arriving in a real case rather than in the
abstract. Not re-litigated here; recorded so the trade-off has evidence.

- [ ] A reader for the interpolated shape — a runner verb whose path arrives
      through a variable. Needs the constant's value at the use site, so it is
      light static analysis rather than a line scan.


*2026-09-20T22:15Z* — **A sixth shape, from a sibling PR rather than from
here.** [#623](https://github.com/litlfred/folio-assistant/pull/623) ran
`bun pm pack` for the first time and found the release tarball held **4 files,
16 KB, and no code**. The cause is this bean's subject in its purest form:
every `exports` target and `main` in the package manifest named a pre-split
`./src/...` path, and of the six entries in `files[]`, **two had moved and two
do not exist anywhere in the repository**.

The sentence worth keeping is theirs:

> A `files` entry that does not resolve is not a warning; it is a smaller
> package.

That is the same failure mode as a printed command naming a path that is not
there — a path literal in a **declaration** that no-ops silently instead of
erroring — and it is **outside every reader built here**, because none of the
three scans JSON manifest fields and `check:command-paths`'s `checkHooks()`
reads only `command` keys. Recorded, not claimed: the fix is theirs and has
landed on their branch; what belongs to this bean is the shape and the fact
that our coverage does not reach it.

- [ ] A reader for declared path literals in JSON manifests — `main`,
      `exports`, `files` in `package.json`, and the same question for any
      other declaration whose unresolvable entry is dropped rather than
      refused. Depends on #623 merging first, so the fix is not re-derived.

*Issue link, recorded 2026-09-21.* **[#620](https://github.com/litlfred/folio-assistant/issues/620)** — `check:anchor-names`.

Written down because `check:bean-issue-links` found it missing, and the defect is this epic's own: an issue was opened FROM this bean and the link was never carried back, so the work plan could not reach the issue from the bean. `oh78` names exactly that, and it happened four times in the session working `oh78`.
