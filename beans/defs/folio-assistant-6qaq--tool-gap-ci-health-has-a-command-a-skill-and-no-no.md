---
# folio-assistant-6qaq
title: 'TOOL GAP: ci-health has a command, a skill, and no node — and tier D hid it'
status: todo
type: task
priority: normal
created_at: 2026-09-20T14:30:18Z
updated_at: 2026-09-20T14:30:39Z
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

- [ ] a Tool node whose `invoke` is `bun run check:ci-health`
- [ ] `satisfies: ["ci-health"]`, and nothing else stretched to fit
- [ ] its outputs distinguish green / red / could-not-determine, plus the
      `possibly stale` and `superseded` verdicts the skill defines
- [ ] `requires.network: true`, with `selection.limits` stating what a refused
      network reports — and it is not green
- [ ] `tools:coverage` no longer lists `ci-health` in any tier

## Related

- `6366` — where this was found; fixed the blindness, not the gap
- `1xhc` — the epic for "a gate that does not fire is indistinguishable from one
  that passed", and the record of why `check:ci-health` is deliberately NOT a gate
- `covered-is-not-reachable` — case 1, and now cases 4 and 5 for the neighbouring
  shapes
