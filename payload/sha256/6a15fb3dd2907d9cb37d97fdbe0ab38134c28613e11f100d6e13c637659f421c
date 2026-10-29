# AGENTS.md — folio-assist-core

This directory is a **staged instance**, not a repository yet. The agent
guidance that governs work here is the root
[`AGENTS.md`](../AGENTS.md); everything it says about beans, briefs, process
state and continual progress applies unchanged.

What is specific to this layer, and it is one rule:

> **Core owns content vocabulary; the harness owns the harness.**
> A schema describing what a folio HOLDS, where it CAME FROM, or how much of it
> is actually PRESENT belongs here. A schema describing skills, workflows,
> roles or tools belongs in `cat-harness/`.

The line is not stylistic. `BASE_GRAPH_TYPOLOGIES` in
`cat-harness/schemas/cat-harness.ts` records the owner's own phrasing of it, and
`schemas/folio-graph-typology.ts` shows what goes wrong when a layer owns a kind it
cannot serve.

**Before adding anything here**, read [`README.md`](README.md) — in particular
the three materialisation states, which have no default and are checked rather
than assumed. The state NAMES (and fixity) are the one owner-ruled
exception to the rule above: they live in `cat-harness/schemas/materialization-state.ts`
(bean `tlat`), and the gates that judge content stay here.

## The skills this layer publishes

<!-- cat-harness:skills:begin -->

_30 skills in 8 directories, generated from each skill's front matter. `bun run cat readme:sync` rewrites this list and `readme:sync:check` fails when it is stale. Skills this repository inherits are listed by the repositories that publish them._

**`skills/`** (1)

| Skill | What it is for |
|---|---|
| [`deep-document-research`](skills/deep-document-research.md) | Answer a question from a corpus this folio already holds, iteratively, and stop on a stated condition. |

**`skills/content/content-lifecycle-ext/`** (4)

| Skill | What it is for |
|---|---|
| [`corpus-commit-contract`](skills/content/content-lifecycle-ext/corpus-commit-contract.md) | The contract the `corpus` role is held to when an accepted edit is committed into it: take the write only on the editor's acceptance, as one change with its QA sidecars, under the commit-hygiene… |
| [`quality-control`](skills/content/content-lifecycle-ext/quality-control.md) | Apply the publication quality gates to an aggregate of QA output, and decide whether it clears. |
| [`registry-authority-contract`](skills/content/content-lifecycle-ext/registry-authority-contract.md) | The contract the `external-registry` role is held to when a candidate source is checked against the body that publishes it: resolve the identifier through its own API and return the record, so… |
| [`review-comments`](skills/content/content-lifecycle-ext/review-comments.md) | Reviewer comments on a folio's edit-set, from a tagged pull-request comment to a structured todo on the review page. |

**`skills/content/folio-document-adapter/`** (6)

| Skill | What it is for |
|---|---|
| [`block-actions`](skills/content/folio-document-adapter/block-actions.md) | Every block of a rendered document links back to where it can be changed: [edit] opens the block's Markdown source in GitHub's editor, and [feedback] opens a GitHub issue about that block, from the… |
| [`document-authoring`](skills/content/folio-document-adapter/document-authoring.md) | Author a **document** folio: policy guidance, a standard, a report, a handbook — anything whose content is structured prose rather than machine- checked mathematics. |
| [`document-publishing`](skills/content/folio-document-adapter/document-publishing.md) | Take a document folio from corpus to published artifact — without a TeX installation. |
| [`document-structure`](skills/content/folio-document-adapter/document-structure.md) | Decide and maintain the chapter/section skeleton of a document folio. |
| [`normative-statements`](skills/content/folio-document-adapter/normative-statements.md) | Carry a **recommendation, requirement or rule** in a document folio — the thing an L1 health-policy guidance note, a standard, or a terms-of-reference document exists to state. |
| [`public-comment`](skills/content/folio-document-adapter/public-comment.md) | Run a **public review** of a document folio. |

**`skills/content/requirements-planning/`** (2)

| Skill | What it is for |
|---|---|
| [`plan-request-gate`](skills/content/requirements-planning/plan-request-gate.md) | When somebody asks for a PLAN — "plan", "approach", "proposal", "how would you", "come up with" — produce a requirements document and a work plan, post or commit them where the governing methodology… |
| [`requirement-definition`](skills/content/requirements-planning/requirement-definition.md) | What a requirement IS, said once for both requirements methodologies: a statement, a conformance level, a source, at least one success criterion with its verification method, and a sign-off owner. |

**`skills/library/catalogue/`** (2)

| Skill | What it is for |
|---|---|
| [`dublin-core-renderings`](skills/library/catalogue/dublin-core-renderings.md) | Render a catalogue's Dublin Core records in the two standard forms an outside reader can use: Dublin Core XML, which a harvester reads, and JSON-LD bound to DCMI Metadata Terms. |
| [`oxigraph-catalogue-search`](skills/library/catalogue/oxigraph-catalogue-search.md) | How to compile, partition, distribute via CDN, and query digital library catalogue and Qualified Dublin Core metadata using Oxigraph in-memory WebAssembly on the static edge. |

**`skills/library/cataloguing/`** (9)

| Skill | What it is for |
|---|---|
| [`archiving-arxiv`](skills/library/cataloguing/archiving-arxiv.md) | Materializing a paper from arXiv — why the version suffix is part of the identity rather than a detail, what to keep beside the PDF, and which facts must be read from the published API rather than… |
| [`archiving-web-pages`](skills/library/cataloguing/archiving-web-pages.md) | Capturing a web page so it can be cited later — the two fidelities, what each one is evidence of, and why capturing only one of them loses something that cannot be recovered. |
| [`bib-human-review`](skills/library/cataloguing/bib-human-review.md) | Human-validated bibliography workflow. |
| [`bib-photo-ingestion-watcher`](skills/library/cataloguing/bib-photo-ingestion-watcher.md) | Integration-watcher for bib physical-review issues. |
| [`bib-qa`](skills/library/cataloguing/bib-qa.md) | Bibliography quality-assurance agent — validates every reference in content/schema/references.ts against several QA checks: URL availability, URL resolution, metadata completeness, citation… |
| [`filing-dublin-core`](skills/library/cataloguing/filing-dublin-core.md) | Cataloguing a source as it arrives — which facts are `dcterms`, which are this project's own, and why the line is drawn by the vocabulary rather than by convenience. |
| [`glossary-build`](skills/library/cataloguing/glossary-build.md) | Glossary Build Skill |
| [`glossary-terms`](skills/library/cataloguing/glossary-terms.md) | Add terms to an instance's glossary: local SKOS terms (folio-glossary/v1) with a definition, a code and links to external SKOS concepts, and references to whole external schemes. |
| [`ontologist`](skills/library/cataloguing/ontologist.md) | Semantic Ontologist — scans narrative text for ambiguous terms, generates a formal glossary/registry, and produces a mapping linking narrative strings to formal identifiers. |

**`skills/library/ingestion/`** (5)

| Skill | What it is for |
|---|---|
| [`audio-transcription`](skills/library/ingestion/audio-transcription.md) | Turn recorded speech (a meeting recording, a video with audio, an interview) into a transcript the library can cite, and choose WHICH open-source recogniser to run for the job: whisper.cpp by… |
| [`document-intake`](skills/library/ingestion/document-intake.md) | Process uploaded documents (PDFs, scans, LaTeX, structured/normative guidelines, etc.) from uploads/ into structured content objects. |
| [`l1-coverage`](skills/library/ingestion/l1-coverage.md) | Check that an L1 extraction accounted for every normative sentence in its source publication — captured as a node, or excluded for a fixed-list reason a person signed off. |
| [`l1-document-ingestion`](skills/library/ingestion/l1-document-ingestion.md) | The detailed method for turning a DOCUMENT in `uploads/` into a complete L1 entry in `library/<bib-slug>/` — which rung reads it and why, what a complete L1 entry holds, why an inferred structure is… |
| [`tabular-metadata`](skills/library/ingestion/tabular-metadata.md) | Extract tabular metadata from a CSV or spreadsheet as CSVW — tables, rows, headers, columns, datatypes and location on sheet — recording every field as determined or explicitly undetermined. |

**`skills/review/`** (1)

| Skill | What it is for |
|---|---|
| [`review`](skills/review/review.md) | Where to start when a person or an agent reviews a document folio larger than one chapter, such as a DAK or an L1 digital transformation handbook. |

<!-- cat-harness:skills:end -->
