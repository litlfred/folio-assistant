# who-iris

**The WHO Institutional Repository for Information Sharing, catalogued by
reference.** Staged as a top-level directory ahead of becoming its own
repository, where it will carry its own tools and themes.

## What is here, and what is only known about

| | |
|---|---|
| files upstream | **1,057,223** |
| storage upstream | **361.55 GB** |
| top-level communities | **8** |
| nodes modelled here | **12** — 9 `referenced`, 3 `materialized`, 0 `unknown` |

Measured from IRIS's own storage report (By Location → Entire Site) and
community list on 2026-09-20. **The gap between 12 and 1,057,223 is the point**,
not a shortfall: a catalogue by reference models the *shape* of a corpus without
holding it.

Every node declares its state and **there is no default** — a node that has not
said is invalid, because "the author did not say" and "the author said they
could not tell" are different facts.

```sh
bun run check:catalogue
```

## The worked example closes a loop

`wpr-rdo-2020-003-eng` — the *Publication and information products style guide*
— is the one fully-worked item, and it was chosen because it is not arbitrary:
its **IRIS item page** supplies the webpage theme's source, and the
**publication itself** defines the WPRO publication theme. The artefact whose
style guide states the palette is the artefact whose repository page
demonstrates one.

Its record carries every identifier read off the captured DSpace full item
record — UUID, two Handles, govdoc number — and one discrepancy kept rather than
reconciled: `dc.description` says `30 p.` while the ingested PDF has **33**
pages.

The other two items (`who-pub-tps-931`, `9789241548960-eng`) have **no IRIS
capture**. Their records are derived from the PDFs and say so; they are
placeholders, not records. See
[`skills/iris-dspace.md`](skills/iris-dspace.md) §R8 for why that distinction
earns a requirement of its own — the derived title for one of them is `Abies`.

## Not declared yet, on purpose

There is **no `library` entry** in `harness.json`. The three documents are still
under `cat-harness/library/` (bean `frs5`), and declaring a directory that is
not there is the `dh4f` defect — every consumer scans nothing and reports a
clean run over it.

The absence is useful rather than merely honest: `resolveLibraryRef` answers a
citation naming this instance with **`no-library-graph`**, which is a different
and more actionable finding than "that section is missing".
