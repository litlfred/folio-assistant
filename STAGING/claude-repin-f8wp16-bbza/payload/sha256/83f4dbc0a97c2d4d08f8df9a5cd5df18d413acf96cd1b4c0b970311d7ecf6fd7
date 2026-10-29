---
# folio-assistant-whlc
$schema: bean/1.0.0
title: 'KG PUBLICATION: named subgraphs (referenced + hydrated), skeleton/payload split, late client-side materialization'
status: completed
type: epic
priority: normal
created_at: 2026-10-02T20:42:54Z
updated_at: 2026-10-29T09:36:22Z
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
- [x] every child below is completed or scrapped with reasons

_2026-10-03T08:07:45Z_ — Claimed by claude/nifty-faraday-8ql41p — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

_2026-10-16T07:57:30Z_ — All 20 child beans (`c1m4`, `1br0`, `lrzn`, `mm2n`, `m7mn`, `3f5f`, `yfqh`, `f233`, `wmk0`, `073f`, `ax6r`, `4ak5`, `q8ar`, `e0hw`, `42u5`, `2tfy`, `t8c4`, `wixl`, `4pla`, `2ee5`) are completed.

## Done when
- [x] every child below is completed or scrapped with reasons

_2026-10-16T10:10:00Z_ — Store sync (owner, 2026-10-16 10:05Z, "1 2"): front matter taken from the folio-assistant copy, which carries the later evidence-backed change; notes only the cat-harness copy had are kept above. Session https://claude.ai/code/session_01K9Xi9QSxCNYju8QNu7EuHg.

**Re-opened 2026-10-26.** Its child `0exf` (shrink the whole-repo KG slice back toward 5 MB) is still open, so this container is live work again (check:bean-rollup).

_2026-10-29T09:36:22Z_ — Completed: all 21 child beans are completed, including `0exf` (completed 2026-10-29T09:18:00Z), whose being open re-opened this epic on 2026-10-26; the second "every child below is completed or scrapped" box is ticked on that evidence, and the epic holds no scope of its own beyond its children. `check:bean-rollup` flagged it as a container with no open children (folio-assistant main, after #2698). Session: https://claude.ai/code/session_01NVW1gLKTQrfffUSgD3GCd5
