# AGENTS.md — detangle

What binds everywhere is the repository's [`AGENTS.md`](../AGENTS.md); what
this layer *is* is [`README.md`](README.md). One rule governs work here, and
it is about what you are **not** allowed to conclude.

## The scanner decides nothing, and neither do you from its output

It emits **findings** with a `script` reviewer and a severity. The carve is a
`Decision` by a human or agentic adjudicator, and that adjudicator **may
overrule any finding here** — a theme a scanner cannot see is a real reason,
and so is a boundary somebody intends to enforce before the edges exist to
prove it.

So: do not carve a subgraph because the numbers look good, and do not argue
that a carve is wrong because they look bad. **What the numbers buy is not
authority — it is that the adjudication becomes reviewable.** *"Carved anyway,
cohesion 0.31, because X"* is a durable claim; *"carved"* is not.

## The criterion is a near-SINK, not a small cut

> arrows mostly one way

Ten edges in and ten out is a cut of twenty and cannot be lifted. Fifty in and
zero out is a cut of fifty and lifts cleanly. **The direction is the test, and
the size of the cut is not** — an agent optimising for a small cut is
answering a different question from the one asked.

Before you treat a direction as a fact, check whether it is a **filing
decision**: an edge that points one way because somebody chose where to put a
file is not evidence about the graph's shape.

---

*A declared asset of this instance ([`detangle.json`](detangle.json), role
`agent-instructions`). Issue #592.*
