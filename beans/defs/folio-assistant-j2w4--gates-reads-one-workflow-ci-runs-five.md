---
# folio-assistant-j2w4
title: gates reads ONE workflow; CI runs five
status: completed
type: task
priority: high
created_at: 2026-09-20T07:34:29Z
updated_at: 2026-09-20T07:47:20Z
parent: folio-assistant-1xhc
---

Measured 2026-09-20, by a CI failure the local gate runner had just passed.

## What the honest measurement turned out to be

My own estimate — 15 steps across 4 workflows, from a crude grep — was **low
by more than half**. The real reader finds **36 steps across 14 workflows**,
because a grep misses multi-line `run: |` blocks and I had only looked at the
files I expected to matter.

**And then the result inverted the expectation.** Having classified all 36,
`gates --all` is still 46: **every foreign step is exempt**. So the payoff of
this bean is a DECLARATION, not more coverage — which is exactly the
falsification condition I wrote down before starting, and it fired. The one
genuinely-missing check, `gen-site-jsonld --check`, was already fixed in the
commit that opened this bean.

That is worth stating rather than dressing up: the change adds no check. It
makes the absence of checks reviewable.

## Three kinds of exemption, each requiring a reason

- **`covered-by`** — the workflow runs a GENERATOR and the gate set runs its
  `--check` twin. Running both locally would write and then verify what was
  just written, which passes by construction.
- **`ci-only`** — needs a built `_site`, a `gh-pages` tree, a deploy slug, or
  `$RUNNER_TEMP`.
- **`no-folio`** — runs against a FOLIO's tree, and this is the platform.
  `AGENTS.md` asserted this in prose for two workflows; twelve scripts across
  eight workflows are now declared, where a machine can read it.

Not a reason: "it is slow" or "it usually passes".

## The finding underneath, which is bigger than this bean

Twelve of those scripts were authored for a folio and live in the platform
repository. One names `quantum-observable-universe` outright. Whether they
belong here at all — shipped for a folio to use, or dead since the #223 split
— is bean `52dz`. This table records WHAT they are and does not pretend that
is the same as deciding where they go.

`check:ci-health` cannot see them: a path-filtered workflow that never fires
has no runs to be red, which is the `5rfy` shape.

## Summary of Changes

- `gates.ts` reads every workflow, not one. `STEP_EXEMPTIONS` carries the
  classification with a reason per entry; `unclassifiedSteps()` is the gap.
- **Reported on every run**, not only with `--list`: an unclassified step is a
  check CI runs and the local set does not, and the whole cost of that gap was
  learning about it from a red PR instead of from the terminal.
- Four tests, and the two that matter run in BOTH directions: no step is
  unclassified, and **no exemption has stopped matching anything CI runs** —
  a table whose entries rot into claims about a CI that no longer exists is
  the failure this kind of list reaches on its own.
- Falsified: an invented workflow step fails the ratchet.

## Done when

- [x] every `bun` step in every workflow is gated or declared WITH A REASON
- [x] the unclassified set is printed on every run, not hidden behind a flag
- [x] a test that a new workflow step lands in one list or the other
- [x] a test that an exemption cannot outlive the step it exempts
