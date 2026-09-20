---
# folio-assistant-6366
title: 'GATE: collapse the 10 gate scripts behind one Tool bound to Task_RunGates'
status: todo
type: task
priority: normal
created_at: 2026-09-20T04:35:51Z
updated_at: 2026-09-20T04:35:51Z
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
- [ ] ONE Tool node whose `invoke` is `bun run gates`
- [ ] it does not enumerate the gates
- [ ] outputs distinguish pass / fail / could-not-determine
- [ ] `satisfies` names the review and CI-health skills
- [ ] the 10 scripts reachable only through it
