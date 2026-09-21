---
# folio-assistant-u1iu
title: 'DOCS SITE RED 7 RUNS: the foreign-instance export takes its base from the instance, and bootstrap declares none'
status: completed
type: bug
priority: normal
created_at: 2026-09-21T14:03:27Z
updated_at: 2026-09-21T16:42:02Z
parent: folio-assistant-vke6
---

Issue #720. Session: https://claude.ai/code/session_0136QLqnczLRAvFcqQKT588A

## Measured before starting, 2026-09-21

| | |
|---|---|
| Docs site on `main` | green at run 352 (#699, 11:49), **red 353–359** |
| break arrived with | **#688** (12:01) — NOT the harness.json excision (#695, 12:19), which merged into an already-red workflow |
| failing command | `kg-export.ts --instance ./bootstrap` |
| reproduces locally | yes, **exit 1** |
| workflows passing `--instance` | 1 (`docs-site.yml`); `feature-staging.yml` passes `--base-url` explicitly and never hit it |
| `bun run gates` through all seven failures | **green** |

## The diagnosis

`#688` made the base follow `instanceRoot`. The base is a property of the
PUBLICATION, not of the instance — and kg-export.ts already says so one
function up: `kg-export.ts:1486` mints a link into bootstrap's document
with `baseUrl: base`, its OWN. Two rules for one fact.

Invisible on eleven instances because the two rules agree there. Visible on
bootstrap because it is the one instance that DELIBERATELY declares no
site — its own declaration comment says "bootstrap HAS NO SITE. This
instance's canonicalUrl is cat-harness's site, not bootstrap's." The
configuration is right; the code's reading of it is not.

## Done when

- [x] the base falls back to the containing repo's declared base for a NESTED instance that declares none — and the third state (relative IRI + reported problem) is kept for an instance outside this repo, where the fallback would be a guess
- [x] a gate runs the foreign export the way `docs-site.yml` runs it
- [x] the gate is falsified — watched go red on the current code before the fix lands
- [x] the error message stops naming the retired `harness.json`, resolved from the constant rather than retyped
- [x] docs-site observed GREEN on main after the merge, not assumed

## The half that matters

Not the fallback — the gate. The fast gate set was green through all seven
failures, which is why the break survived six merges. `xom7` again, one
workflow over: a red workflow looks exactly like a green one from a checkout.

## Deliberately NOT in this bean

`docs-site.yml` publishes the bootstrap graph at `bootstrap.jsonld` (site
root); `feature-staging.yml` publishes it at `bootstrap/bootstrap.jsonld`.
Real divergence, separate bean, does not ride this fix.

## Found while gating, and fixed here because the gate cannot run without it

**One QA sidecar served every instance.** `writeQaResult(ROOT, "kg-export", …)`
used a CONSTANT stem, so `--instance ./bootstrap` overwrote this
instance's committed result wholesale — `subject.id` flipped from
`cat-harness.jsonld` to `bootstrap.jsonld`, findings and all, in the one
file whose purpose is saying what was found about WHICH graph.

Invisible while one document was ever built, and invisible in CI because the
deploy does not commit the sidecar. It surfaced the instant a gate ran the
deploy's own commands from a checkout — and it is in scope rather than
adjacent, because a gate that dirties a committed file on every run is not a
gate anybody keeps.

The host keeps the bare stem, so its committed path is unchanged; a foreign
instance is qualified by its stub. Same rule the `kg-qa` tree already follows.

## Verification

- `bun run gates` — **89 of 89** fast gates
- new gate watched go **red** on unfixed code, then green
- `publication-base.test.ts` 6 pass; with the pre-fix behaviour planted back,
  **3 of 6 fail** — the 3 that stay green are the ones that should, since they
  assert behaviour the fix does not provide
- `check-published-instance-exports.test.ts` 9 pass
- the resulting `@id` is `https://litlfred.github.io/folio-assistant/bootstrap.jsonld`,
  byte-identical to the IRI cat-harness's own graph mints for it — checked
  from both ends rather than pinned to a literal

## THIS BEAN DUPLICATED `40fl`, and the duplication is the finding

#718 (bean `40fl`, session_014HGPQoUnzXGqSspA8x6YyD) fixed the export defect
with the same diagnosis, in the same function, and merged at **14:02** — two
minutes after the `main` snapshot this branch was cut from. This bean was
opened at ~14:05 against a checkout one merge stale.

**The CI-health sweep was not wrong; it was reading true history.** The fix had
landed but `docs-site` had not re-run, because `kg-export.ts` is not in that
workflow's `paths:` filter — which is `tyyc`/#721, a third session, on the same
afternoon. Three separate sessions on one outage.

`pomp` already carries the general rule ("not in my checkout" is not "does not
exist"). What this adds is the narrow procedural gap: **a CI-health finding is
about the FORGE, so it must be checked against the forge's current state — open
PRs and `origin/main` — before it is opened as work.** Reading `git log` of a
local `main` is not that check. `beans list` would not have helped either: the
sibling's bean was `40fl`, titled for the symptom, and it was `in-progress` on
their branch only.

The duplicate half is withdrawn wholesale rather than reconciled — `kg-export.ts`
is main's byte for byte, and `publication-base.test.ts` is deleted.

## What was NOT a duplicate, and is why this bean stays open

- `check:published-instance-exports` — nothing on main runs the deploy's
  `--instance` commands from a checkout
- the per-instance QA sidecar — still broken on main

## Observed on main's implementation, NOT fixed here

`publisherCanonical` falls back for ANY instance, with no check that it
resolves inside this repository. No live caller passes an outside path
(`skillHome` iterates `instanceRootsIn(repoRootFor(ROOT))`), so this is latent,
not a defect today. But `--instance ../other-checkout` from the CLI would mint
absolute IRIs against THIS site for a document published elsewhere — the
"looks dereferenceable and 404s" hazard `makeIri` exists to refuse.

Raised rather than fixed: it is `40fl`'s code, it is latent, and the owner
scoped this branch to the two unique parts. Bean `fgvp`.

## Summary of Changes

Merged as `0fc29b98cc` (PR #725) on the owner's "merge it".

**The last box, closed on evidence.** `Docs site (GitHub Pages)` run **373**,
head `0fc29b98cc` — `status: completed, conclusion: success`, read from the
run itself rather than from a local exit code. That is what this box was for:
the outage it tracks was invisible from a checkout, so a local green would
have been the same mistake in the other direction.

**What landed.**

`check:published-instance-exports` reads the `kg-export.ts --instance <path>`
invocations out of `docs-site.yml` and runs each the way the deploy runs it,
with no `--base-url`. Derived rather than listed; finding none is exit 1.
Watched go red on the pre-#718 tree first.

`writeQaResult` no longer uses a constant stem. A foreign export was
overwriting this instance's committed result wholesale — `subject.id` and
findings together. Host keeps the bare stem, a foreign instance is qualified
by its stub.

**Verified on `main` AFTER the merge, in combination** — and this earned its
keep. CI had run on `71c9fdd0f1`, before #732 and the `.config.json` → `.json`
declaration rename landed beside it:

    check:published-instance-exports   exit 0
    host sidecar subject               cat-harness.jsonld
    foreign sidecar subject            bootstrap.jsonld
    tree after a gate run              clean

**What this bean is really a record of.** Half of it was a duplicate of `40fl`,
and the section above says how that happened and what the narrow procedural
gap is. The two gates that came out of the afternoon are complementary rather
than redundant — `tyyc` asks whether a workflow would REBUILD, this asks
whether its commands SUCCEED — and the outage needed both answers.

Carried forward, not closed here: `fgvp` (the fallback's missing repo-boundary
check, latent) and `3jhq` (two paths for one bootstrap graph, filed with what
to measure rather than a fix).
