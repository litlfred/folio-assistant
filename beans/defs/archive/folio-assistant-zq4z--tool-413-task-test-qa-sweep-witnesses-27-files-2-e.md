---
# folio-assistant-zq4z
title: 'TOOL 4/13: Task_Test — QA sweep & witnesses (27 files, 2 entry points)'
status: completed
type: task
priority: high
created_at: 2026-09-20T04:34:35Z
updated_at: 2026-09-20T09:19:33Z
parent: folio-assistant-d308
---

Group 4 of 13 in `d308`. **27 files, 2 entry points** — the widest gap between size and
reachability in the whole table.

`qa-sweep`, `qa-agent-entry`, `qa-agent-drain-queue`, `qa-checker-discovery`,
`qa-checkers-*` (cost, dak, extended, python, q-usage, render, triviality, uses,
vacuity, voice), `qa-criteria-registry`, `qa-criterion-hash`, `qa-merge-findings`,
`qa-staleness`, `qa-witness`, `witness-audit`, `bib-qa`, `check-declared-assets`.

**BPMN:** `content-lifecycle · Task_Test` (`serviceTask`, refs `content-test`) and
`editing-hci-validation · Task_BuildGates`.

**Target repo (#223):** splits — sidecar infrastructure is `agentic-harness`, the
individual checkers are `folio-assist-core` (and `qa-checkers-dak` is `smart-base`).

**Why 2 entry points for 27 files is the interesting number:** this group is already
almost entirely library-behind-one-command, which is the END STATE `d308` argues
for. It is therefore the cheapest node on the list and the best worked example —
one Tool over a checker registry, with the registry unchanged.

## Done when
- [ ] a Tool node over `qa-sweep`, with the checker registry untouched
- [ ] `satisfies` includes `content-test`
- [ ] the checker discovery mechanism documented as the extension point, not the entry point
- [ ] `tool-coverage` reflects it

---

## 2026-09-20: done, and the shape this bean predicted held

One node over `qa-sweep`, registry untouched — which is what "2 entry points for 27
files" was always pointing at. The group was already almost entirely
library-behind-one-command, so the node did not have to be argued for; it had to be
written down.

`qa-checker-discovery` is recorded on the node as **the extension point, not the
entry point**: a new criterion is added by registering a checker, never by adding a
Tool. A node per checker would put twenty-odd near-identical entries in the graph
and still not describe how a criterion gets registered.

### `content-test`'s contract IS satisfiable — the contrast worth having

It requires `targetPath`, and `qa-sweep` takes a content root as its first
positional. Found by RUNNING it — `usage: qa-sweep.ts <content-root> …`, exit 2 —
rather than by reading for it.

That is the counter-example to the pattern `jh2j` and `eu38` recorded: two
authoring skills (`latex-authoring`, `proof-verification`) have contracts naming
the artefact being created and no mechanism that accepts one. `content-test` names
the artefact being CHECKED, and the checking mechanism takes exactly that. So the
pattern is sharper than "authoring contracts are unsatisfiable":

> **A contract is satisfiable when it names the same noun the mechanism takes.**
> Authoring contracts name an output; the corpus's mechanisms take an input.

### Two flags deliberately left undeclared

`--only ID,ID` and `--axis NAME,NAME` both take a comma-separated list inside one
argv word, and the type vocabulary has no honest shape for that: `Slug` forbids the
comma, `repeated` would claim the flag may be given more than once when the script
parses one list, and `Text` is refused on argv for precisely the reason it would be
wrong here.

**Adding a type to fit a flag rather than to describe a value is how the vocabulary
stops meaning anything.** So they stay undeclared and documented on the node. A
node need not declare every flag; it must not misdescribe one.

### Falsifier

`content-test` left `tools:coverage`'s uncovered tiers. Verified: typecheck,
`check:tools`, 3310 tests with 0 failures, 46 gates — the whole set. Coverage 36
skills with a Tool.
