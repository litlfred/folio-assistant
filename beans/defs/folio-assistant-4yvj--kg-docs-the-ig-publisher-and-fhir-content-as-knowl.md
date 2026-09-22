---
# folio-assistant-4yvj
title: 'KG DOCS: the IG Publisher and FHIR content as knowledge-graph documentation under docs/'
status: todo
type: feature
priority: normal
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-09-22T19:24:34Z
parent: folio-assistant-uhkv
---

Knowledge-graph documentation on the **IG Publisher** and on **FHIR content** —
under `docs/`, reachable, and generated where it can be.

Today the Publisher appears in this repository as a `java -jar` line in
`ig-publication` and a Docker image name in someone else's workflow. Nothing
says what it *is* as a node in the graph: what it consumes, what it emits, what
it resolves, or what it cannot be asked for.

## Scope
- [ ] an IG Publisher page: the run, its inputs, its full emission list, the
      dependency closure it resolves, and the two things no post-processing
      step can do — profile validation and terminology expansion
- [ ] a FHIR content page: what a FHIR IG is as content here, how `fsh`,
      `fhir-json`, the artefact index and the DAK surface relate
- [ ] both linked from the docs index and reachable from the LHS navbar
- [ ] no hand-edited generated directory — `gen-skill-docs.ts` and
      `gen-schema-docs.ts` own theirs

## The constraint that shapes it

**Never quote a count from prose.** The emission list changes with every
Publisher release, and `publisher.jar` is re-downloaded from the LATEST release
on every WHO build — so two builds of an unchanged commit can differ. Any page
stating what the Publisher emits says when it was read, against which version,
or it is a claim with no provenance.

## Done when
- [ ] both pages exist and are reachable
- [ ] `preview:site` shows them rendering — a green gate set is not a page
