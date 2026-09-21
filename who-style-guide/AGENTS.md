# AGENTS.md — who-style-guide

What binds everywhere is the repository's [`AGENTS.md`](../AGENTS.md); what
this layer *is* is [`README.md`](README.md). One rule governs everything here.

## A voice is DERIVED FROM a publication; it is not the publication

The three source documents live in [`who-iris/library/`](../who-iris/library/),
and they stay there. Every rule in a voice cites
`{ instance: "who-iris", libraryId, sectionId }` and **resolves across the
instance boundary**.

So: **do not copy source text into this layer.** A quoted rule carries its
quote and its page so a reader can check it; a copied document is a second
copy of a corpus that already exists, free to drift from the one that is
catalogued, and nothing would say which is authoritative.

## Every rule carries its quote and its page

That is what makes a voice auditable rather than asserted. A rule added
without them is not a terser rule — it is an unsourced one, and a reader has
no way to tell whether it came from the publication or from an agent's
impression of it.

If you cannot find the page, say so rather than dropping the citation: a rule
marked as un-located is a different fact from a rule that never needed one.

## Adding a voice

It is derived from **one** publication, read rule by rule. A voice assembled
from several is not a house voice, it is a synthesis, and the thing it loses
is exactly the property above — a reader can no longer check a rule against
the document it came from.

---

*A declared asset of this instance ([`who-style-guide.json`](who-style-guide.json), role
`agent-instructions`). Issue #592.*
