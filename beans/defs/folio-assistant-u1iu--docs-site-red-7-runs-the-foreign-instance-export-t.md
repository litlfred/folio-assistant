---
# folio-assistant-u1iu
title: 'DOCS SITE RED 7 RUNS: the foreign-instance export takes its base from the instance, and cat-bootstrap declares none'
status: in-progress
type: bug
created_at: 2026-09-21T14:03:27Z
updated_at: 2026-09-21T14:03:27Z
parent: folio-assistant-vke6
---

Issue #720. Session: https://claude.ai/code/session_0136QLqnczLRAvFcqQKT588A

## Measured before starting, 2026-09-21

| | |
|---|---|
| Docs site on `main` | green at run 352 (#699, 11:49), **red 353–359** |
| break arrived with | **#688** (12:01) — NOT the harness.json excision (#695, 12:19), which merged into an already-red workflow |
| failing command | `kg-export.ts --instance ./cat-bootstrap` |
| reproduces locally | yes, **exit 1** |
| workflows passing `--instance` | 1 (`docs-site.yml`); `feature-staging.yml` passes `--base-url` explicitly and never hit it |
| `bun run gates` through all seven failures | **green** |

## The diagnosis

`#688` made the base follow `instanceRoot`. The base is a property of the
PUBLICATION, not of the instance — and kg-export.ts already says so one
function up: `kg-export.ts:1486` mints a link into cat-bootstrap's document
with `baseUrl: base`, its OWN. Two rules for one fact.

Invisible on eleven instances because the two rules agree there. Visible on
cat-bootstrap because it is the one instance that DELIBERATELY declares no
site — its own declaration comment says "cat-bootstrap HAS NO SITE. This
instance's canonicalUrl is cat-harness's site, not cat-bootstrap's." The
configuration is right; the code's reading of it is not.

## Done when

- [x] the base falls back to the containing repo's declared base for a NESTED instance that declares none — and the third state (relative IRI + reported problem) is kept for an instance outside this repo, where the fallback would be a guess
- [x] a gate runs the foreign export the way `docs-site.yml` runs it
- [x] the gate is falsified — watched go red on the current code before the fix lands
- [x] the error message stops naming the retired `harness.json`, resolved from the constant rather than retyped
- [ ] docs-site observed GREEN on main after the merge, not assumed

## The half that matters

Not the fallback — the gate. The fast gate set was green through all seven
failures, which is why the break survived six merges. `xom7` again, one
workflow over: a red workflow looks exactly like a green one from a checkout.

## Deliberately NOT in this bean

`docs-site.yml` publishes the bootstrap graph at `cat-bootstrap.jsonld` (site
root); `feature-staging.yml` publishes it at `cat-bootstrap/cat-bootstrap.jsonld`.
Real divergence, separate bean, does not ride this fix.

## Found while gating, and fixed here because the gate cannot run without it

**One QA sidecar served every instance.** `writeQaResult(ROOT, "kg-export", …)`
used a CONSTANT stem, so `--instance ./cat-bootstrap` overwrote this
instance's committed result wholesale — `subject.id` flipped from
`cat-harness.jsonld` to `cat-bootstrap.jsonld`, findings and all, in the one
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
- the resulting `@id` is `https://litlfred.github.io/folio-assistant/cat-bootstrap.jsonld`,
  byte-identical to the IRI cat-harness's own graph mints for it — checked
  from both ends rather than pinned to a literal
