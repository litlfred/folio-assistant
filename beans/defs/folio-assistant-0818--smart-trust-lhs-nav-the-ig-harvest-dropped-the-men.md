---
# folio-assistant-0818
title: 'SMART-TRUST LHS NAV: the IG harvest dropped the menu AND the narrative pages — 0 of 12 menu labels resolve against 674 artefacts'
status: in-progress
type: feature
parent: folio-assistant-yj32
created_at: 2026-09-23T10:59:25Z
updated_at: 2026-09-23T10:59:25Z
---


Owner, 2026-09-23, with a screenshot of the published IG's top bar open on
*Data Models and Exchange*:

> https://litlfred.github.io/folio-assistant/smart-trust/ shoukd mirror stylin
> of https://worldhealthorganization.github.io/smart-trust/ except navar menu
> is now on LHS. … smart-guideline/base need harness

## What the harvest kept, and what it dropped — MEASURED

`smart-trust/fhir-artifact-index/index.json` carries
`source: {kind: "gh-pages", of: "…/smart-trust", readAt: "2026-09-21"}` and
**674 artefacts in 8 categories**. It carries **no `menu`**, and no raw HTML
was retained (`find smart-trust -name '*.html'` → 0).

The twelve labels visible in the owner's screenshot — Home, Business
Requirements, Data Models and Exchange, Deployment, Indices, System Actors,
Transactions, Sequence Diagrams, Trust Domains, Trust Network Gateway
Architecture, DID Trustlist Specification, HCERT Specification — were matched
against every artefact title in the index:

> **0 of 12 resolve.**

So the harvest kept the IG's FHIR **artefacts** and dropped both its
**navigation** and the **narrative pages** that navigation points at. This is
not a rendering gap; it is a gap in what was ingested.

## Why the menu was NOT transcribed from the screenshot

Three reasons, and the first alone settles it:

1. **The hrefs are not in the picture.** Writing them would mean guessing URLs
   into a published artefact. A guessed link is worse than an absent one: it
   resolves for a reader and lands somewhere nobody chose.
2. **Three of the five dropdowns are closed**, so the label set is partial too.
   A menu captured this way could not tell "this item has no children" from
   "the dropdown was shut when the picture was taken" — the `dh4f` distinction,
   at the point of capture.
3. `wjfu` already set the rule for this corpus: *"Generated from the KG, never
   transcribed."*

`SushiConfigLogicalModel` (in `smart-base/fhir-artifact-index/dak/`) already
models the shape — `menu: array`, *"Navigation menu structure for the IG"*,
with `subItems` — so the SCHEMA is not what is missing. The DATA is.

**What unblocks it:** `sushi-config.yaml`'s `menu:` block (labels *and*
hrefs), or a re-harvest that keeps the IG's HTML. Both need either the WHO
source repository — out of bounds under the owner's standing *"leave
who/smart-* alone for now"* — or network access to a host this environment
denies: `litlfred.github.io:443` and `worldhealthorganization.github.io:443`
both answered **403 CONNECT (policy denial)** when tested on 2026-09-23.
`wjfu` recorded the same denial on 2026-09-21.

## What WAS fixed — one number carrying two facts

`shell()` in `gen-smart-trust-pages.ts` took `depth = 0 | 1`. A **category**
page and an **artefact** page both passed `1`, so the `nav_exclude` written for
the 674 leaves swept the category pages out with them. The left-hand nav showed
exactly **one** smart-trust row — the index — and the structure the index is
grouped by was invisible in the one place a reader navigates from.

The comment justifying it was right about the leaves and wrong about the
sections: *"674 artefacts would bury the sidebar's real structure"* — the
categories ARE that structure.

Replaced by an explicit `NavRole`: `index` (`has_children`), `section`
(`parent` + `nav_order`), `leaf` (`nav_exclude`). `INDEX_TITLE` is one
constant referenced twice, because just-the-docs matches a child to its parent
**by title string** — written independently, a re-titled index silently orphans
every section and the sidebar quietly flattens.

## The effect is ONE row, not eight, and that is reported rather than dressed up

Only categories over `INLINE_LIMIT` (100) get their own page; 7 of the 8 are
inlined on the index. So today this adds exactly **one** child to the sidebar
(`Other`, 604 artefacts). The conflation is fixed and the structure is correct
for however many sections exist — but anyone reading "left-hand nav" in the
title should not expect eight.

Giving all 8 categories pages would change `INLINE_LIMIT`'s recorded design
decision, so it was NOT done unasked.

## Done when

- [x] measure what the harvest kept and dropped, with a number
- [x] `NavRole` replaces `depth`; sections are listed, leaves excluded
- [x] 4 tests on the RENDERED front matter, falsified both ways (2 fail when reverted)
- [x] `smart-trust:pages:check` green; 4060 tests pass
- [ ] the IG's own `menu` captured as data — **BLOCKED**, see above
- [ ] `smart-base.config.json` — offered, not yet authorised by the owner
