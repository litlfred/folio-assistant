---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'ig-artifact-ingestion'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/authoring-who-smart-guidelines/ig-artifact-ingestion.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/authoring-who-smart-guidelines/ig-artifact-ingestion.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/authoring-who-smart-guidelines/ig-artifact-ingestion.md){: .fa-edit-source }

{% raw %}
# ig-artifact-ingestion

> Skill id: `ig-artifact-ingestion` · Package: `authoring-who-smart-guidelines` ·
> Named by the `fhir-artifact-index` graph kind in
> `cat-harness/schemas/cat-harness.ts`, which is the declaration that sends a
> consumer here.

Point at a published FHIR Implementation Guide, read what it actually
published, and reconstruct its artefact index as a knowledge graph keyed by the
IG's own canonical URLs — linking each artefact to its JSON, JSON Schema and
JSON-LD representations.

> **Sourcing.** The artefact set, the canonical URL scheme and `artifacts.html`
> are the HL7 IG Publisher's; the DAK API layer is WHO SMART Guidelines'. This
> skill states how an index is reconstructed **in this harness** and defers to
> those for what an IG must contain. It is deliberately silent on whether an
> IG's content is correct — that is `fhir-validation`'s lane, and an index that
> started grading its subject would be doing two jobs badly.

## Which IGs this applies to

**Not all of them.** The test is whether the IG publishes a **DAK API**, and it
is answered by one fact, not by the IG's name or its publisher:

> Are there **enumeration schemas** at the published root — files matching
> `<Type>.schema.json`, such as `ValueSets.schema.json` or
> `LogicalModels.schema.json`?

If yes, `dakApi` is `present` and the overlay is ingested. If the root was read
and held none, it is `absent`. If the root was never read, it is `unknown` —
and **`unknown` is not a kind of `absent`**. "This IG publishes no DAK API" and
"nobody looked" are different facts, and only the first is a reason to stop.

An IG with no DAK API still indexes: the spine is the IG Publisher's own
output, which every IG has. What it loses is the JSON Schema and JSON-LD links,
which is the half worth having — so a no-DAK IG is a thin index, not an error.

## The index is RECONSTRUCTED, never downloaded

The finding that governs everything here, measured 2026-09-21 against
smart-trust v1.8.0:

> **No IG publishes an artefact-index instance document.**

`ValueSets.schema.json` and `LogicalModels.schema.json` sit at the published
**root** — not under `schemas/`, contrary to how `dak-api.html` links them —
and both are JSON *Schemas* describing the shape of an enumeration *response*.
Each carries an `example` block that happens to hold the real list. There is no
`ValueSets.json` to fetch.

So every field in the resulting graph was **assembled**, and the index records
in `provenance` which published file each part came out of. That is required,
not optional: a reader who cannot tell which file a row came from cannot tell a
transcription from an inference.

## Four partial views, and none of them is sufficient

Measured on smart-trust v1.8.0. The coverage gaps are the reason the pipeline
merges rather than picking a winner:

| file | entries | holds | misses |
|---|---|---|---|
| `canonicals.json` | 70 | canonical URL, version, name | the 604 Endpoints and Organizations |
| `package.tgz` → `package/.index.json` | 674 | every artefact's type and id | titles, categories, canonicals |
| `artifacts.html` | 676 links | the editorial **category** and human title | machine-readable anything |
| `package.manifest.json` | 1 | package id, version, FHIR version, build date | — |

`artifacts.html` is the **only** source of an artefact's category. Its per-row
`title` attribute carries `ResourceType/id` verbatim, which is the index's own
key format — so the category join is on an identifier the publisher wrote, not
one the pipeline composed from a filename.

**Read the source, not the page about the source.** `dak-api.html` is prose
*about* what is published, and on smart-trust it links the enumeration schemas
to a `schemas/` directory they are not in. A pipeline written from the
documentation would have found nothing at the paths it named.

## Two traps

**`openapi/openapi.json` is not the DAK API.** On smart-trust that path holds
the *DDCC Gateway* API — a domain API about certificate exchange that merely
lives there. A pipeline that globs for `openapi` files a piece of subject
matter as an artefact descriptor. The overlay is therefore keyed off **each
artefact's own stem** (`schemas/<ResourceType>-<id>.openapi.json`), never off a
directory scan.

**`.index.json` is lossy.** Its Organization entries on smart-trust carry a
truncated `"type": "["`. Do not repair such a value and do not propagate it:
`canonicals.json` is the spine for anything canonical, and for a resource that
appears only in `.index.json` the field is simply absent. An absent field is a
fact; a repaired one is a guess wearing a fact's clothes.

## What is never invented

`canonical` is **optional** on an artefact, and that is load-bearing. Examples
and instance resources have no canonical URL and are the majority of a large IG
— 604 of smart-trust's 674. Minting one to fill the slot produces an identifier
that resolves to nothing while looking authoritative, which is the failure the
who-iris catalogue refused for `collection/hq-publications` and refuses here
for the same reason.

The same holds for `category`: absent means the IG published no artefact page,
or listed no row for this artefact. It never means "Other" — the IG's own
artefact page **has** a literal `Other` section, and coining a second one would
make the word mean two things in one index.

## Materialisation

Default is **catalogue by reference**, following `who-iris`: the index records
where each artefact is published and holds no bytes. `--materialize-dak` adds
the DAK surface only — on smart-trust, 332K across 71 files, against 7.1M for
the full resource corpus.

Materialised nodes take `purpose: "working"`, never `archival`: they are
regenerable by re-running the ingest against the same source revision, so they
carry none of archival's obligations. `--check` is what proves that claim,
which is what makes the claim admissible.

Each materialised node carries all five gates of
`folio-assistant-core/schemas/materialization.ts`. Two of them —
**`sourceLoss`** and **`copyright`** — are `unknown` for a WHO IG until somebody
establishes otherwise, and leaving them `unknown` is correct rather than lazy:
no statement has been made about how long a given version's Pages build stays
reachable, and the IG's licensing has not been read. A `permitted` there would
be the "no restrictions known in context" failure that `GateVerdict` is
three-valued to prevent.

## `gh-pages` and `output/` are not the same evidence

Both are accepted (`--kind`), and the index records which was read. They are
different claims: `output/` is a **local build** whose contents depend on who
ran the publisher and when, while `gh-pages` is **what the world can see**. An
index built from the first and labelled the second asserts public availability
for artefacts that may never have been published.

Prefer `gh-pages` for anything that will be cited. Use `output/` when checking
an IG you are mid-way through authoring — and expect the index to change when
it is actually published.

## Running it

```sh
bun run ingest:ig -- \
  --source /path/to/gh-pages --kind gh-pages \
  --id smart-trust \
  --base https://worldhealthorganization.github.io/smart-trust \
  --out smart-trust --materialize-dak
```

`--base` is the URL the artefacts are **published at**, and it is not the
canonical base. smart-trust publishes at `worldhealthorganization.github.io`
and is canonical at `smart.who.int` — the index carries both, and composing
either from the other is how a link that resolves for nobody gets written down.
`canonicalBase` is read from the IG's own `ImplementationGuide` canonical, not
derived from `--base`.

`bun run ingest:ig:check` re-runs the ingest and fails if the committed index
differs. That is what makes this graph regenerable rather than a snapshot
nobody can re-derive; `readAt` is excluded from the comparison because it moves
every run by design.

## Adding another IG

1. Clone the IG's `gh-pages` (shallow, single branch — a published IG is large;
   smart-trust's is 342,656 files).
2. Run the ingest with a new `--id` and `--out`.
3. Give the new directory a declaration declaring one directory of kind
   `fhir-artifact-index`, as `smart-trust/smart-trust.config.json` does. The
   declaration is `<name>.config.json` since #695 — resolve it with
   `declarationPathIn`, never by joining a filename.
4. Add its `ingest:ig:check` invocation to the gate set, so the index cannot go
   stale silently.

Step 4 is the one that gets skipped. An index nothing re-derives is a snapshot,
and a stale snapshot of someone else's corpus is worse than no index: it
answers confidently and wrongly about artefacts that have since moved.
{% endraw %}
