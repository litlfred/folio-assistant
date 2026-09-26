---
# folio-assistant-bjzs
title: 'PER-INSTANCE GATES: kg:audit, render:bpmn and check:workflow-refs run at the root only, so 15 nested instances are counted and none is audited'
status: in-progress
type: task
priority: normal
created_at: 2026-09-26T04:14:07Z
updated_at: 2026-09-26T08:44:37Z
parent: folio-assistant-d308
---

Split out of `sa8y` 2026-09-26. It was `sa8y`'s last genuinely open item and the
only one of its four; the other three are done and `sa8y` closed on the wording
fix that is its actual subject. It gets its own bean because it is a different
subject — `sa8y` is about a finding's **wording**, this is about a gate's
**range** — and because a wording bean carrying an infrastructure item is how
`sa8y` came to hold three lists that disagreed with each other.

## The gap, measured 2026-09-26

`kg:audit` runs once, from `cat-harness/`. Every other instance declares its own
graph, and the root deliberately does not read it —
`scripts/tests/instance-graph-isolation.test.ts` guards exactly that, after a
live defect on 2026-09-19 where `findBpmnDirs` walked the filesystem and
`_kg/folio-assistant.jsonld` carried **88** references to
`Process_InitializeHarness`.

So the isolation is correct and the silence is now REPORTED, as the
`nested-instance-audited` criterion (`minor`). From
`test/results/kg-qa/scenarios/kg.kg-qa.json`, this run:

| declaration | diagrams this run did not read |
|---|---|
| `bootstrap/bootstrap.json` | 3 |
| `folio-assistant-core/folio-assistant-core.json` | 1 |
| `smart-base/smart-base.json` | 1 |
| the other 12 declarations | 0 each |

**15 nested instances, 5 unread diagrams.** Read the sidecar for these figures,
never this table — `sa8y` quoted `(2)` in prose and the number was 15 by the
time anyone read it back, which is the rule about counts in prose earning
another instance.

## Why a report is not the fix

The criterion makes the gap **visible**; it does not close it. What is still
true of every nested instance:

- `kg:audit` writes it no sidecar, so "never audited" and "audited clean" are
  indistinguishable for its nodes — the exact argument `kg:audit` makes for
  being a committed sidecar rather than a console report, unapplied one level
  out.
- `translate-bpmn` — note this one **already** walks dependents' diagrams
  (69 of them, per bean `nafz`), so the gates do not even agree with each other
  about what "this corpus" means.
- `render:bpmn` never lists a nested diagram, so a process can execute and have
  no picture. `bootstrap`'s three were in that state until `sa8y` added the
  `BPMNDiagram` by hand.
- `check:workflow-refs` likewise.

`audit:coverage` is the report that would grade this, and it grades what the
root declares.

## What the fix has to get right

**Not by declaring the nested directories at the root.** That is the wrong fix
`sa8y` made and a test caught, and the `nested-instance-audited` detail string
warns against it in so many words. The shape is: run the gate **with each
declared instance as root**, and write each run's sidecars under that
instance's own results directory — so an instance's audit is an artefact OF
that instance, the same way its glossary is.

Two things to settle before writing it, and neither is the owner's judgement:

1. **`kgRoots(root)[0]` is read as "the root's graph"** while overlay order is
   deepest-dependency-first — `resolveSkillDirs` says so on itself. A per-instance
   loop must not quietly change which element that is.
2. **Which instances are in range.** `bootstrap` is nested and `smart-base` is a
   dependency; both are declarations, and a loop over all 15 audits `todos/` and
   `beans/` too, which hold no diagrams at all. Whether zero-diagram instances
   get an empty sidecar or no sidecar is the `dh4f` question — an empty sidecar
   says "looked, found nothing", no sidecar says nothing.

## Done when

- [ ] each declared instance is audited from its OWN root, with its sidecars
      under its own results directory
- [ ] `instance-graph-isolation.test.ts` still passes — the loop must not merge
      graphs, and a mutation that merges them must fail it
- [ ] a zero-diagram instance's state is determined rather than absent, per `dh4f`
- [ ] `render:bpmn` and `check:workflow-refs` reach a nested diagram, or their
      not reaching it is a reported state rather than silence
- [ ] `nested-instance-audited` stops firing for an instance that IS audited, and
      still fires for one that is not — falsified by mutation, not by inspection

---

## CORRECTED 2026-09-26 — this bean was wrong about two of its three gates

I wrote this bean from `nested-instance-audited`'s finding text without opening
the three gates it names. Measured on `origin/main`:

| gate | this bean claimed | measured |
|---|---|---|
| `check:workflow-refs` | root-only | **already per-instance** — `INSTANCES = [INSTANCE_ROOT, …"bootstrap"]` since 2026-09-19, with a docblock arguing exactly why |
| `render:bpmn` | *"never lists a nested diagram"* | reaches `folio-assistant-core` and `smart-base`; **only bootstrap's 3 are missed** |
| `kg:audit` | root-only | true — `root` is a module constant, referenced **76** times across 2344 lines, plus 9 derived `*_DIR` constants |

So "15 nested instances, 5 unread diagrams" was two facts glued together: 15 is
the count of declarations, but **2 of the 5 diagrams were being read the whole
time**. The gap is `bootstrap` alone, and the reason is specific — the root
declares `bootstrap/skills/` and not `bootstrap/processes/`, which is `pve3`'s
"declares HALF of bootstrap", and declaring the other half is the wrong fix
established twice (`sa8y`, and the leak `instance-graph-isolation.test.ts`
guards).

### And `check:workflow-refs` was auditing a TYPO, which is the real find

`join(INSTANCE_ROOT, "bootstrap")` — `INSTANCE_ROOT` is `cat-harness/` and
`bootstrap/` is at the REPOSITORY root. So the second instance resolved to
`cat-harness/bootstrap`, **which has never existed**. `workflowFiles` returned
`[]`, the loop ran over nothing, and the summary printed *"2 instances"* beside
the root's own count:

    before   273 skills known across 2 instances, 71 diagrams
    after    303 skills known across 2 instances, 74 diagrams

For over a year the checker believed it was auditing **the first process a new
instance runs** and was auditing a path that is not there — in the gate whose own
docblock says *"a dangling ref in a diagram this checker never opens is a broken
reference reported as clean."* Exit 0 after the fix, so nothing was hiding; what
was lost was the coverage, not a finding.

**The path fix is one expression. The reason nobody noticed is the part worth
keeping**, so `emptyInstances()` now reports a listed instance that contributed
no diagram, and an ABSENT one is **fatal** — reporting without failing would
leave exactly the gate that cannot fire (`1xhc`), which is how this survived.
An instance that exists and holds no diagram stays a report, because that is a
different fact. Falsified both ways: reintroducing the original expression gives
exit 1 and names the path; restoring it gives exit 0.

## Done when — rewritten against what is actually true

- [x] `check:workflow-refs` reaches bootstrap — it did not, despite saying so
- [x] a listed instance contributing nothing is reported; an absent one fails
- [x] tests pin the property rather than the count — the expected diagram total
      is DERIVED from both instances, because a literal goes stale the day a
      diagram is added and teaches the next agent to edit the test
- [ ] `render:bpmn` renders bootstrap's 3 diagrams. Small (`root` appears 4
      times in a 297-line file) but it writes SVGs into the ROOT's site assets,
      which is a placement question rather than a mechanical one, and the
      basename-collision caveat its own docstring carries becomes live
- [ ] `kg:audit` audits each declared instance from its own root. **This is the
      expensive one and it is the owner's call, not an agent's**: `root` is a
      module-level constant referenced 76 times in a 2344-line file, with 9
      derived `*_DIR` constants, and it is the gate that judges the whole
      knowledge graph. `sidecarPath` composes
      `dirname(join(root, subject.path))`, so a `../` subject escapes the
      results tree entirely (`chq5`) — meaning the ONLY correct shape is running
      it with each instance as its own root, exactly as
      `kg:locale:bootstrap` already does with `--instance ./bootstrap`. The
      precedent exists; the cost is the refactor
- [ ] whether bootstrap's `processes/` should be a declared directory of the
      root is NOT this bean's to reopen — `pve3` and `sa8y` both settled that it
      must not be

