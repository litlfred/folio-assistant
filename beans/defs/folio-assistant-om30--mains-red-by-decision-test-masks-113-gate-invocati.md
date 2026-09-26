---
# folio-assistant-om30
title: 'MAIN''S RED-BY-DECISION TEST MASKED 151 GATE INVOCATIONS, lint and tsc among them: bun test was step 2 of 47 with nothing continue-on-error — SPLIT, owner''s choice'
status: in-progress
type: task
priority: normal
created_at: 2026-09-26T09:42:57Z
updated_at: 2026-09-26T11:42:38Z
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


## IMPLEMENTED on the owner's choice — split the job (2026-09-26)

### First, a CORRECTION to this bean's own headline number

It said **113** masked `bun run` invocations. The real figure is **151**, across the
same 45 steps, identical on `14ec9dd446c` and on current `main`. My count used a line
range whose end boundary a regex had put 25 lines early, so it cut off part of the
job. **Wrong, not stale** — the title and the body both said 113, and so did a commit
message, a PR comment and what I told the owner.

And the 45 masked steps **include `bun run lint` and `tsc --noEmit`**. So `main` has
not been linted or typechecked in CI for as long as the drift has been red. That is
worse than this bean claimed, and it changed the fix: my first draft of the split left
lint and tsc behind `bun test`, still masked. They run FIRST now and `bun test` runs
**LAST**, with nothing behind it, and the ordering argument is written into the job.

### The split

`typescript` keeps exactly the three checks its name promises. A sibling job `gates`
(*"Repository gates (hard)"*) takes the 43 gate steps — 150 `bun run` lines — with its
own checkout/bun/python/install and deliberately **no `needs:`**.

**Verified before pushing, because the point is to stop hiding failures rather than to
reveal a heap of them.** 150 gate commands ran in a clean throwaway worktree with NO
`bun test` first, in a checkout with no nested `block-qa-schema` residue — a runner's
condition. **Exactly one failed:** `translation:drift:check`, the same t8g3 drift. The
masked region is otherwise clean.

`FAST_JOBS` had to learn the new job or `bun run gates` would have shrunk **154 -> 6**
while printing a confident pass. A new test asserts both jobs contribute.

### SEVEN derived artefacts from one .bpmn edit, in dependency order

`# bpmn-node:` markers are validated, and I invented `Task_RepositoryGates` before it
existed — `check:workflow-coverage` said DRIFTED. Adding the real seventh parallel
branch then cascaded:

    render:bpmn                docs/assets/img/workflows/code-quality-gates.svg
    kg:audit                   test/results/kg-qa/processes/...kg-qa.json
    gen-skill-docs             docs/reference/skill-instructions/platform-gates.md
    processes:viz              docs/processes/code-quality-gates.md + index.md
    translate-bpmn --extract   translations/{ar,es,fr,ru,zh}/processes/...pot
    kg:detangle                two detangle sidecars
    gen-uml-overview           two overview pages, which read those sidecars

A **partial order**, not a set: the last two consume what the earlier ones write. Four
rounds, each caught by a DIFFERENT instrument — `check:workflow-coverage`,
`check:ci-invocations`, `processes-viz.test.ts`, `bpmn-pot-current.test.ts` — and none
of them names a `.bpmn` file in its failure. **I shipped two instances of `ymsu`'s
class inside the commit whose message was about that class.**

`bun run skill:register` exists because the same was true of adding a skill. A
`bpmn:register` of that shape is the obvious follow-up; **not built**, because whether
seven steps deserve one command is the owner's call, and guessing is how the last such
list came out wrong three times.

### NOT clean, stated rather than buried

`role-carries-activity-skill` gains a **seventh** finding: `Task_RepositoryGates needs
skill "platform-gates", but its lane's role "build-pipeline" does not carry it.` All
six sibling tasks already carry the identical finding, so this is one more instance of
a pre-existing condition, not a new class. Not fixed — that is role modelling.
`kg:audit:check` passes (not critical) and CI does not run `kg:audit:strict`.

### ONLY THE OWNER CAN DO THIS ONE

`gates` is a NEW check name. Nothing regresses today, because merges land with
`TypeScript — tests, lint, types (hard)` red deliberately, so that check enforces
nothing. **But the moment the merge queue in `nytj`'s last box is switched on, both
names must be listed as required checks** — otherwise 150 gate invocations run and
block nothing.


## The full gate set, and a blind spot in the verification method itself

Three pushes each surfaced one further failure. Cause: I picked the verification
subset by hand each time — the same mistake AGENTS.md records about `bun run gates`.
**A subset of the gate set is not the gate set**, and that applies to a list I compose
as much as to one in a file.

Run properly — whole set, throwaway worktree, no nested `block-qa-schema` residue:
**5 of 156 failed**, tree guard **0 mutations**.

| gate | whose |
|---|---|
| `bunx tsc --noEmit` (vitest in the sub-package) | main's — patch proposed, not pushed |
| `bun test` > no NEW drift | main's — t8g3 |
| `translation:drift:check` | main's — t8g3 |
| `check:lockfile-pinning` | **mine** |
| `docs:auto:check` | **mine** — TENTH artefact |

### My prose declared an install

`check:lockfile-pinning` hunts a `bun install` without `--frozen-lockfile` in workflow
YAML, and matched a **comment** I had written to explain that very install. Reworded to
name the effect instead of the command.

Already a known class here rather than a quirk: `audit-coverage` records *"a docblock
that documents a tag necessarily contains the tag"* as something it had to pay for.

### A TENTH artefact, and a running tally

`docs/cat-harness/docs-auto/index/processes/**`. `docs:auto` is a link in the
registration chain, so `kg:audit`, `kg:detangle` and `gen-uml-overview` were re-run
after it in order; all converged.

Counts I have published on this change, each revised exactly once: **113 -> 151**
invocations, **seven -> eight -> ten** artefacts. A chain discovered by breaking is a
lower bound, every time — which is the argument for `bpmn:register` and against any
prose list, including the ones above.

### THE VERIFICATION TECHNIQUE HAS ITS OWN BLIND SPOT — record this

The clean-worktree run also failed `FOLIO_ROOT detection > INSTANCE_ROOT is this
platform checkout`. That test asserts the instance root IS the platform checkout, and
a detached worktree under `/tmp` is not. In the real checkout: **4 pass, 0 fail**.

So the technique that makes **residue-sensitive** gates honest makes **root-sensitive**
ones lie. A failure it reports must be re-checked in place before being believed. I
nearly reported this as a fourth finding.

Both directions now have a named instance: a gate is wrong in a built container
(detangle, 1441 vs 229) and wrong in a throwaway worktree (FOLIO_ROOT). Neither
environment is the truth on its own, which is what `check:merged` is for.
