---
# folio-assistant-3kbd
title: RACI breaches are printed, not committed — fold check:raci into kg-audit as a sidecar criterion
status: completed
type: task
priority: normal
created_at: 2026-09-20T13:17:47Z
updated_at: 2026-09-20T13:46:32Z
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

---

## Resolved 2026-09-20

### Three criteria, and the severities were argued from the neighbours

This bean warned me to check what the neighbouring criteria actually grade
before picking, because I got `skill-in-role-or-process` wrong twice by
assuming. Doing that turned up an unambiguous pattern across the whole
registry:

> **Every `critical` is a DANGLING REFERENCE** — a name that does not
> dereference. **Every `major` is a structural or semantic gap** between
> things that all exist.

So the split fell out rather than being chosen:

| criterion | severity | why |
|---|---|---|
| `raci-role-resolves` | `critical` | it **is** `role-ref-resolves` on a different edge. Grading it lower would say the same defect matters less depending on which attribute carries it. |
| `raci-single-accountable` | `major` | every role named exists; what is wrong is how many carry the decision |
| `raci-accountable-not-consulted` | `major` | and deliberately not `minor` — `minor` here grades **intended** states (a stub, reference material nobody performs), while this is a modelling error |

### The third state works

42 processes record `n/a` — they claim no RACI — and `crdm-data-model`
records `pass` on all three. **A process with no sidecar is distinguishable
from one with a clean sidecar**, which was the `## Done when` item most at
risk of being quietly skipped.

### One implementation, two consumers — and `check:raci` stays

The bean offered *"a thin caller, or it goes away"*. Neither, and the reason
is worth recording. `raciBreaches` now tags each breach with its kind and
`kg-audit` **partitions on the tag**, so nothing re-derives the rule — the
duplication this bean feared never comes into existence.

But `check:raci` cannot simply go: severity is a repo-wide policy, and
`kg:audit --check` fails on `critical` only. Of the three, only
`raci-role-resolves` is critical. Dropping the gate would have **silently
downgraded the one rule the owner explicitly asked to be enforced** ("exactly
one Accountable, enforced"). So it is kept as a documented exception to the
severity policy rather than as a duplicate of it: one rule, two consumers,
different gating. Both facts are in the module header.

### Falsified against the SIDECAR, not the console

That distinction is the entire bean, so each was checked by reading the
committed JSON:

| injected into `crdm-data-model.bpmn` | sidecar result |
|---|---|
| flip a `consulted` to the accountable role | `raci-accountable-not-consulted: fail`, other two `pass` |
| point an `informed` at `no-such-role` | `raci-role-resolves: fail`, other two `pass` |
| delete one `accountable` | `raci-single-accountable: fail`, other two `pass` |

Each breach lands in **its own** criterion; none bleeds.

**One of those three was a vacuous test on the first attempt** and is worth
recording, because it is the failure mode this whole cluster is about. My
edit string had a space before `/>` and the corpus does not, so the
substitution was a no-op — and a no-op edit reads exactly like a criterion
that does not fire. Caught by asserting the tag count before substituting,
which is now how the falsification is written down.

### Guards

Two tests, both opening with a vacuity check: every breach is tagged with a
kind `kg-qa` registers a criterion for, and the severities match the
registry's dangling-vs-structural split (asserted **against
`role-ref-resolves` itself**, so the two move together or the test fails).

Verification: `bun run gates` **56/56**; `bun test` **3787 pass, 0 fail**;
`kg:audit:check` clean of criticals.
