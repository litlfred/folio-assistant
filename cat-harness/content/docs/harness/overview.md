A **Harness** is the layer that makes a [KGraph](kgraph.html) usable: it
renders the graph, serves an interface over it, and supplies the Skills,
Workflows and Tools an Agent works the graph with. The KGraph says what is
true; the Harness is how anybody reaches it.

A checkout holds several. They stack, bottom to top — `bootstrap`, then
`cat-harness`, then `folio-assistant-core`, then `folio-assistant` — and each
inherits what the ones below it declare. That stacking is the subject of this
page, along with the two things a Harness owes anything it takes charge of.

**The key words MUST, MUST NOT, SHOULD and MAY are used here as
[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) defines them**, and only in
upper case, per [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174). Where a
requirement below is **not yet enforced by a gate**, this page says so at the
requirement rather than in a footnote: a conformance statement a reader cannot
tell from a description of existing behaviour is worse than either.
