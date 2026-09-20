---
# folio-assistant-b963
title: 'COLD START: the entry documents named scripts/ for the whole split, and nothing checks a command path'
status: in-progress
type: bug
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T20:20:00Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
`AGENTS.md` line 3 (the cold-start line every agent runs first), lines 192 and 351, `README.md` lines 4 and 371, and `cat-harness/docs/guides/agent-onboarding.md` lines 96–97 named `scripts/install-beans.sh`, `scripts/beans-fallback.ts`, `scripts/gen-schema-docs.ts` and `scripts/gen-skill-docs.ts`. There is no root `scripts/`; all four live under `cat-harness/scripts/` since the split. `bash scripts/install-beans.sh` fails with "No such file or directory", so a fresh container following the first instruction it reads gets no work-plan CLI. Nine occurrences, repointed on branch `claude/sharp-fermi-xvs06i`.

## The gap
`check:agents-claims` reads LOCATION claims of the shape `symbol` in `module.ts` and ABSENCE claims; `check:agent-entry-links` reads links. Neither reads a **command line**, so a path inside a fenced command can rot silently. AGENTS.md itself records the same defect for the two generator commands "until 2026-09-20" — it was fixed in one file and not in the other two.

## Done when
- [ ] A check reads every fenced command in the entry documents (AGENTS.md, README.md, the onboarding guide) and fails when a path in it does not resolve
- [ ] The nine occurrences are confirmed repointed on main

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

_2026-09-20T20:40Z_ — **A third class, found by CI going red.** The count is
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

_2026-09-20T20:20Z_ — **The third class has a reader, and it found 237.**
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
- [ ] The 237 held findings get their verdict, and the `scripts/` group is repointed if that is the answer
- [ ] **The basis is tightened.** The `scripts/`-versus-`content/` distinction rests on the folio LAYOUT rather than on a declaration, which is weaker than this repository's usual standard. Stated rather than dressed up.
