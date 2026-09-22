---
# folio-assistant-sbck
title: 'BOOTSTRAP OWES ITS JSON-LD: the renderExemption''s substitute is unmet — zero .jsonld files exist'
status: todo
type: bug
priority: high
created_at: 2026-09-21T22:14:56Z
updated_at: 2026-09-21T22:14:56Z
parent: folio-assistant-zzmr
---

Found while fixing 9poj, because the owner asked for a double-check and the
double-check failed.

## The standing ruling

`bootstrap/bootstrap.json` carries a `renderExemption` whose `owes` clause is
the owner's, 2026-09-20:

> it is exception to harness/layer not having visualtion/workflow visualizer.
> but it must have its json/jsonld... that is its existence.

The schema comment on `RenderExemption.owes` is emphatic about why that field
is required at all: "an exemption with no substitute is a hole, and a list of
holes with no substitutes is a silence list" — `2krx`. bootstrap does not drop
out of the rendering requirement; it TRADES a criterion it could fail quietly
for one it cannot.

## The measurement

    find bootstrap -name '*.jsonld' | wc -l   ->   0

Zero. Not "stale", not "partial" — the substitute this layer traded for has
never existed. The one thing the owner called its EXISTENCE is the one thing
absent.

Also checked, and this is the half that IS true: cat-harness does publish
bootstrap's DOCUMENTATION, at `cat-harness/docs/bootstrap/initialization.md`,
which is committed and renders at /bootstrap/initialization.html. That is what
9poj's `reachableAt` now links the navbar tab to. So the owner's "cat-harness
takes over render responsibilities of bootstrap's json(ld) and documentation"
is right about documentation and wrong about JSON-LD.

## Why this is a bug rather than a feature

Nothing is failing loudly. `owes` is `z.string().min(1)` — PROSE — so the
schema checks that a substitute was NAMED, never that it was DELIVERED. An
exemption whose substitute is unverified is exactly the silence list its own
comment warns against, one level further in.

## Done when

- [ ] bootstrap's graphs have published .jsonld, or the `owes` clause is
      rewritten to something true
- [ ] something CHECKS the substitute rather than only its presence in prose —
      an `owes` that no gate can verify is the defect repeating
- [ ] the 3 "declared with no published viewer" findings on bootstrap's tile
      (scenarios, skills, workflows) are reconciled with the exemption: they
      are currently reported as gaps against a layer that is exempt from
      exactly that, which reads as noise and trains readers to ignore it
