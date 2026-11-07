# smart-base

The **WHO SMART Guidelines base layer** — the ingested WHO digital-health
corpus, the methodologies read out of it, and the editorial voices derived
from it.

**Contents**

<!-- readme:toc:begin -->

- [What this layer is for](#what-this-layer-is-for)
- [What it is not](#what-it-is-not)
- [Re-deriving an entry](#re-deriving-an-entry)
- [Counts](#counts)

<!-- readme:toc:end -->

## What this layer is for

WHO digital health guidance is spread across many publications. This layer
makes them machine-readable: L1 sections in a library, methodologies adopted
from them (the **Digital Implementation Investment Guide** first), and voice
profiles whose every rule cites the page it was read from.

## What it is not

**It is not a copy of `WorldHealthOrganization/smart-base`.** That repository
stays the home of the DAK toolchain (~54 Python scripts called by the DAK
repositories' GitHub Actions). This layer references it and never vendors it;
`smart-base-tools` carries the wrapper.

**It does not own the IG pipeline layering.** It holds knowledge-graph assets.

## Re-deriving an entry

```sh
bun run cat ingest uploads/FILE.pdf --library smart-base
```

Nothing under `library/` is edited. A wrong section is a defect in the rung
that read it or in the upstream document — see [`AGENTS.md`](AGENTS.md).

## Counts

Not given here: count the directory.
