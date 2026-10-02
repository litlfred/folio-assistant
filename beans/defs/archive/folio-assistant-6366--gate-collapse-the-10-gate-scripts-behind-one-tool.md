---
# folio-assistant-6366
title: 'GATE: collapse the 10 gate scripts behind one Tool bound to Task_RunGates'
status: completed
type: task
priority: normal
created_at: 2026-09-20T04:35:51Z
updated_at: 2026-09-20T14:30:10Z
parent: folio-assistant-d308
---

The GATE row of `d308`. **10 files, 10 entry points** — every one of them its own
command, none of them a Tool node.

`check-ci-health`, `check-workflows`, `check-harness-dirs`, `harness-dirs`,
`check-declared-paths`, `check-no-lean-artifacts`, `check-upstream`,
`check-upstream-pins`, `qa-results`, `lean-coverage`, plus `scripts/git-hooks/`
and `scripts/ci/`.

**BPMN:** `code-change-review · Task_RunGates · Task_RunCI`, and
`upstream-pin-watch · Task_ReadPins`.

**Target repo (#223):** `agentic-harness`.

## The thing that must not be lost in the collapse

`bun run gates` already derives the gate list from the WORKFLOWS, not from
`package.json` — bean `n60j`. That distinction was paid for twice in one session
on 2026-09-19: first a remembered list (under-answered), then a `package.json`
enumeration (over-answered, because 21 of 33 `check:` scripts appear in no
workflow at all). The authority is the workflow.

A Tool node here must therefore name `gates` and not a list. A node that enumerated
the ten would be the `package.json` mistake re-committed in a durable artefact,
where it is harder to notice and outlives the session that made it.

**Second rule:** three of these report health rather than acting — `check-ci-health`
and `health` both have "could not check is never green". The Tool must be able to
return could-not-determine, and its `io.outputs` should say so.

## Done when
- [x] ONE Tool node whose `invoke` is `bun run gates`
- [x] it does not enumerate the gates — derived from the workflow at call time
- [x] outputs distinguish pass / fail / could-not-determine — **exit 2 added**,
      7 tests, and the node's `io.outputs` now states all three
- [!] `satisfies` names the review and CI-health skills — **this criterion is
      wrong, and the repo's own record says why.** See below
- [x] the 10 scripts reachable only through it — measured: of **58** gate
      commands, exactly **1** has its own Tool node (`readme-audit`), and that
      one exists as a documented MCP tool in its own right


---

## 2026-09-20 — the third state added, and criterion 4 refused on evidence

### Criterion 3: the fix was in the CLI, not where the criterion implied

`loadGates` was **already right** and already refuses both shapes — the workflow
file absent, and the file present but yielding no commands — with a message that
states the principle itself:

> *"no gate commands were extracted. That is not a clean sweep, it is a broken
> reader."*

The defect was one layer up: `if (import.meta.main)` let that throw escape as an
**uncaught exception**, so a could-not-determine arrived as exit **1**,
indistinguishable from a real gate failure. So this change adds no detection; it
translates a refusal the library already makes into the exit code the third-state
rule requires.

Two things deliberately NOT done, each for a reason already paid for here:

- **No `gates.length === 0` branch.** It cannot fire, because `loadGates` throws
  first. A guard that cannot execute is the `build-glossary.ts` dead-guard defect
  — `resolve("")` returned the cwd, so `!existsSync` never fired — and it reads as
  protection while being none.
- **UNCLASSIFIED and UNRUN stay at the existing exit codes.** They are
  *determined* findings: the set is known and every member is named. *"I know
  exactly which steps are missing"* is not *"I could not tell."*

Testable without a spawn, because the CLI's `ROOT` comes from
`repoRootFor(import.meta.dir/..)` and no `cd` can move it: the report is a pure
exported `undeterminedReport()`, and the decision is what gets tested.

### Criterion 4 is wrong — `gates` must not satisfy `ci-health`

`gates` **runs** the checks. `ci-health` **reports** whether the workflows passed
on the default branch. Different capabilities, and adding the edge would be
exactly the stretch `covered-is-not-reachable` forbids: making the graph assert a
node does something it does not.

And this is not my reading against the corpus — **`1xhc` already recorded the
distinction**, in the list of scripts deliberately left out of the gate set:

> *`check:ci-health` (a report, reads the default branch, so on a PR it describes
> main not the diff; `ci-health.yml` runs it)*

A gate set that excluded the script on purpose cannot have a node that claims the
skill.

### What the criterion was reaching for, and it is a real gap

**`ci-health` has no Tool node at all** — nothing in `tools/index.ts` satisfies
it. Measured, not inferred: `tools()` covers 44 skills and `ci-health` is not
among them.

Worse, it was **invisible**. `tools:coverage` triaged it into **tier D**, whose
label is *"no evidence. Almost certainly judgement."* and whose members the report
does not even print — because the tier is decided by testing the skill's own
markdown for a fenced ```sh block, and `ci-health.md` states its rules without
ever showing its command. A real command (`check:ci-health`, `package.json:56`),
documented in `AGENTS.md`, and an **empty evidence list**.

That is the same error as reading a mechanism from its name: the instrument
answered a question about the *prose* while its label made a claim about the
*capability*.

**Fixed in this change.** A declared script now counts as evidence, matched
strictly — a colon segment of the key equals the skill, or the command runs
`<skill>.ts`. Loose substring matching was tried first and rejected (`diff` matches
`check:diff-policy`, and a false "this has a command" is worse than a miss because
it moves a judgement skill into the tier a person is told to read). Measured
effect: **6** skills move D→C — `agent-memory`, `ci-health`, `crdm-detect`,
`kg-viewer`, `raci`, `readme-sections` — and **nothing** already in A or B is
reclassified. Tier C also **prints its members** now, which its own label
("THE READ GOES HERE") and closing line ("only tier C needs reading") had been
demanding of a reader while withholding the list.

### Verified

- `bun run gates` — **56 of 56 pass**, the fast set
- `tsc --noEmit` 0; 15 new tests across two suites, 0 fail
- tier counts before → after: C 44 → **50**, D 80 → **74**; A and B unchanged at
  28 / 3
