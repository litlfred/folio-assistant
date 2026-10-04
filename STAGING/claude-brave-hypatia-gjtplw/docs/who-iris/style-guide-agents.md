# Working on the WHO style guide's voices

What binds everywhere is the repository's [`AGENTS.md`](../../AGENTS.md),
then who-iris's [`AGENTS.md`](../AGENTS.md); what the style guide *is* is
[`style-guide.md`](style-guide.md). One rule governs the voices in
[`skills/voices/`](../skills/voices/).

## A voice is DERIVED FROM a publication; it is not the publication

The three source documents live in this instance's
[`library/`](../library/), and they stay there. Every rule in a voice cites
`{ libraryId, sectionId }` and resolves against that library. The voices and
the library have been one instance since 2026-10-01 (bean `qsx4`); before
that, the voices were the separate `who-style-guide` instance and cited
across the boundary.

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

*Was `who-style-guide/AGENTS.md`, that instance's `agent-instructions` asset
(issue #592). It moved into who-iris's docs subgraph when the style guide
became a subgraph of who-iris (bean `qsx4`). It is not kept beside the voices
because any `.md` other than a README inside a skills directory is read as a
skill: `gen-skill-docs` demanded a category for a package called `voices`.*
