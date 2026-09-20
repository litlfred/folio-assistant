---
# folio-assistant-sa8y
title: 'QA WORDING: a graph-scoped finding worded absolutely sent a session to a wrong fix'
status: todo
type: task
priority: high
created_at: 2026-09-20T05:52:43Z
updated_at: 2026-09-20T05:52:43Z
parent: folio-assistant-d308
---

A finding scoped to one graph but **worded absolutely** sent this session to a
wrong fix, and the wrong fix was caught only by a test written the day before.

## What the report says, and what is true

`kg:audit` at the repo root reports:

> skill "confirm-harness" is listed by no package manifest, carried by no role
> and named by no activity.

Each clause is true **of the root instance's graph**. None is true absolutely:
`bootstrap/workflows/initialize-harness.bpmn` names `confirm-harness` **three
times**, and `bootstrap/harness.json` declares the directory holding it.

## Why that matters more than wording usually does

Reading it as absolute, I concluded the audit had a blind spot, traced it to
`workflowDirs` probing `<declared>/workflows` (so the `bootstrap` entry pointing
at `bootstrap/skills/` probes `bootstrap/skills/workflows/`, a sibling of the real
directory), and **declared `bootstrap/workflows/` at the root to fix it.**

`scripts/tests/instance-graph-isolation.test.ts` failed immediately, and it was
right: one instance's graph must not carry another's nodes. That was a LIVE defect
on `main` on 2026-09-19 — `findBpmnDirs` walked the filesystem, and
`_kg/folio-assistant.jsonld` carried **88** references to
`Process_InitializeHarness`. My change re-introduced it exactly.

Reverted in full. The isolation is deliberate and correct; the audit's scoping is
correct; **only the sentence is wrong**, and it cost a wrong change that a test
had to stop.

## The fix

Every finding that ranges over a graph should name the graph it ranged over:

> …named by no activity **in this instance's graph** (`cat-harness` at `skills/`).
> A nested instance may name it; this audit does not read one.

Cheap, and it removes the reading that produced the error. The same applies to
every criterion phrased as an absolute absence — `skill-in-role-or-process`,
`remote-skill-is-servable`, `skill-servable`.

## The second finding, which the detour did establish

**Bootstrap's process is auditable in principle and unaudited in practice.**
`collectInstanceNodes(BOOT, …)` works — the isolation test asserts bootstrap's own
graph DOES carry its process — but nothing ever runs the audits with `bootstrap/`
as root. So `kg:audit`, `translate-bpmn`, `render:bpmn` and `check:workflow-refs`
all skip it, and the **first process a new instance runs** has no sidecar, no
`.pot` and no rendered SVG.

Measured while the root declaration was briefly in place, so these are real
regardless of who should be reporting them:

- `skill-servable` ×3 — `confirm-harness` exists but no local package serves it,
  so `skill_fetch` answers "package not found". `bootstrap/skills/` has no
  package manifest.
- `lane-binds-role` ×3 — lanes `Initiator`, `Requestor` and
  `Knowledge Graph Data Store` match no declared role.
- **`render:bpmn` fails outright**: `no diagram to display`. The file carries no
  `<bpmndi:BPMNDiagram>`, so no BPMN tool can draw it. It executes and cannot be
  seen.

The remedy is to run each gate per declared instance rather than once at the root
— which is the same "nested declarations are not reachable from the root" gap the
`bootstrap` entry's own description already names.

## Third: a stale sidecar is residue of that fixed defect

`test/results/kg-qa/bootstrap/workflows/bootstrap.kg-qa.json` audits
`bootstrap.bpmn`, which `main` replaced with `initialize-harness.bpmn`. It was
written by the pre-fix run that walked the filesystem — which is *why* it exists —
and `kg:audit:check` does not flag it, because nothing at the root walks that
directory to notice the subject is gone.

**Not deleted.** One file, ~1 KB, subject removed on `main` 2026-09-19.
`deletion-requires-confirmation`: reported, waiting.

## Done when

- [ ] graph-ranging findings name their graph
- [ ] a gate runs the audits per declared instance, or the root's silence about a
      nested one is itself reported
- [ ] `bootstrap/skills/` gets a package manifest so `confirm-harness` is servable
- [ ] the three unbound lanes get roles, or the lanes are renamed to declared ones
- [ ] `initialize-harness.bpmn` gets a `BPMNDiagram`, or its absence is a recorded
      criterion rather than a hard renderer failure
- [ ] the stale sidecar: owner decides
