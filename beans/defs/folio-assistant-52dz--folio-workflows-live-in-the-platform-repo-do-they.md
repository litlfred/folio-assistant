---
# folio-assistant-52dz
title: |-
    FOLIO WORKFLOWS live in the PLATFORM repo — do they belong here? them

    `AGENTS.md` already states the shape for two of them — 'qa-sweep and witness-refresh fail by design in this repo: the first preflights on content/package.json, the second needs computations/, and the platform carries no folio' — and adds 'do not fix a dispatch-only workflow by dispatching it'. So at least some are deliberate: the platform ships the workflow a folio will use.

    If that is the intent for all twelve, the question is whether a workflow a repository cannot run should live in it at all, or be part of what `folio_init` writes into a folio. If it is NOT the intent, some of these are dead files whose paths broke at the #223 split and nothing noticed — `check:ci-health` cannot see them because a path-filtered workflow that never fires has no runs to be red.

    They are now declared `no-folio` in `STEP_EXEMPTIONS` with reasons, so a machine can read what prose asserted. **That records what they are and does not decide where they go.**

    ## Done when

    - [ ] decide: shipped-for-a-folio, or dead since the split, per workflow
    - [ ] the shipped ones have a home that makes their non-running visible rather than silent
    - [ ] the dead ones go to `fsh-guts/`, never `rm`
status: todo
type: task
priority: normal
created_at: 2026-09-20T07:44:35Z
updated_at: 2026-09-20T08:44:39Z
parent: folio-assistant-1xhc
---

Owner, 2026-09-20: *"whats using them? give more info"*.

## Answer: NOTHING is using them

Measured 2026-09-20 — and the measurement **corrected this bean's own
framing**, which called them "folio workflows living in the platform".

### 1. Nothing triggers them

All eight are **`workflow_dispatch` only**. `publish.yml` also declares
`workflow_call`, and **no workflow calls it**. They fire if, and only if, a
person clicks "Run workflow".

### 2. Two have never run at all

| workflow | runs, all time | last | outcome |
|---|---|---|---|
| `section-title-audit` | **0** | — | never fired |
| `witness-pipeline` | **0** | — | never fired |
| `publish` | **1** | 2026-06-24 | failure |
| `qa-sweep` | **267** | 2026-08-09 | failure (every run in the visible window) |

`qa-sweep`'s 267 runs fired on **`push`**, on branches doing Lean/Hecke work —
so the trigger was removed at some point and the history is from when it was
not. Every visible run failed.

This is why `check:ci-health` cannot see them: it reads runs on the default
branch, and a workflow with **zero runs** has nothing to be red. The `5rfy`
shape — "29 of 32 workflows never fire on their own" — with the dial at zero.

### 3. The framing in this bean was WRONG, and the truth is more actionable

I wrote that these run against "a FOLIO's tree, which the platform does not
have". **Seven of the eight scripts exist right here**, under `cat-harness/`:

    content/pipeline/qa-sweep.ts                   -> cat-harness/... EXISTS
    content/pipeline/qa-section-title-audit.ts     -> cat-harness/... EXISTS
    content/pipeline/latex-overfull-report.ts      -> cat-harness/... EXISTS
    content/pipeline/conditional-class-banner-audit.ts -> EXISTS
    content/pipeline/codemod-leanval.ts            -> EXISTS
    scripts/audit-wiring.ts                        -> EXISTS
    scripts/section-story-audit.ts                 -> EXISTS
    pipeline/build.ts                              -> exists NOWHERE

The workflows name them **without the `cat-harness/` prefix**, and were last
touched **2026-09-18** — two days before the #223 split moved everything under
`cat-harness/`. **The split broke their paths and nothing noticed**, because a
dispatch-only workflow that nobody dispatches produces no evidence of being
broken.

So it is not one question but three, and they have different answers:

- **`pipeline/build.ts`** — genuinely absent. Folio-shaped, or dead.
- **The seven that exist** — platform scripts with pre-split paths. Whether
  they should run here is a real question; that their paths are wrong is not.
- **The `on:` triggers** — all dispatch-only, two never used. Even with correct
  paths they would still fire only by hand.

## What this changes about the `no-folio` exemptions

The `STEP_EXEMPTIONS` entries added under `j2w4` say these steps "run against a
FOLIO's tree, which the platform does not have". For `pipeline/build.ts` that
holds. **For the other seven it is wrong**, and an exemption resting on a wrong
reason is the thing that table exists to prevent. Correcting them is part of
this bean now, not a separate one.

## Done when

- [ ] `pipeline/build.ts`'s four workflows: shipped-for-a-folio, or dead — and
      if dead, to `fsh-guts/`, never `rm`
- [ ] the seven with pre-split paths: fix the path, or say why the workflow
      should not exist here
- [ ] the `no-folio` exemptions re-worded to the reason that is actually true
      for each
- [ ] a check that a dispatch-only workflow naming a path that does not resolve
      is REPORTED — the absence of runs is exactly why nothing caught this
