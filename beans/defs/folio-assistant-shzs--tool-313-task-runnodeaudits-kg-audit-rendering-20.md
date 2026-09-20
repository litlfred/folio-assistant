---
# folio-assistant-shzs
title: 'TOOL 3/13: Task_RunNodeAudits — KG audit & rendering (20 files, 11 entry points)'
status: completed
type: task
priority: high
created_at: 2026-09-20T04:34:12Z
updated_at: 2026-09-20T16:25:01Z
parent: folio-assistant-d308
---

Group 3 of 13 in `d308`. **20 files, 11 entry points.**

`kg-audit`, `check-tools`, `tool-coverage`, `capture-mcp-tools`, `validate-skills`,
`known-skills`, `bpmn-render`, `render-bpmn`, `check-workflow-refs`,
`check-workflow-policy`, `check-mirror-drift`, `check-duplicate-decls`,
`stakeholder-map`, `repo-partition`, `repo-files`, `script-sweep`, `script-walker`,
`refactor-strategy`, `eval-crdm-detect`.

**BPMN:** `review-code · Task_RunNodeAudits` and `Task_ReviewTool` — the process
for reviewing a Tool node. This group audits the graph that would contain it.

**Target repo (#223):** `agentic-harness`.

**The uncomfortable part, recorded so it is not lost:** `tool-coverage.ts`
already tiers every uncovered skill A/B/C/D and says in its own header that tier
A "is the list to act on". It has said so since 2026-09-18 (bean `ce65`, still
in-progress). The instrument for this entire epic existed before the epic did. A
Tool node here is not new capability — it is making an existing answer reachable,
which is the whole thesis of `d308` demonstrated against the repo itself.

## Done when
- [ ] Tool node(s) for the audit family
- [ ] `satisfies` includes `kg-export` and the review skills
- [ ] `tool-coverage` itself reachable as a Tool
- [ ] `ce65` cross-referenced both ways

---

## CORRECTED 2026-09-20: `kg-export` is already covered — rescope to the audits

Five nodes satisfy `kg-export`: `pages-publish`, `serve-rendering`,
`cat-harness-schema`, `tool-schema`, `tool-types-schema`. So this bean's stated
skill is not uncovered, and `tool-coverage` does not list it in tier A.

**What IS uncovered and in tier A: `bpmn-authoring`** (`io-contract, userTask`).
And the audit family itself — `kg-audit`, `check-tools`, `tool-coverage`,
`capture-mcp-tools`, `validate-skills` — is reachable from no Tool node at all,
which is the joke this bean already noted and now has a name for.

## Rescoped

Two separable things were in one bean:

1. **The audit family** — `kg-audit`, `check-tools`, `tool-coverage`,
   `validate-skills`, `check-workflow-refs/-policy`, `check-mirror-drift`,
   `check-duplicate-decls`. 11 of these are run from this repo's `package.json`,
   so this is the **most verifiable node on the whole epic** and the right one to
   build first on evidence, whatever the process order says.
2. **BPMN rendering / authoring** — `bpmn-render`, `render-bpmn`,
   `translate-bpmn`, satisfying `bpmn-authoring`, which IS tier A and uncovered.

These should be two nodes, not one. Rendering a diagram and auditing the graph
are different jobs with different inputs.

## Done when — REPLACES the list above

- [ ] a Tool node for the audit family; `satisfies` names the review skills, NOT
      `kg-export`
- [ ] a second node for BPMN rendering; `satisfies` names `bpmn-authoring`
- [ ] neither claims `kg-export`, which has five nodes already
- [ ] `tool-coverage` reachable through a Tool — the instrument that found this
- [ ] `ce65` cross-referenced both ways


---

## 2026-09-20 — the audit family measured, and the blocker I expected was not one

Read every mechanism this bean names, rather than reasoning from the list:

| mechanism | node | skill | verdict |
|---|---|---|---|
| `kg-audit` | `kg-audit` | `code-node-review` | already done |
| `capture-mcp-tools` | **`mcp-capture`** (new) | `mcp-contract` | the SCRIPT names its own skill |
| `check-tools` | **`check-tools`** (new) | `code-node-review` | the SKILL names the command |
| `tool-coverage` | **`tool-coverage`** (new) | `code-node-review` | same skill |
| `validate-skills` | wired as a GATE, no node | — | a working validator that had lost its wiring |

### The mistake worth recording: I searched for a skill NAMED for the capability

I had `check:tools` and `tools:coverage` framed as a capability-vocabulary
question for the owner — the `yean` shape, "no skill states this". **Wrong.**
`code-node-review`'s own description states it outright:

> *"Review the knowledge graph's CODE nodes — Tool definitions in the `tools`
> graph and schema definition nodes under `schemas/` — for the joins a reader
> cannot see: that a node declares what it is, that what it names resolves, and
> that the mechanism it describes is the one that actually runs."*

And its §"The audits to run" **names `bun run check:tools` in a fenced block**. So
this was case 1 of `covered-is-not-reachable` in its plainest form — a mechanism
inlined in its skill's prose — and a node is exactly the remedy.

The `yean` test is *"does a skill STATE this capability"*, and I kept answering it
by **searching skill names**. `code-node-review` was never going to be found by
grepping for `tool` or `audit`.

### `capture-mcp-tools` named its own skill, and had a third-state defect

Its docstring: *"it is the comparison side `mcp-contract` needs: that skill's
schema-equivalence check compares a Tool node's `io` against what is served."* No
judgement required.

Reading it also found a real defect: a module it **could not read** exited **1**,
in the same bucket as a failure. That is load-bearing here rather than pedantic —
the captured list is what `mcp-contract` compares Tool nodes *against*, so an
incomplete capture makes every unread module look like a tool the server does not
serve. Now exit **2**, saying the surface is incomplete and no equivalence verdict
may be drawn from it.

### `validate-skills` is a gate, not a node

A **working** validator — 9 of 9 package manifests, 16 files, 0 errors — that was
in `package.json` once (two commits touched it there) and in no workflow now.
`1xhc`'s class exactly: a gate that does not fire is indistinguishable from one
that passed. Wired as `check:skills` into `code-quality-gates.yml`, which is safe
because it is green on this tree, so it locks in a property the repo HAS.

No node: it validates manifests corpus-wide and is a CI gate, where
`kg-validate` covers one node at a path. Complementary, not duplicates.

**And the repo's own guard caught me mid-way**: adding the `package.json` entry
without a workflow step made `gates --list` report
`UNRUN — declared in package.json and in NO workflow`, which is the defect this
bean is about, committed while fixing it. Wired properly; gate count 57 → 58.

### A counting error, caught before it was acted on

I read `tail -8` of `validate-skills`'s output, saw six manifests, and concluded it
silently skipped three. **It validates all nine.** Same mechanism as the earlier
`grep -A 14` that truncated an orphan list to 9 of 12. The habit to break is
concrete: **never take a count from truncated output.**

### Verified

- `bun run gates --all` — **61 of 61**, the whole set, 174 e2e tests
- `check:tools` 0, `tsc` 0
- tier A 26 (was 28 at the start of this read); `render-logging`, `ci-health`,
  `feature-staging` and now the audit family are all out of the uncovered tiers
