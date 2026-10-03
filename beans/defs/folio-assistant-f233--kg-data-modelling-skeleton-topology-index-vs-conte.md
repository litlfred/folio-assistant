---
# folio-assistant-f233
title: 'KG DATA MODELLING: skeleton (topology index) vs content-addressed payloads; no monolithic JSON-LD'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-02T20:42:54Z
updated_at: 2026-10-03T11:17:35Z
parent: folio-assistant-whlc
---

Owner, 2026-10-02 ("bean up #1: add to data modeling/schema design for the KG skills"): "do not emit single, monolithic JSON-LD files. Instead, split the build into a lightweight skeleton and heavy material assets. The Skeleton (Topology Subgraph): JSON-LD Framing to generate a highly compressed 'index' graph … only topological relationships and critical metadata (node URIs, types, labels) required for searching. All heavy content (Markdown bodies, base64 images, deep historical provenance) stripped out, leaving only URI pointers. The Muscle (Asset Payloads): emit the heavy, fully hydrated JSON-LD content and binary assets as highly granular, content-addressed individual files. This drives layout of dirs / tying to IRIs. Named subgraphs."

## Done when
- [x] the KG data-modelling skill(s) state the rule: skeleton vs payload, what belongs in each, and that no generator emits a monolithic graph file
- [x] the directory layout and IRI scheme for payloads are specified (content-addressed paths; how a skeleton pointer resolves to a payload)
- [ ] existing monolithic emitters are inventoried, each with a follow-up bean or a reason it stays
- [x] consistent with the named-subgraph contract (sibling bean)



## Owner ruling 2026-10-03 — payload address scheme
Selected `<BASE_URL>/payload/sha256/<hex>`: content-addressed, immutable, cacheable forever; an index or hydrated node points to its payload by that IRI. Rejected: beside-each-node paths, defer.

_2026-10-03T11:17:21Z_ — Claimed by claude/nifty-faraday-8ql41p — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## Implemented 2026-10-03 — payload emission
Measured over kg-export's graph (3,120 nodes, 2.5 MB, no literal over 4.6 KB — the graph already inlined no body). Heavy set = what pointers name: Skill `instructionsPath` (300 .md, 3.0 MB) and Asset `path` (3 .md, 12 KB). Not heavy yet: Process/Decision `sourcePath` (BPMN/DMN, topology already in the graph), Schema `module` (.ts, code). `gen-subgraph-jsonld.ts` writes `docs/payload/sha256/<hex>` + `<hex>.json` media-type sidecar (303 payloads, 606 files, ~3.07 MB); both subgraph files carry `payload: {@id, sha256, bytes}`; `subgraph:jsonld:check` runs the orphan audit both ways. Contract: kg-export.md §"Payloads — heavy content by content address"; schema: `schemas/subgraph-manifest.ts`. Box 3 (inventory of monolithic emitters) remains open: `kg-export` `<stub>.jsonld`, `kg-locale-export`, `fsh-guts-export` and `harness-schema-export` are the candidates, none yet beaned.
