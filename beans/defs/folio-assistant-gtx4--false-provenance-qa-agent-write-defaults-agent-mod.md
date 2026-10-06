---
# folio-assistant-gtx4
title: 'FALSE PROVENANCE: qa-agent-write defaults agent_model to a stale literal, writing a model that did not do the work into committed sidecars'
status: in-progress
tags:
  - ready-to-close
type: bug
created_at: 2026-10-02T23:52:42Z
updated_at: 2026-10-06T22:43:00Z
parent: folio-assistant-0ipy
---

## The defect, verified first-hand 2026-10-02

`cat-harness/src/qa-agent-write.ts:142-143`:

```ts
const model = arg("model") ?? "claude-opus-4-8";
const skill = arg("skill") ?? "local/qa-agent-drain";
```

`:204-210` writes them straight into the committed sidecar:

```ts
  reviewer: {
    kind: "agent",
    id: skill,
    agent_model: model,
    agent_date: today,
    agent_skill: skill,
  },
```

**An agent that omits `--model` records a model that did not do the work, and
nothing downstream can tell a recorded value from a defaulted one.** The
literal is already stale — this session is `claude-opus-5`, so any entry it
wrote without `--model` would claim `claude-opus-4-8`.

This is the third instance in one session of one defect class: **a value that
was never established, rendered indistinguishably from one that was.** The
others are the vacuous CI pass (bean `0qjq` / #1894's `Rule_HeadNotGreen`) and
the vacuous `clean` verdict (bean `zjm1`). The repository already states the
rule this breaks, in two schemas:

- `cat-harness/schemas/kg-qa.ts:480` — *"Outcome of one criterion. `unknown`
  is never a pass."*
- `cat-harness/schemas/health-report.ts:89` — *"`unknown` is never a pass, and
  never a failure."*

## The fix, and why absent beats `"unknown"` here

`agent_model?: string` is **optional** (`cat-harness/schemas/block-qa.ts:127`),
so the field can simply be omitted:

```ts
const model = arg("model");   // no default
```

…and spread conditionally at the write site, as the file already does for
`severity`, `score` and `evidence`.

Omitting is better than writing `"unknown"` here, and the reason is
`schemas/source-licence.ts`'s three states: **absent means nobody recorded
anything**, while `unknown` means somebody looked and could not establish it.
A writer that was never passed `--model` is the first case, not the second.
And a coverage count over "how many entries record a model" must not count a
sentinel as a record — which writing `"unknown"` would cause.

A consumer can still detect the gap precisely, because `kind` is always
recorded: `kind === "agent" && agent_model === undefined` is exactly "an agent
wrote this and did not say which".

**`agent_skill`'s default is a weaker case and is deliberately NOT bundled
here.** `"local/qa-agent-drain"` is a truthful self-description when the drain
is what invoked the writer, so it is a different argument and should be made
separately rather than swept along.

## Why this matters more than it looks

Measured this session over all 123 committed sidecars: **5,867 reviewer
entries, 5,856 `script`, 11 `agent` (0.19%)** — and all 11 carry one model,
one session, one skill, `actor: "untainted-adjudicator"`. So the agent-written
population is small enough that a handful of falsely-defaulted rows would be a
large fraction of it, and large enough that nobody would notice.

It also blocks the thing both routing papers say this repo needs. The field
`agent_model` is the join key for any future cost or model-level decision; a
column that may silently hold a default cannot carry one.

## The cheapest useful change beside it, for the routing question

Not "build a router" — neither routing paper supports that here (arXiv
2601.04544v1 has **no cost term in its objective** and no code tasks; arXiv
2607.00053v1 **loses on its one repo-disjoint split**, 0.49/0.48/0.55/0.55
against its own K=0 ablation at 0.63). What they share is a training signal of
`(unit, model, outcome, price)`, and this repo can already write three of four:

- `block-qa/v1` already declares `agent_model`, `agent_session`, `agent_date`,
  `agent_skill` (`schemas/block-qa.ts:124-133`);
- **0** entries of any kind carry a cost, token or elapsed field.

So the gap is **one column and the rows**, not the schema. Three optional
fields on the existing provenance block — `agent_elapsed_ms`,
`agent_cost_usd`, `agent_cost_basis: "measured" | "estimated" | "unknown"` —
would let `swarm-management.md:97` ("no cost estimate to show the author when
asking") be closed by measurement rather than by removing the ask. That is a
separate bean's worth of work; recorded here so the connection is not lost.

## Done when
- [x] `agent_model` has no default; omitted when not supplied
- [x] a test that a write without `--model` produces a sidecar with no
      `agent_model`, not a defaulted one
- [x] decide `agent_skill`'s default separately, on its own argument (kept `local/qa-agent-drain` as truthful self-description when invoked by the drain, as noted in the bean)
- [x] check whether any committed sidecar already carries the defaulted
      literal — **measured 2026-10-02: ZERO.** `grep -rl 'claude-opus-4-8'
      --include='*.qa.json'` returns nothing, and every one of the 11
      `agent_model` values in the corpus reads `claude-opus-5`. So the corpus
      is CLEAN and this is a LATENT bug, not an active contamination: the fix
      is purely preventive and no record needs adjudicating. That is also the
      reason it is worth fixing cheaply now rather than after it has written
      a row nobody can distinguish.

## Evidence
- Removed stale literal `"claude-opus-4-8"` default for `model` in `cat-harness/src/qa-agent-write.ts`.
- Conditionally spread `agent_model` in the `reviewer` entry only when `--model` is supplied.
- Updated usage docblock in `cat-harness/src/qa-agent-write.ts` (`[--model <agent-model>]`).
- Added tests in `cat-harness/src/qa-agent-write.test.ts`:
  - `omits agent_model when --model is not supplied (bean gtx4)`
  - `records agent_model when --model is supplied (bean gtx4)`
- Verified with `bun test cat-harness/src/qa-agent-write.test.ts` (all 6 tests pass).
- Verified `bun run typecheck` and `bun run check:retired-front-matter` pass cleanly.

_2026-10-06T22:42:11Z_ — Claimed by claude/gtx4-qa-agent-write-model-default — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
