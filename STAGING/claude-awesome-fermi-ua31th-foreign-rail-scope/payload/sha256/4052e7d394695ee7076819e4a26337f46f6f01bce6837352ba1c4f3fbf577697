---
# folio-assistant-f233
title: 'KG DATA MODELLING: skeleton (topology index) vs content-addressed payloads; no monolithic JSON-LD'
status: in-progress
type: feature
created_at: 2026-10-02T20:42:54Z
updated_at: 2026-10-03T11:17:21Z
parent: folio-assistant-whlc
---

Owner, 2026-10-02 ("bean up #1: add to data modeling/schema design for the KG skills"): "do not emit single, monolithic JSON-LD files. Instead, split the build into a lightweight skeleton and heavy material assets. The Skeleton (Topology Subgraph): JSON-LD Framing to generate a highly compressed 'index' graph … only topological relationships and critical metadata (node URIs, types, labels) required for searching. All heavy content (Markdown bodies, base64 images, deep historical provenance) stripped out, leaving only URI pointers. The Muscle (Asset Payloads): emit the heavy, fully hydrated JSON-LD content and binary assets as highly granular, content-addressed individual files. This drives layout of dirs / tying to IRIs. Named subgraphs."

## Done when
- [ ] the KG data-modelling skill(s) state the rule: skeleton vs payload, what belongs in each, and that no generator emits a monolithic graph file
- [ ] the directory layout and IRI scheme for payloads are specified (content-addressed paths; how a skeleton pointer resolves to a payload)
- [ ] existing monolithic emitters are inventoried, each with a follow-up bean or a reason it stays
- [ ] consistent with the named-subgraph contract (sibling bean)

_2026-10-03T11:17:21Z_ — Claimed by claude/nifty-faraday-8ql41p — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
