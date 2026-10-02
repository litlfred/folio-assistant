---
# folio-assistant-qgpo
title: A workflow must publish every foreign document its own graph links into
status: completed
type: task
priority: normal
created_at: 2026-09-21T18:27:04Z
updated_at: 2026-09-21T20:44:25Z
parent: folio-assistant-vke6
---

Found while closing `3jhq`, and deliberately not attempted there.

## The gap, stated precisely

`check:published-instance-exports` (from `u1iu`/#725, widened in `3jhq`) checks
that every `kg-export --instance` invocation a workflow runs **succeeds**. It
does not check that a workflow publishes everything its own graph **links
into**.

So the defect `3jhq` was opened for would not be caught by the fix `3jhq`
shipped: `feature-staging.yml` published no site-root export at all, and
deleting that invocation again leaves the gate green — one fewer invocation is
not a failing one.

## The invariant

> A workflow that publishes this instance's graph must also publish every
> foreign document that graph links into, at the path the link names.

Both halves are already computable:

- the link targets: build the export at that workflow's base and read the
  foreign `@id`s out of it — `3jhq` did exactly this by hand, and got
  `$BASE/bootstrap.jsonld#skill/discussion`
- the paths written: the `--out` arguments in that workflow's own `run:` steps,
  the same source `check:workflow-script-paths` (`tyyc`/#721) already parses

## Why it is worth doing rather than filing and forgetting

This is the `blv9` class, and it has now been found **three** times by hand:
`blv9` itself, `3jhq` on the staging workflow, and the two dangling links
`3jhq` measured. Each time a person noticed; no check did.

## Done when

- [B] the link targets a workflow's export would mint are derived, not listed
- [B] each is matched against the paths that workflow writes
- [B] a target nothing writes is a finding that NAMES the workflow and the link
- [B] could-not-determine is a third state — an export that will not build is
      not "no dangling links"
- [x] falsified by deleting a publish step and watching it go red

## ATTEMPTED 2026-09-21 — both obvious designs are wrong, with evidence

No check shipped. The script was written, falsified, and **withdrawn**. What
follows is why, so the next attempt does not re-derive it.

### The bean's own plan is insufficient

*"the paths written: the `--out` arguments in that workflow's own `run:` steps"*
— measured false before anything was written. `ns/content/v1.jsonld` is
published by a bare `cp` and never by `--out`. A check reading only `--out`
reports a correctly-published document as dangling.

### There already IS a check, and why it missed `3jhq`

`kg-export.test.ts` asserts *"no absolute self-URL names a path the deploy does
not write"* against `publishedPaths()` — a **hand-maintained literal set**.
`cat-bootstrap.jsonld` was in it, so the test passed while `feature-staging.yml`
wrote nothing there.

**One workflow's behaviour was asserted on behalf of all of them.** That is the
real gap, and it is narrower than this bean states.

### Design A — parse the destinations. VACUOUS.

Parsed `--out`, `cp` and `--out-dir`. Three defects, each found by falsifying
rather than by the corpus, which passed throughout:

| defect | evidence |
|---|---|
| `kg-export.ts` matched **inside comments** | `code-quality-gates.yml` publishes nothing; got 50 findings |
| `--out-dir ./_site` read as "publishes everything beneath" | yields the EMPTY prefix, covering the whole site |
| therefore every target matched trivially | **removing the staging export left the check GREEN** |

That last row is the one that matters: falsified against the exact `3jhq`
defect the check exists for, it did not fail. Green for the wrong reason from
the first run.

**A destination cannot be inferred from a flag**: `--out-dir` says WHERE a
generator writes, not WHAT.

### Design B — execute the site-writing lines. UNSAFE. Do not retry as written.

Symlinked `_site` to a temp directory and ran each workflow's
`bun run …/scripts/*.ts`, `cp` and `mkdir` lines so bash would resolve the
variables three parsing attempts each got wrong.

**It copied 7.8 GB of the root filesystem into the repository.**
`lean_ci.yml:449` is

    cp -r "$dir"/* _lean_docs/ 2>/dev/null || true

and with `$dir` unset that is `cp -r /* _lean_docs/`. The `2>/dev/null || true`
silenced it. Also left `_site` and `pages/` behind, none of them gitignored.

So: a workflow line is written to run in a prepared CI job with its variables
set, and lifting it out of that context makes an ordinary line destructive. Any
future execute-based design must run in a **disposable sandbox**, never in the
checkout, and must treat an unset variable as a refusal rather than a shell
default.

## What a correct attempt needs

- [x] the per-workflow question, since `publishedPaths()` answers it globally
- [B] a way to learn what a generator writes that neither infers from a flag
      nor executes in the checkout — most likely asking the GENERATOR (it knows
      its own outputs; `buildSkillIoContracts` already reports them)
- [x] falsification against `3jhq` specifically: remove the staging export and
      the check MUST go red. Design A passed this and was still vacuous, so
      this is necessary and not sufficient
- [x] `publishedPaths()` left alone — its literalness is argued and correct

## Status

Left `in-progress`. Nothing shipped; nothing to revert.

## RESOLVED — owner chose A, invocation parity, 2026-09-21

Options were tabled with the measurements behind each; the owner chose **A**.

`check:invocation-parity` asks a smaller question than this bean states, and
says so in its own header: **does the preview invoke what the deploy invokes?**
Symmetry, not resolution.

### Why A rather than the bean's own invariant

The two designs that tried the full invariant both failed, and the failures are
recorded above. A needs neither of their mechanisms — no destination parsing,
no execution — and it **catches the defect Design A stayed green on**:

    A. remove staging's `--instance ./cat-bootstrap`  →  exit 1, names
       `kg-export --instance ./cat-bootstrap`
    B. drop a whole generator from the preview        →  exit 1, names it

Design A passed every test it had and still went green on falsification A.
That is the difference, and it is the reason this one is shippable.

### Deploy and preview are DERIVED, never named

The deploy is the workflow whose graph export passes **no `--base-url`** — it
publishes at the declared `canonicalUrl`; a preview passes one so the staged
copy names itself. Neither workflow is written into the check, so a third site
workflow is classified the moment it exists. `discoverability-docs.yml` and
`publish.yml` touch `_site` and invoke no generator, so they publish something
else and owe nothing here.

### The hand-maintained part, and what guards it

`EXEMPT` — **2** entries, each with its reason:

| generator | why a preview need not run it |
|---|---|
| `fsh-guts-export` | the trashcan: the export strips `fsh-guts` from every graph it publishes, so no link target depends on it |
| `restore-staging` | restores the previews a deploy would overwrite; a preview has none |

A list is the part most likely to rot, so **a stale entry is itself a finding**:
an exemption naming a generator the deploy no longer runs excuses nothing and
hides the next difference. A clean run prints the exemptions with their
reasons, so the list is visible on every green run rather than only on failure
— an allow-list nobody sees is one nobody prunes. `tdu3` established that
discipline one gate over.

### What this deliberately does NOT check

That the documents resolve. **Both workflows dropping a generator together
passes.** The full invariant needs the generators to declare their outputs;
only 1 of 5 does today (`buildSkillIoContracts`, covering 47 of the 50 link
targets), and the other four expose nothing. That is option B, and it is left
un-filed rather than half-specified — the owner chose A knowing this.

## Summary of Changes

`cat-harness/scripts/check-invocation-parity.ts`, registered as
`check:invocation-parity` in the gate set and classified `harness` in
`instance-rules.ts`. 14 tests. Falsified twice, each against the defect it
exists for. `bun run gates` 96 of 96.

## The five `- [B]` items are OPTION B, not pending work

They specify the full invariant — every link target matched against what the
workflow writes. The owner chose **A**, which is narrower by design, so those
lines describe **the option that was not taken** rather than something left
undone. Marked `[B]` instead of ticked or deleted: ticking would claim work
that did not happen, and deleting would lose the specification, which is the
most valuable thing two failed attempts produced.

What B still needs, should anyone return to it: four of the five site
generators expose nothing about their outputs. `buildSkillIoContracts` is the
one that does, and it already covers **47 of the 50** link targets — so B is
smaller than it looks, and its remaining cost is four exports plus a composer.

The four ticked items are the ones A genuinely satisfies: it is per-workflow,
it leaves `publishedPaths()` alone, and it was falsified both by deleting a
publish step and against `3jhq` specifically.
