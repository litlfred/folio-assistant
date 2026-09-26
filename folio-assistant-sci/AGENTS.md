# AGENTS.md — folio-assistant-sci

What binds everywhere is the repository's [`AGENTS.md`](../AGENTS.md); what
this layer *is* is [`README.md`](README.md). This layer is small, and what it
mostly needs from an agent is that things are put in the right place.

## Source material, not authored content

What lives here is what a folio **reads** in order to formalise mathematics —
not mathematics this repository writes. A proof, a definition or a chapter
belongs in a folio, which is a separate repository. If you are about to author
a mathematical claim here, you are in the wrong place.

## The placement rule, and it has already been got wrong once

`milnorlink` sat under `cat-harness/library/` beside three WHO IRIS
publications. It is **not an IRIS item**: no handle, no DSpace UUID, no
collection path, nothing in the catalogue naming it.

> **A repository named for one catalogue is not a place to keep things that
> belong to another.**

Moving it to [`who-iris/`](../who-iris/) would have been the cheaper move and
the wrong one — the next agent looking for the WHO corpus would have found a
mathematics paper in it with no way to tell why. Beans `r1lz` and `frs5`.

So when you add a source, ask which catalogue it belongs to **before** asking
which directory is convenient. If the answer is "none of them", that is a
reason to say so, not a reason to file it under the nearest one.

---

*A declared asset of this instance ([`folio-assistant-sci.json`](folio-assistant-sci.json), role
`agent-instructions`). Issue #592.*
