---
# folio-assistant-4yvj
title: 'KG DOCS: the IG Publisher and FHIR content as knowledge-graph documentation under docs/'
status: completed
type: feature
priority: normal
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-09-22T21:02:58Z
parent: folio-assistant-uhkv
---

Knowledge-graph documentation on the **IG Publisher** and on **FHIR content** —
under `docs/`, reachable, and generated where it can be.

Today the Publisher appears in this repository as a `java -jar` line in
`ig-publication` and a Docker image name in someone else's workflow. Nothing
says what it *is* as a node in the graph: what it consumes, what it emits, what
it resolves, or what it cannot be asked for.

## Scope
- [x] an IG Publisher page: the run, its inputs, its full emission list, the
      dependency closure it resolves, and the two things no post-processing
      step can do — profile validation and terminology expansion
- [x] a FHIR content page: what a FHIR IG is as content here, how `fsh`,
      `fhir-json`, the artefact index and the DAK surface relate
- [x] both linked from the docs index and reachable from the LHS navbar
- [x] no hand-edited generated directory — `gen-skill-docs.ts` and
      `gen-schema-docs.ts` own theirs

## The constraint that shapes it

**Never quote a count from prose.** The emission list changes with every
Publisher release, and `publisher.jar` is re-downloaded from the LATEST release
on every WHO build — so two builds of an unchanged commit can differ. Any page
stating what the Publisher emits says when it was read, against which version,
or it is a claim with no provenance.

## Done when
- [x] both pages exist and are reachable
- [x] `preview:site` shows them rendering — a green gate set is not a page

## Shipped, 2026-09-22

Two pages, authored as block manifests under `content/docs/` like every other
page here — not markdown dropped into the generated directory.

| page | sections |
|---|---|
| `ig-publisher` — *The FHIR IG Publisher* | overview, what one run emits, the three things nothing else can do, what it cannot be asked for, the version floats, where the rules live |
| `fhir-content` — *FHIR content* | overview, L1/L2/L3, representations, the artefact index is reconstructed, the DAK API surface, where the rules live |

**VERIFIED BY BUILDING, not by a green gate set.** `bun run preview:site`
(after `bundle install`, which the environment needed): both pages render, both
appear in the navigation, the cross-link from `fhir-content` to
`ig-publisher.html` resolves, and **each page's six `h2` headings carry six
distinct anchor ids** — which is the `gjli` defect specifically, where a
generator's output looked right and kramdown gave 22 headings one anchor.

### Two decisions worth keeping

**Neither page states a count it could not date.** The Publisher's emission
list changes with its releases and the release is not pinned, so the page says
that rather than giving a total; the DAK surface varies by two orders of
magnitude between IGs, so the page says to treat any figure as a fact about one
IG at one version.

**Each page ends with "where the rules live"**, pointing at the skills, and
says the skill wins where the two disagree. A docs page that restated a skill's
rules would be a second copy free to drift, and the copy a reader finds first
is the one with no gate behind it.

_Every box above ticked 2026-09-22 against the shipped pages, not against an
intention. The two pages are on `main` in `95e63c12`._

**A correction to this bean's own record.** An earlier edit APPENDED a second,
fully-ticked `## Done when` instead of ticking the original — so the bean was
marked `completed` while carrying six unchecked boxes, and the two lists
disagreed with each other. The duplicate is removed and the original ticked.
The repo's rule is that a bean is completed only when no unchecked item remains;
a second list is how that rule gets satisfied on paper and broken in fact.
