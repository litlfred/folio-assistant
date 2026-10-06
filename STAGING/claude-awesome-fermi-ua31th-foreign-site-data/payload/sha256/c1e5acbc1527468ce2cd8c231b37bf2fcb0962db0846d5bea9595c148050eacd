---
# folio-assistant-whlc
title: 'KG PUBLICATION: named subgraphs (referenced + hydrated), skeleton/payload split, late client-side materialization'
status: in-progress
type: epic
priority: normal
created_at: 2026-10-02T20:42:54Z
updated_at: 2026-10-04T15:12:15Z
parent: folio-assistant-vuip
---

Owner, 2026-10-02 (lead session, verbatim excerpts):
- "what we need is providing both dereferenced (inline, fully hydrated objects) and referenced (URI pointers) versions in subgraphs"
- "harness instance is implicitly a named subgraph (w/ its own rules for determining whats in it) of the whole repo's KG. Harness and (Sub)Graph share common type?"
- "maybe we can have a common base like <BASE_URL>/hydrated-graph/<HARNESS>/<NAME> as IRI for accessing a named subgraph that is independent name space from content node IRIs. that doesnt include heavy blob assets (still KG metadata not KG content)"
- "this will be a common problem on separation, referencing and managing content on subgraphs"

Umbrella for how a KG and its named subgraphs are PUBLISHED and CONSUMED: the per-subgraph JSON-LD contract, the skeleton/payload split, and client-side late materialization. Children carry the work.

Related (read before starting): 9umr (concern subgraphs), 54rk (caching + on-demand subgraph materialization), dp1j (KG affordances: browse/materialise), 7dek (render-kg-to-cdn), l9v6 (CDN layer decision for WHO L1), w5bn (large data sets), the kg-subscriptions arc (fnx4, #1719/#1756 kg:materialize).

## Done when
- [ ] every child below is completed or scrapped with reasons

_2026-10-03T08:07:45Z_ — Claimed by claude/nifty-faraday-8ql41p — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
