---
# folio-assistant-op30
title: 'DOCS OBLIGATION: an instance owes its own docs/, with a QA axis — 1 of 11 has one, and it is the instance with no README'
status: todo
type: task
priority: normal
created_at: 2026-09-20T20:23:57Z
updated_at: 2026-09-20T20:23:57Z
parent: folio-assistant-yj32
---

Owner, 2026-09-20:

> bean up that other harnesses need `docs/` make QA sidecar. (like harnesses
> need READme)

So `docs/` becomes an instance-level **obligation** with a QA axis behind it,
the same shape the README requirement already has — `check:subgraph-coverage`
already reports *"N instance(s) have no starting README OF THEIR OWN — an
instance a reader cannot enter."*

## Measured 2026-09-20, and the numbers are the argument

| instance | `docs/` | declares a `docs` graph | README |
|---|---|---|---|
| `cat-harness` | **yes** (292 md) | **yes** | **NO** |
| `agent-skills` | no | no | yes |
| `cat-bootstrap` | no | no | yes |
| `detangle` | no | no | yes |
| `folio-assist-sci` | no | no | yes |
| `folio-assistant-core` | no | no | yes |
| `folio-assistant` (root) | no | no | yes |
| `kg-navigation` | no | no | yes |
| `large-datasets` | no | no | yes |
| `who-iris` | no | no | yes |
| `who-style-guide` | no | no | yes |

**11 instances. One has `docs/`. Ten have a README.** And the one instance
that HAS documentation is the one with no README — so the two obligations are
currently satisfied by disjoint sets, which is the sharpest argument that they
are two axes rather than one.

## What a `docs/` is FOR here, which the axis has to encode

Owner, same session, and it settles what a subject page under a handler means:

> `<base>/cat-harness/docs/` is where all harness user documentation is... so
> documentation at `<base>/cat-harness/docs/who-iris/` is more documentation
> ABOUT iris, how it is ingested etc. **not the iris content**. source content
> is repo root `who-iris/docs`. part of cat-handler `docs/` handler is to look
> out for `docs/` directories in harness kinds.

Two distinct things, and an axis that conflates them will pass a repository
where half the documentation is missing:

1. **An instance's OWN `docs/`** — its source content, at `<instance>/docs/`.
   This is what the obligation is about, and it is what ten instances lack.
2. **The handler's rendering of it** — `<base>/cat-harness/docs/<subject>/`,
   which is documentation *about* the subject, produced by cat-harness's
   machinery. Not the subject's content relocated.

## The blocker, and it is one line of declaration

`cat-harness/harness.json`'s `docs` entry carries **`dependents: "skip"`**,
which is exactly what stops a dependent instance from getting its own `docs/`.
Bean `n0nf` records the same finding from the root's side — the root has no
`docs/`, the site builds from `cat-harness/docs`, and `skip` is why.

So this bean and `n0nf` are one mechanism seen from two ends, and **whoever
changes `skip` should read both**. Changing it is not free: `dependents` was
made required four hours before the `coverage` field landed, and main added
two entries without it — 166 failures and 35 errors on the merged tree. A
change to a `dependents` value is a change every concurrent branch pays for.

## The axis, designed against this repository's own rules

- **Three states, not two.** "No `docs/`" and "could not determine" are
  different answers, and an instance whose declaration will not parse has not
  been shown to lack documentation — it has been shown to be unreadable.
- **An opt-out carries a REASON**, never a bare true, and the value IS the
  reason — the rule `SubgraphCoverageSchema.exempt` already states. An
  instance that genuinely needs none (`cat-bootstrap`? it is already exempt
  from `visualiser` by layer) says why.
- **Do not gate on day one.** Ten of eleven would fire immediately, and the
  repository's own rule is that a check firing on every one of its subjects is
  a check that is wrong. Report, rank, let the count fall — the same staging
  `2krx` asked for, and the same reason.
- **Declare only what exists.** Nothing should declare a `docs` graph for an
  instance that has no directory: a declared-but-absent directory is the
  `dh4f` defect, where a consumer scans nothing and reports a clean run over
  it.

## Done when

- [ ] A QA sidecar reports, per instance, whether it has its OWN `docs/` —
      three states, with the opt-out carrying a reason.
- [ ] The README obligation and this one are reported as SEPARATE axes, since
      the sets that satisfy them are currently disjoint.
- [ ] `dependents: "skip"` on cat-harness's `docs` entry is resolved with
      `n0nf`, one way, stated.
- [ ] Falsified both directions: an instance with `docs/` is not reported, and
      removing it makes it appear.
- [ ] `cat-harness` gets a README of its own, or an exemption with a reason —
      it is the one instance that has documentation and no front door.
