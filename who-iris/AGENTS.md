# AGENTS.md — who-iris

What binds everywhere is the repository's [`AGENTS.md`](../AGENTS.md); what
this layer *is* is [`README.md`](README.md). Two rules govern work here, and
both are about the difference between knowing of something and holding it.

## The gap is the point, not a shortfall

A dozen-odd nodes are modelled here; upstream reports **273,559 items** across
**1,057,223 files**. **A catalogue by reference models the SHAPE of a corpus
without holding it.** So "only a dozen" is never a finding, a backlog, or a
reason to bulk-import. An agent that treats the gap as work to be done is
misreading what this instance is for.

**No exact count is given here on purpose.** This line said *"Twelve nodes"*
and was wrong within a day of being written — a collection node landed and
nothing made the sentence follow. `bun run check:catalogue` prints the census,
and the catalogue is the answer; a count in prose is a claim rather than
evidence. The two upstream figures above ARE exact because they are
transcribed from IRIS's own pages and recorded in `catalogue/catalogue.json`
with their basis, where a change to either is a change to a checked file.

Before materialising anything, go through the gates in
[`materialize-remote`](../folio-assistant-core/schemas/materialization.ts).
Holding a thing has a cost that referencing it does not.

## Every node declares its state, and there is no default

`referenced`, `materialized`, `unknown` — a node that has not said is
**invalid**, and the check enforces it:

```sh
bun run check:catalogue
```

The reason is a distinction worth keeping: **"the author did not say" and
"the author said they could not tell" are different facts.** A default would
collapse them, and `unknown` would then mean either "nobody looked" or
"somebody looked and could not determine", with no way to tell which. This
repository has paid for that collapse elsewhere; here it is designed out.

## Is it actually an IRIS item?

A handle, a DSpace UUID, a collection path — something in the catalogue that
names it. If a document has none of these it is **not** an IRIS item, whatever
its subject, and filing it here makes the next agent looking for the WHO
corpus find something they cannot explain. Beans `r1lz` and `frs5` are the
worked example, and it went the other way: a mathematics paper that looked
like it belonged here and did not.

---

*A declared asset of this instance ([`who-iris.json`](who-iris.json), role
`agent-instructions`). Issue #592.*
