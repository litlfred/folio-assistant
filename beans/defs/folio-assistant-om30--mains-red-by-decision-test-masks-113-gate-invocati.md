---
# folio-assistant-om30
title: 'MAIN''S RED-BY-DECISION TEST MASKS 113 GATE INVOCATIONS: bun test is step 2 of 47 and nothing is continue-on-error'
status: todo
type: task
priority: normal
created_at: 2026-09-26T09:42:57Z
updated_at: 2026-09-26T09:43:29Z
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
