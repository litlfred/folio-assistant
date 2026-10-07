---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'L1 coverage'
parent: Skill instructions
---

{: .note }
> Generated from [`folio-assistant-core/skills/library/ingestion/l1-coverage.md`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/skills/library/ingestion/l1-coverage.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/folio-assistant-core/skills/library/ingestion/l1-coverage.md){: .fa-edit-source data-fa-link="edit" data-src="folio-assistant-core/skills/library/ingestion/l1-coverage.md" data-repo="litlfred/folio-assistant" }

{% raw %}
# L1 coverage — nothing normative goes missing silently

Issue [#2405](https://github.com/litlfred/folio-assistant/issues/2405) FR-009:
*any L1 extraction SHALL produce a coverage QA report; every normative
sentence in the source is captured, or excluded for a reason from a fixed
list; the target is 100 % accounted for.* Generic authoring and review, so it
lives here in core (decision 1 of 2026-10-07). The report's fields and what
its numbers mean are fixed by smart-kg's `docs/COVERAGE.md`; this is the
implementation that contract says core owns.

## Why

An extraction — by hand or by a tool — fails silently: a recommendation that
never became a node leaves no trace in the graph, because the graph cannot
report what it does not hold. Bean `8pzh` measured the sharpest case: a
label-based extractor found **0** recommendations in a WHO position paper
(WER 92(17), measles, 2017) because position papers print no
"Recommendation N" labels. Only a check that reads the **source** catches
that.

## Run it

```sh
bun run cat l1:coverage --text pages.json --captured captured.json \
  [--exclusions exclusions.json] [--out report.json]
```

| input | shape |
|---|---|
| `--text` | the BODY text, page-tagged: `{"pages":[{"page":3,"text":"…"}]}`, or plain text with a form feed between pages (what `pdftotext` writes). Strip references, running headers and the table of contents first — the script cannot tell a header from a sentence. |
| `--captured` | `[{"id":"rec-1","text":"…"}]` — every captured statement, verbatim |
| `--exclusions` | `[{"location":"p3:s7","reason":"background-fact","signedOffBy":"…","signedOffAt":"…"}]`, or `text` in place of `location` |

Exit 0 only at 100 % accounted-for (or when nothing in the source is
normative — the percentages are then `null`, never 100); 1 below target or on
an exclusion with an unknown reason; 2 on unusable input. The per-page table
goes to stderr, the report to `--out` or stdout.

## Reading the numbers

- **Accounted-for is the target, captured is beside it.** A publication
  legitimately holds normative-looking sentences that are not
  recommendations ("all regions should have eliminated measles by 2020" is
  history). A 100 % accounted-for made mostly of exclusions is visible as a
  low captured %.
- **A proposed exclusion is not an exclusion.** Without `signedOffBy` the
  sentence stays unaccounted. An agent may PROPOSE an exclusion; only a
  person signs it off — the same rule as every other judgement
  (`req:agent-workflow` → `judgement-stays-human`).
- **The reasons are fixed**: `background-fact`, `manufacturer-statement`,
  `editorial`, `research-question`, `duplicate-of:<captured id>`. A sentence
  that fits none is either a missing capture or a missing reason, and both go
  to a person — never to a sixth string.
- **Matching is normalised substring** (case, quotes, dashes, whitespace). A
  paraphrased capture reads as unaccounted on purpose: a near match is a
  judgement, and the report does not make it for you.
- **The marker list is closed and English** (contract §1): `should`,
  `shall`, `must`, `recommend*`, `should not`, `is not a reason`, `are not a
  contraindication`, and `may be` + given/administered/offered/considered/
  used/co-administered/implemented. Bare `may` does not count.

## Where it sits

After [`l1-document-ingestion`](l1-document-ingestion.md) has produced the
entry and an extraction has produced the captured statements; before the
extraction is reviewed or promoted. `check:l1-complete` asks whether an L1
entry is structurally complete; this asks whether its **normative content**
was all accounted for. They are different questions and neither implies the
other.
{% endraw %}
