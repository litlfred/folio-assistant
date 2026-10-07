---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'dak-l1-library'
parent: Skill instructions
---

{: .note }
> Generated from [`smart-base/skills/content/authoring-who-smart-guidelines/dak-l1-library.md`](https://github.com/litlfred/folio-assistant/blob/main/smart-base/skills/content/authoring-who-smart-guidelines/dak-l1-library.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/smart-base/skills/content/authoring-who-smart-guidelines/dak-l1-library.md){: .fa-edit-source }

{% raw %}
# dak-l1-library

> Skill id: `dak-l1-library` · Package: `authoring-who-smart-guidelines` ·
> Named by `l2-dak-authoring.bpmn` step **Build the L1 library from
> Component 1**, in the `Business analyst` lane. Bean `5uyl`.

**Every library built for a DAK starts from the DAK's own Component 1.**
Component 1 — "Health interventions and recommendations" — is where a DAK
says which WHO guidelines and guidance it operationalises: §1.1 lists the
interventions, §1.2 names the sources, each with a printed `(n)` into the
DAK's reference list. Those sources are the DAK's L1. A library that holds the
DAK but not what Component 1 cites cannot answer the question an L1 graph
exists for: *which recommendation does this decision rule implement?*

## The pattern

1. **Fetch the DAK** from WHO IRIS with
   `bun run folio-assistant-core/scripts/fetch-dspace-item.ts <handle URL> --out uploads`.
   It writes the PDF, the item's Dublin Core record (`folio-dublin-core/v1`)
   and an `intake.json` whose licence is the record's `dc.rights` — stated only
   when the repository states it.
2. **Ingest it**: `bun run ingest uploads/<doc_id>/<doc_id>.pdf`. A WHO PDF
   with no outline is ingested by page; that is correct, and Component 1 is
   found by its headings, not by the outline.
3. **Extract Component 1**:
   `bun run smart-base/scripts/extract-dak-l1-references.ts --entry library/<doc_id>`.
   It reports how many citations it read, which it resolved, and which rest on
   the printed number alone.
4. **Fetch and ingest every cited source with a retrievable PDF** — steps 1
   and 2 for each IRIS handle the graph's publications carry — then **run
   step 3 again**: a publication the library now holds takes its properties
   from that entry's Dublin Core record (ISBN, date, rights, the PDF's sha256)
   instead of from the DAK's one-line reference.
5. **Validate twice**: `--validate <smart-kg checkout>` runs WHO smart-kg's
   `tools/validate.mjs`; `--validate-zod <smart-base checkout>` runs the Zod
   validator in `smart-base/kg`, which also checks property VALUES. Both must
   pass.
6. **Leave fidelity to a person.** The run lists each citation whose words
   differ from its reference title. Someone opens the DAK page and the source
   and confirms it; nothing marks that check passed automatically.

## What the graph holds, and what it refuses

| node | from | derivation |
|---|---|---|
| `external-artifact` | the DAK page doing the citing (§1.1, §1.2) | derived |
| `citation` | each printed `(n)`, text verbatim | derived |
| `publication` | the reference the number points at — or the held entry's Dublin Core | inferred |
| `health-intervention` | each item §1.1 lists | derived |

**A citation resolves by its printed number**, into the numbered list that
holds every cited number with the most title agreement — a DAK has several
numbered lists, and choosing one is the judgement, recorded on every edge.
Title agreement is corroboration: a card often *describes* its source rather
than naming it, so low agreement is flagged for step 6, not treated as a miss.

**An unnumbered mention stays unresolved.** §1.1's "WHO universal health
coverage list of essential interventions" has no number; its best title match
is named in the note and not asserted.

**publicationType comes only from the title's own words** (`summary tables`,
`guideline`, `guidance`, `classification`). A data portal or a reporting form
has none, and is left without one rather than forced into the nearest code.

## Where the files go

The graph is written beside the DAK's entry as
`smart-kg-l1-dak-references.json` — not `smart-kg-l1.json`, which is the
recommendation extractor's (`extract-smart-kg-l1.ts`). The DAK repository
holds the library: `library/<doc_id>/` for each entry, and
`uploads/<doc_id>/intake.json` plus the Dublin Core record for each fetched
item. The PDFs themselves are pinned by sha256 and not committed.

## What it cannot do yet

- **The position papers behind a summary table.** (29) in the immunizations
  DAK is the routine-immunization summary tables, which cite the WHO vaccine
  position papers. smart-kg L1 has no edge from one publication to a
  publication it cites, so following them needs an ontology change first.
- **Sources outside WHO IRIS.** `fetch-dspace-item.ts` speaks DSpace 7; a
  who.int page, a PAHO IRIS item behind a different network policy, or a
  spreadsheet is recorded with its URL and reported, not fetched.

## Schemas this rests on

- the L1 ontology and graph shape: `smart-base/kg` in litlfred/smart-base —
  Zod, migrated from WHO smart-kg main, generating the `KG*` logical models,
  code systems and value sets;
- the Dublin Core record: `folio-assistant-core/schemas/dublin-core.ts`;
- the intake and its licence: `cat-harness/schemas/intake.ts`,
  `cat-harness/schemas/source-licence.ts`.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [L2 DAK authoring](../../processes/l2-dak-authoring.html) | Build the L1 library from Component 1 |

