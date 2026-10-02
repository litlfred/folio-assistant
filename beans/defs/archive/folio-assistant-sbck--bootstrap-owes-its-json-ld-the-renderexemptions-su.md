---
# folio-assistant-sbck
title: 'BOOTSTRAP OWES ITS JSON-LD: the renderExemption''s substitute is unmet — zero .jsonld files exist'
status: completed
type: bug
priority: high
created_at: 2026-09-21T22:14:56Z
updated_at: 2026-09-22T07:24:15Z
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

- [x] bootstrap's graphs have published .jsonld, or the `owes` clause is
      rewritten to something true
- [x] something CHECKS the substitute rather than only its presence in prose —
      an `owes` that no gate can verify is the defect repeating
- [x] the 3 "declared with no published viewer" findings on bootstrap's tile
      (scenarios, skills, workflows) are reconciled with the exemption: they
      are currently reported as gaps against a layer that is exempt from
      exactly that, which reads as noise and trains readers to ignore it


## Summary of Changes

All three done-whens are met, and two of them were met by somebody else
before this bean was picked up — which is the reason to re-derive rather
than trust the bean's own text.

**PUBLISHED (not mine).** `dyd3` collapsed two bootstrap-graph publishers
into one: `docs-site.yml` now writes `<base>/bootstrap/bootstrap.jsonld` via
`kg-export.ts --instance ./bootstrap`, the exact path the `@id` names. The
`owes` clause is delivered. `find bootstrap -name '*.jsonld'` is STILL zero
and that is expected — the graph is generated at build time, so counting
committed files answers a different question. The `renderExemption` comment
in `bootstrap.json` asserted the opposite until 2026-09-22 and has been
corrected; a stale gap notice is worse than none.

**CHECKED (not mine either).** `kg-export.test.ts` asserts the deploy writes
`bootstrap/bootstrap.jsonld` and `bootstrap/bootstrap.json`, and that the
export's `@id` equals that URL. Removing the publish step fails the test.
Worth stating precisely: this checks BOOTSTRAP's substitute, not arbitrary
`owes` prose. `renderExemptionProblems` validates the shape and that at most
one instance claims the exemption; it cannot verify a sentence. A general
prose-verifier is not a thing to build, so the honest reading of this
done-when is "the substitute a real exemption names is gated", and it is.

**THE THIRD WAS STILL OPEN, and it is what this bean actually cost.**
`harness-tiles.ts` reported bootstrap's unrendered kinds as
`no published viewer — processes, scenarios, schemas, skills` (four by
2026-09-22, three when this was filed) against an instance declaring
`renderExemption.of: ["visualiser", "workflow-visualiser"]`.

`isExemptFrom` already existed for exactly this, and its own doc comment
says so: *"the predicate the `2krx` axis calls before raising a
no-visualiser finding, so the exemption is read from the declaration rather
than from a hardcoded instance name."* `harness-tiles.ts` IMPORTED it and
used it for `footer` while the finding twenty lines away did not — one file,
two answers to "is this instance excused".

STATED, NEVER DROPPED. `2krx` is that an opt-out without a reason per entry
becomes a silence list, so the kinds are still named and the exemption's
`owes` is named beside them: a reader sees what is unrendered AND what the
layer carries instead. Same shape as the `staging-only` finding a sibling
added, for the same reason — an intended state reported as a defect is the
same disease as a real gap hidden.

Four tests, including the two controls without which a wrong rule passes: an
instance exempt from `own-docs` still gets the gap finding (the obligation
is an argument, not a boolean), and an instance with no exemption is
unaffected.
