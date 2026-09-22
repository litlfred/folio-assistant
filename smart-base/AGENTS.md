# AGENTS.md — smart-base

The **WHO SMART Guidelines base layer**: the ingested WHO digital-health
corpus, the methodologies read out of it, and the editorial voices derived
from it.

> ## 🛑 Three rules, and each one has already been broken somewhere
>
> **1. Nothing under `library/` is authored, so nothing under it is edited.**
> Every section was produced from an ingested PDF by `bun run ingest`. A
> hand-edit is not a change — it is a defect that the next re-ingest
> overwrites. If a section is wrong, the fix is in the rung that read it, or
> in the upstream document. Never here.
>
> **2. A rule with no resolvable citation is refused, not downgraded.** Every
> voice rule carries `{ libraryId, sectionId, pages, quote }` and
> `check:voices` fails one whose citation does not resolve. This is not
> ceremony: PR #210 asserted that WHO house style was `-ise`, from common
> belief, and the Editorial Style Manual says `-ize` on page 14. A voice is
> auditable or it is one agent's taste.
>
> **3. The upstream toolchain is loaded, never vendored.**
> `WorldHealthOrganization/smart-base` carries ~54 Python scripts and its DAK
> repositories' own GitHub Actions invoke them in place. A copy here would be
> a second, drifting toolchain. See `smart-base-tools` for the wrapper and
> `SMART_BASE_HOME`.

## What is here

`library/` — one `<bib-slug>/` per ingested WHO publication. This is L1 source
content, and **every** knowledge-graph reference to one of these documents
resolves through it. That is why the bytes could not stay in `uploads/`: the
corpus-grep checklist searches `library/` only, so a publication sitting in the
incoming queue makes a clean grep mean *"nobody has done this"* while the
source is right there.

## What is coming, and why it is not declared yet

`methodologies/`, `skills/voices/` and `scenarios/` are declared in the commits
that create their content, never ahead of it. A declared-but-absent directory
is the `dh4f` defect — every consumer scans nothing and reports a **clean run**
over it, which is worse than a missing declaration because it reads as a
result. `who-iris` held its own `library` entry back on the same ground.

## The order is forced, and it is not a preference

A methodology is adopted by **rendering it faithfully from the source**, and a
voice rule cites a section by id. Neither can be written before the document it
draws on is in `library/`. So ingestion is not the first of four tasks; it is
the precondition for the other three. An agent that writes the DIIG methodology
from its own recollection of DIIG has not adopted a methodology — it has
written a house process and dressed it as an adoption, which is exactly what
`methodology-adoption` §1 refuses.

## Ingesting a document

```sh
bun run ingest uploads/FILE.pdf --library smart-base --dry-run   # which rung, and why
bun run ingest uploads/FILE.pdf --library smart-base
```

`--library` is **required** here rather than defaulted: this repository
declares several, and the destination is said rather than guessed.

**The rung is chosen mechanically and an inferred chapter tree is refused.**
Absence of an embedded outline selects *page* granularity; it never selects
"infer one". Bean `6xaz` records two documents where inference was confidently
wrong and the output did not show it. A PDF the prober cannot read is reported
`undetermined` and is **not** ingested — a document filed under the wrong rung
reads as ingested while its structure is wrong.

## Adopting a methodology here

Follow `methodology-adoption`. Its refusals bind, and the third is the one this
layer is most exposed to: **never quantify a judgement to make it look
measured.** Where a WHO method scores and sums, adopt the structure and refuse
the arithmetic — a total reads as a measurement, and the weights were invented.
State where the rendering stops, and state what was refused; a silent omission
misrepresents the standard.

## Against its neighbours

| | |
|---|---|
| `who-iris` | the IRIS catalogue — the *shape* of a corpus of 1,057,223 files, almost none of it held |
| `who-style-guide` | the three WHO editorial voices already derived, and the model this layer's voices follow |
| `smart-trust`, `smart-immunizations` | reconstructed artefact indexes of published IGs; provisional per `nsbb` |
| `smart-kg` | judgement methodologies for WHO L1 guideline development (GRADE) |
