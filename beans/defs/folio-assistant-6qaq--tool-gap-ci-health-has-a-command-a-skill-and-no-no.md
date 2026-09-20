---
# folio-assistant-6qaq
title: 'TOOL GAP: ci-health has a command, a skill, and no node — and tier D hid it'
status: completed
type: task
priority: normal
created_at: 2026-09-20T14:30:18Z
updated_at: 2026-09-20T15:15:23Z
parent: folio-assistant-d308
---

Met while working `6366`, whose criterion 4 asked `gates` to satisfy `ci-health`.
That criterion was **wrong** — `gates` runs the checks, `ci-health` reports whether
the workflows passed on the default branch — but it was reaching for something
real, and this is it.

## The gap

**Nothing in `tools/index.ts` satisfies `ci-health`.** Measured rather than
inferred: `tools()` covers 44 skills and `ci-health` is not among them.

The mechanism exists and is named: `check:ci-health` at `package.json:56`
(`bun run cat-harness/scripts/check-ci-health.ts`). `AGENTS.md` documents it, the
session-start sweep prints it, and `ci-health.yml` runs it weekly. So this is
`covered-is-not-reachable` case 1 in its plainest form — a skill with a command
and no node.

## Why it stayed invisible, which is the more interesting half

`tools:coverage` triaged it into **tier D**, whose label reads *"no evidence.
Almost certainly judgement."* and whose members the report did not print. Evidence
list: **empty.**

The cause was structural. The triage decided "has a command" by testing the
skill's own markdown for a fenced ```sh block, and `ci-health.md` states its three
reading rules **without ever showing the command**. So the instrument answered a
question about the *prose* while its label made a claim about the *capability* —
the same error as reading a mechanism from its name.

Fixed under `6366`: a declared `package.json` script now counts as evidence,
matched strictly, and `ci-health` sits in **tier C** carrying
`script:check:ci-health`. Five other skills moved with it.

## What is left here — writing the node

Not started, and it needs two judgements rather than a template:

1. **The third state is the whole point of this skill**, so the node's `io` has to
   carry it. `ci-health`'s own rules are that "could not check" is never green, a
   red that has not re-run in a week is *possibly stale*, and a red whose workflow
   file changed after the failing run is `superseded`. A node whose output is
   `pass | fail` would contradict the skill it satisfies.
2. **`requires.network` is `true`**, and that is unusual here — it reads the forge.
   Which means the `selection.limits` must say what it reports when the network is
   refused, and the answer must be could-not-determine rather than green. Bean
   `1xhc` already carries a case where `check:ci-health` **printed green while
   `main` was red**, because an unsettled newest run was dropped.

## Done when

- [x] a Tool node whose `invoke` is `bun run check:ci-health`
- [x] `satisfies: ["ci-health"]` — one skill, nothing stretched
- [x] its outputs distinguish green / red / could-not-determine, plus
      `possibly stale` and `superseded` — five verdicts in the report and
      **three exit codes** for a caller that reads no rows
- [x] `requires.network: true`, and `selection.limits` says a refused API call
      **exits 2 and is never green**
- [x] `tools:coverage` no longer lists `ci-health` in any tier — measured: 0
      occurrences in the whole report, and tier C went 50 → 49

## Related

- `6366` — where this was found; fixed the blindness, not the gap
- `1xhc` — the epic for "a gate that does not fire is indistinguishable from one
  that passed", and the record of why `check:ci-health` is deliberately NOT a gate
- `covered-is-not-reachable` — case 1, and now cases 4 and 5 for the neighbouring
  shapes


---

## DONE 2026-09-20

The node is in the graph. Two things in it were judgements rather than transcription, and both were settled by reading the script instead of the skill.

### The exit codes are the contract, and `--markdown` is the trap

`check-ci-health.ts` already had all three states — 0 nothing red, 1 something
red, **2 could not look** (`if (unreachable) process.exit(2)`, plus an unwritable
`--out`). Its own comment states the rule this platform states everywhere:

> *"could not look" indistinguishable from "looked and it was fine".*

So the node's output names the exit codes, not only the verdicts. And it warns
about the flag that breaks them: **`--markdown` always exits 0, deliberately.**
`session-start-coord-sweep.sh` runs it as `if ! … --markdown; then` and prints a
"Not checked — treat as unknown" fallback on a non-zero exit, so making
`--markdown` exit 1 on a red would print the report **and** declare it unchecked
every time CI was red. `--out` exists precisely so the notifier can have the
markdown *and* the exit code without spending the API call twice.

A caller that wants the verdict therefore uses **neither** `--markdown` nor
`--warn`, and the node says so, because both look like the obvious choice.

### `network: true` is what makes the third state load-bearing

Most nodes here declare `network: false` and their could-not-determine is about a
missing file. This one reaches the forge, so the failure is *routine* — no token
on a private repo, a refused proxy, a rate limit — and `1xhc` records the exact
way it goes wrong: **it printed green while `main` was red**, because an unsettled
newest run was dropped. Hence `selection.limits` spelling out that a refused call
exits 2 and is never green, rather than leaving it to the exit code.

### Verified

- `bunx tsc --noEmit` 0; `check:tools` 0 — *"every satisfies resolves and agrees
  with its skill's contract"*
- `bun run check:ci-health --warn` actually runs: three workflows on `main`, all
  green, one *"newest run has not reported — verdict may predate HEAD"*, which is
  the possibly-stale verdict doing its job
- `tools:coverage`: `ci-health` gone from every tier; 157 uncovered, A=28 B=3
  C=49 D=77
- 35 tests across the tool suites pass — including the `ci-health` case in
  `tool-coverage-triage.test.ts`, which was written **conditionally** for exactly
  this transition (*"in C if it is still uncovered at all"*), so writing the node
  did not turn a correct outcome into a red test
