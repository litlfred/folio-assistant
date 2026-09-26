---
# folio-assistant-om30
title: 'MAIN''S RED-BY-DECISION TEST MASKS 113 GATE INVOCATIONS: bun test is step 2 of 47 and nothing is continue-on-error'
status: todo
type: task
priority: normal
created_at: 2026-09-26T09:42:57Z
updated_at: 2026-09-26T10:43:11Z
parent: folio-assistant-1xhc
---

## What

`main`'s `typescript` job fails at **step 2 of 47**, and GitHub Actions stops a job
at its first failing step. So every later step in that job does not run — and on
`main` that failure is red **by the owner's decision**, not by accident.

Measured on `.github/workflows/code-quality-gates.yml` at `74f27e4c7fb`:

| | |
|---|---|
| `bun test` | step 2 (line 234) of the `typescript` job |
| steps after it in the same job | **45** |
| `bun run` gate invocations inside those steps | **113** |
| steps carrying `continue-on-error` or `if: always()` | **0** |

Confirmed from the log rather than inferred. Run `36231943911` (main's head):
`11790 pass, 44 skip, 1 fail`, the single failure being
`the real corpus … > no NEW drift, and nothing unreadable`, then
`##[error]Process completed with exit code 1` and straight to `Post job cleanup`.
Nothing between them.

**This is not a hypothetical.** The five most recent `code-quality-gates` runs on
`main` all conclude `failure`, and `check:ci-health` reports the workflow
*"last failed 0d ago; file changed since — stale, not green"*.

## Why it matters more than the drift it hides

The drift being red on `main` was a decision with a stated reason: the owner wants
real `.po` catalogues from the `t8g3` campaign, not a record of their absence
(#1364 recorded 25 `UNCATALOGED` entries, #1384 reverted them forty minutes later).
That decision is not in question.

What was never decided is its **side effect**: while that one test is red, CI
answers nothing about 113 other gate invocations on `main`. A green-looking
repository and a repository whose gates were never asked are indistinguishable
from outside, which is bean `xom7`'s shape — *a red workflow looks exactly like a
green one from in here* — one level down, at the STEP rather than the workflow.

## The proof that it is already hiding a real defect

`kg:detangle:check` is **line 663** — inside the masked region. Bean `xd1g` records
the defect it would catch: `cat-harness/schemas`'s pinned `size` is committed as
**1441** where the git-tracked answer is **227**, because `kg-detangle` walks the
filesystem with no gitignore awareness and counted 1214 files of
`block-qa-schema/node_modules` and `dist/` as knowledge-graph nodes.

And the ordering makes CI the *only* place it could have been caught:

- `kg:detangle:check` — line **663**
- `check:published-packages`, which runs `bun install` inside that package — line **823**

A runner reaches line 663 with no nested `node_modules`, so it computes 227 against
a committed 1441, `size` is a `PINNED_FIELDS` member, and `--check` exits 1. **Local
runs cannot reproduce that** — a developer container has the install, so a bare walk
there agrees with the poisoned value. CI was the one instrument positioned to see it,
and it has not run since the drift went red.

Provenance, from `git log -L` on the sidecar: `size` went **225 → 1440 in one
commit**, `4ee67fd2f33` — *"rsi6: the only package this repo publishes did not build
— and four scanners broke proving it."* The commit that fixed four ignore-blind
scanners poisoned a fifth's pinned measurement, and the step that would have said so
was already unreachable.

## Options, none of them chosen here

1. **Split the job** — `bun test` in its own job, the 45 gate steps in another, so a
   red test and an unasked gate are different facts.
2. **`continue-on-error` on the known-red step only**, with the job's conclusion
   derived at the end. Keeps one job; needs the final verdict to stay hard.
3. **Quarantine the drift assertion with a written expiry**, so `bun test` is green
   and the rest runs. This is the one to be careful of: it is close to *skip a test
   to get green*, which this repo forbids — the difference would have to be a dated,
   owner-approved exemption naming the campaign, not an agent's judgement.
4. Leave it, and accept that `main` is unmeasured on 113 invocations until `t8g3`
   lands.

(1) is the only one that changes nothing about what is asserted. But it re-shapes a
gating workflow, so it is the owner's call and not an agent's.

## Done when

- [ ] The owner picks among the four, or names a fifth
- [ ] Whatever is chosen, a red step and an unrun step are distinguishable in CI
      output — the current state renders "never asked" as nothing at all
- [ ] The `xd1g` detangle poisoning is fixed, and the fix is verified by a run that
      actually reaches line 663
- [ ] Re-check whether any OTHER gate in the masked region is red — this bean proves
      one is, and 112 invocations are still unexamined


## The mechanism, pinned to a timestamp — it is ORDER-dependent within ONE run

Measured in this container, not reasoned about. `cat-harness/schemas/block-qa-schema/`:

    node_modules/   created 2026-09-26 09:30:30
    dist/           created 2026-09-26 09:30:31

**Both were created by a gate, partway through a `bun run gates` run.** So inside a
single run the corpus CHANGES underneath the gate set: everything before that instant
scans 227 tracked files, everything after scans 1441.

Two consecutive runs in the same container, same commit, demonstrate it:

| run | `bun test` wrote | guard report |
|---|---|---|
| first (residue absent at start) | `size: 227` into the committed sidecars | **6 detangle sidecars mutated** — a true positive |
| second (residue now persists) | nothing | no detangle mutation |

So a pinned measurement whose value depends on whether an earlier gate in the same
run has already installed something is not a measurement of the repository. And the
committed 1441 is only self-consistent in a container that has ALREADY run the gate
that creates the residue — which is why every local re-run after the first agrees
with it and a fresh runner would not.

## Correction to my own instrument, found in its first live outing

The second run's guard report is a **false positive**, and I caused it:

    · bun run check:fallback-roles        wrote     ("??")  beans/defs/…om30….md
    · bun run translation:block-qa:check  reverted  (was "??")  beans/defs/…om30….md

Neither gate touched that file. I created this bean and then committed it **while the
gates were running**, so `git status` went `??` → absent and the guard attributed
each transition to whichever gate was mid-flight. That is exactly the case
`gate-tree-guard.ts`'s own docblock documents under *"Known limitation: do not run
git WHILE the gates run"* — written because the session building it nearly did this.
It then did it, one day later.

The limitation is real and the docblock's reasoning for not defending against it
stands (voiding the run is worse). But the report gives a reader no way to tell this
case from a true one, and two innocent gates are named. Worth a follow-up: the guard
could record `.git/HEAD` plus the index mtime alongside each snapshot and SAY
"attribution unreliable — the repository moved mid-run" without voiding anything.
That is a third state, not a defence, which is the shape this repo already prefers.

## Verdict on this branch, for the record

`bun run gates` — **2 of 154 failed**, verified by NAME: `bun test`
(`no NEW drift, and nothing unreadable`) and `translation:drift:check`. Both are the
same `t8g3` drift that is red on `main` by the owner's decision. `uml:overview:check`
green. Nothing on this branch fails that main does not.


## The masked defect is FIXED; the masking is not (2026-09-26)

`xd1g`'s detangle poisoning is repaired — `kg-detangle` asks git, and
`cat-harness/schemas` reads **229** rather than a committed 1442. So the third
`## Done when` box below is ticked *as a fix*, but **not as a verification**, and the
difference is this bean's whole subject:

**Nothing has yet confirmed the fix on a runner that reaches line 663.** It cannot,
while `bun test` fails at step 2. The fix was verified by running
`kg:detangle:check` directly, which is exactly the instrument CI does not get to.

One thing the merge added as evidence: `main`'s pinned value **rose from 1441 to
1442** during the hours this branch was open. The wrong number is not static — it
tracks whatever the dependency tree holds, so it climbs whenever any session re-runs
the writer in a container that has already installed `block-qa-schema`. A masked
gate does not merely fail to catch a defect once; it lets the defect keep moving.
