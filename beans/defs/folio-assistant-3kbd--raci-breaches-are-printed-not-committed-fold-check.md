---
# folio-assistant-3kbd
title: RACI breaches are printed, not committed — fold check:raci into kg-audit as a sidecar criterion
status: todo
type: task
created_at: 2026-09-20T13:17:47Z
updated_at: 2026-09-20T13:17:47Z
parent: folio-assistant-ahvw
---

Shipped in PR #500 (bean `7o7i`): `folio:raci` on BPMN activities, `ProcessNode.raci`,
`scripts/raci-chart.ts` with `bun run raci` (chart) and `bun run check:raci` (gate),
and `crdm-data-model.bpmn` as the first real use.

**What is missing is durability.** `check:raci` **prints** a breach and exits non-zero.
Every other structural criterion in this repo writes a **committed QA sidecar** under
`test/results/kg-qa/`, mirroring its subject's path. The difference is not cosmetic, and
`kg:audit`'s own rationale already says why: a printed verdict is gone the moment the job
ends, which makes **"this has been broken since the diagram was drawn"** and **"this broke
in the commit under review"** indistinguishable. RACI is exactly the kind of finding where
that distinction decides who is accountable for fixing it.

## Done when

- The three breach kinds `raciBreaches()` already detects — ≠1 accountable, an undeclared
  role in any column, A+C on the same activity — are emitted as `kg-qa` findings against
  the **process** they are found in, not as console lines.
- A sidecar exists for every process that carries at least one `folio:raci`, including the
  clean ones. **A process with no sidecar must be distinguishable from a process with a
  clean one** — that is the third state, and it is the whole point of writing the file.
- Severity is argued, not assumed. ≠1 accountable is a strong candidate for `critical`
  (the chart reads complete while nobody owns the activity); an undeclared role may be the
  same defect as a dangling `roleRef` elsewhere and should grade the same way, whatever
  that is. **Check what the neighbouring criteria actually grade before picking** — I got
  `skill-in-role-or-process`'s severity wrong twice in the session that wrote this.
- `kg:audit --check` treats a stale RACI sidecar the way it treats every other stale one.
- `bun run check:raci` either becomes a thin caller of the criterion or goes away. Two
  implementations of one rule is the drift this whole cluster exists to prevent.

## Not in scope

Widening what RACI detects. The three rules are the ones with a reason written down;
adding a fourth is a separate argument.
