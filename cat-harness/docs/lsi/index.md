---
title: "Latent semantic indexes"
description: "Every committed LSI index over a declared prose graph — its latent dimensions, its findings, and which graphs still need one."
renders:
  - cat-harness/test/results
rendered-by: lsi-viewer
---
<style>
.lv-grid{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0}
.lv-stat{flex:1 1 8rem;border:1px solid rgba(128,128,128,.35);border-radius:6px;padding:.5rem .7rem}
.lv-stat b{display:block;font-size:1.25rem;line-height:1.2}
.lv-stat span{font-size:.75rem;opacity:.75}
.lv-pass{color:#5fd3b8;font-weight:600}.lv-fail{color:#ff9486;font-weight:600}.lv-na{opacity:.8}
</style>

A **latent semantic index** places every unit of a prose graph — a library
section, a skill, a bean — in a space built from which words occur
together, so units that discuss the same thing in *different words* sit
close. It is a retrieval aid: every neighbour and finding below is a
**proposal**, never a relation the graph asserts.

The method is [Latent Semantic Indexing](../methodologies/) (node `lsi`), with
[correspondence analysis](../methodologies/) (node `correspondence-analysis`) as its parallel track;
how to build, query and audit an index is the skill `lsi-indexing`.

<div class="lv-grid">
<div class="lv-stat"><b>3</b><span>committed indexes</span></div>
<div class="lv-stat"><b>990</b><span>units indexed</span></div>
<div class="lv-stat"><b>4</b><span>graphs that need an index and lack a fresh one</span></div>
</div>

## Which graphs need an index

A graph needs one at 100 units and 20,000 words — a house threshold, with its
basis in `scripts/lsi.ts`. Below it a graph is **not judged**, which is not
the same as fine. The same verdict is `kg:audit`'s `lsi-index-fresh`.

| graph | verdict | detail |
|---|---|---|
| `agent-skills/library` | <span class="lv-fail">fail</span> | needs an LSI index and has none — run `bun run lsi index --instance agent-skills --graph library` |
| `bootstrap/skills` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `cat-harness/beans` | <span class="lv-na">n/a</span> | state graph — indexed on demand, never committed |
| `cat-harness/docs` | <span class="lv-fail">fail</span> | needs an LSI index and has none — run `bun run lsi index --instance cat-harness --graph docs` |
| `cat-harness/folio` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `cat-harness/library` | <span class="lv-pass">pass</span> | fresh |
| `cat-harness/memory` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `cat-harness/methodologies` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `cat-harness/policies` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `cat-harness/root-docs` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `cat-harness/skills` | <span class="lv-pass">pass</span> | fresh |
| `fhir-harness/fhir-ig-skills` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant-core/core-library` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant-core/core-methodologies` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant-core/core-skills` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant-core/folios` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant-core/glossary` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant-sci/library` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant-sci/sci-methodologies` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `large-datasets/large-datasets-skills` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `smart-base/library` | <span class="lv-fail">fail</span> | needs an LSI index and has none — run `bun run lsi index --instance smart-base --graph library` |
| `smart-base/methodologies` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `smart-trust/smart-trust-docs` | <span class="lv-fail">fail</span> | needs an LSI index and has none — run `bun run lsi index --instance smart-trust --graph smart-trust-docs` |
| `who-iris/library` | <span class="lv-pass">pass</span> | fresh |
| `who-iris/who-iris-docs` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `who-iris/who-iris-skills` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `who-style-guide/glossary` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |

## cat-harness / library

**350** units · **5861** terms · k = **100** · retains **66.5 %** of the weighted matrix · weighting `log-entropy` · sidecar `cat-harness/test/results/lsi/cat-harness/library.lsi.json`

> Dimension 1 has **no negative pole**: it most likely measures unit length and term frequency (a margin), not a theme. Read the themes from dimension 2 on.

Each dimension is a **contrast** between two poles, shown by their highest-loading terms. It is not named here: naming it is a reader's act.

| dim | σ | one pole | the other pole |
|---|---|---|---|
| 1 | 27.14 | arxiv, conference, proceedings, models, model, subject, systems, data | *(none)* |
| 2 | 19.08 | arxiv, proceedings, preprint, conference, wang, chen, zhang, yang | matrix, analysis, swot, algorithm, error, approximation, terms, singular |
| 3 | 17.48 | lce, streaming, lightgcn, incremental, slim, recommendation, items, yelp | subject, records, subjects, annif, qualitative, team, gnd, all-subjects |
| 4 | 17.19 | swot, organization, strategic, management, business, design, opportunities, threats | recall, embeddings, lce, subject, streaming, terms, subjects, all-subjects |
| 5 | 16.34 | swot, organization, strategic, lce, streaming, threats, lightgcn, weaknesses | wireframes, wireframe, layout, matrix, approximation, algorithm, design, icon |
| 6 | 15.73 | wireframes, wireframe, design, mid-fidelity, wiregen, layout, prompt, llms | matrix, approximation, algorithms, arxiv, randomized, algorithm, random, international |
| 7 | 14.35 | agent, headings, heading, lcgft, workflow, subdivision, workflows, baseline | lsa, documents, swot, similarity, term, document, terms, retrieval |
| 8 | 13.90 | documents, lsa, terms, document, retrieval, dimensions, query, term | algorithm, random, randomized, approximation, algorithms, wireframes, error, gaussian |

**Findings** — 0 narrow dimension(s), 6 near-duplicate pair(s).

*Near-duplicates* (cosine ≥ 0.95) — similar is not duplicate; read both:

- 0.974 — `cat-harness/library/landauer-foltz-laham-1998-intro-lsa/sections/page-001.md` ~ `cat-harness/library/landauer-foltz-laham-1998-intro-lsa/sections/page-041.md`
- 0.963 — `cat-harness/library/arxiv-0909.4061v2/sections/page-032.md` ~ `cat-harness/library/arxiv-0909.4061v2/sections/page-033.md`
- 0.970 — `cat-harness/library/arxiv-0909.4061v2/sections/page-048.md` ~ `cat-harness/library/arxiv-0909.4061v2/sections/page-049.md`
- 0.956 — `cat-harness/library/qi-hessen-vanderheijden-2023-ca-vs-lsa/sections/sec-014-411-map-as-a-function-of-the-number-of-dimension.md` ~ `cat-harness/library/qi-hessen-vanderheijden-2023-ca-vs-lsa/sections/sec-017-421-weighting-the-elements-of-the-raw-document-t.md`
- 0.971 — `cat-harness/library/arxiv-2607.14456v1/sections/page-012.md` ~ `cat-harness/library/arxiv-2607.14456v1/sections/page-022.md`
- 0.951 — `cat-harness/library/arxiv-2607.14456v1/sections/page-015.md` ~ `cat-harness/library/arxiv-2607.14456v1/sections/page-022.md`

## cat-harness / skills

**304** units · **7543** terms · k = **100** · retains **69.0 %** of the weighted matrix · weighting `log-entropy` · sidecar `cat-harness/test/results/lsi/cat-harness/skills.lsi.json`

> Dimension 1 has **no negative pole**: it most likely measures unit length and term frequency (a margin), not a theme. Read the themes from dimension 2 on.

Each dimension is a **contrast** between two poles, shown by their highest-loading terms. It is not named here: naming it is a reader's act.

| dim | σ | one pole | the other pole |
|---|---|---|---|
| 1 | 46.26 | bean, session, graph, kind, branch, instance, page, agent | *(none)* |
| 2 | 27.70 | bias, studies, study, effect, statistical, causation, validity, causal | bean, instance, harness, directory, node, graph, kind, session |
| 3 | 22.21 | proof, lean, watcher, slot, blocks, project, witness, chapter | harness, node, bean, instance, page, directory, actor, process |
| 4 | 19.45 | dpi, color, grayscale, matplotlib, images, raster, pdf, fonts | session, prs, queue, branch, sibling, commits, coordination, beans |
| 5 | 18.50 | dpi, color, grayscale, session, matplotlib, contrast, raster, eps | lean, proof, declaration, glossary, mathlib, theorem, sorry, chapter |
| 6 | 16.77 | regulatory, intervention, biosafety, ethics, candidate, rivals, dual-use, safety | fallacy, fallacious, reality, fallacies, consider, solutions, description, correlation |
| 7 | 16.13 | lean, mathlib, mcp, sorry, proof, search, bean, lake | watcher, slot, backlog, voice, ledger, queue, nesting, idle |
| 8 | 15.29 | mathlib, lean, sorry, subdirectory, lake, mcp, nesting, oleans | slot, forward, major, edges, criterion, reader, section, band |

**Findings** — 0 narrow dimension(s), 0 near-duplicate pair(s).

## who-iris / library

**336** units · **3827** terms · k = **100** · retains **69.2 %** of the weighted matrix · weighting `log-entropy` · sidecar `cat-harness/test/results/lsi/who-iris/library.lsi.json`

> Dimension 1 has **no negative pole**: it most likely measures unit length and term frequency (a margin), not a theme. Read the themes from dimension 2 on.

Each dimension is a **contrast** between two poles, shown by their highest-loading terms. It is not named here: naming it is a reader's act.

| dim | σ | one pole | the other pole |
|---|---|---|---|
| 1 | 23.69 | evidence, review, group, quality, health, interest, development, systematic | *(none)* |
| 2 | 13.83 | imprecision, effect, confidence, inconsistency, estimate, studies, rated, indirectness | organization, november, accessed, grc, world, planning, group, doi |
| 3 | 13.06 | accessed, november, pmid, cochrane, website, doi, oxman, org | interests, interest, members, conflict, coi, financial, individuals, chair |
| 4 | 12.13 | names, international, nomenclature, used, name, republic, style, social | gdg, doi, grade, interest, interests, review, evidence, coi |
| 5 | 11.85 | gender, determinants, social, equity, rights, human, services, right | name, names, republic, style, full, text, nomenclature, english |
| 6 | 11.57 | doi, coi, financial, accessed, november, conflict, cois, interests | rapid, proposal, canada, advice, planning, updating, key, review |
| 7 | 10.79 | republic, name, local, approved, english, haiti, addis, abu | nomenclature, symbols, world, international, abbreviations, text, used, organization |
| 8 | 10.54 | determinants, interests, canada, conflict, effect, declarations, social, conflicts | gdg, cost, questions, key, condition, steering, diabetes, effectiveness |

**Findings** — 0 narrow dimension(s), 9 near-duplicate pair(s).

*Near-duplicates* (cosine ≥ 0.95) — similar is not duplicate; read both:

- 0.973 — `who-iris/library/wpr-rdo-2020-003-eng/sections/page-006.md` ~ `who-iris/library/wpr-rdo-2020-003-eng/sections/page-010.md`
- 0.973 — `who-iris/library/wpr-rdo-2020-003-eng/sections/page-006.md` ~ `who-iris/library/wpr-rdo-2020-003-eng/sections/page-008.md`
- 0.965 — `who-iris/library/wpr-rdo-2020-003-eng/sections/page-006.md` ~ `who-iris/library/wpr-rdo-2020-003-eng/sections/page-007.md`
- 0.961 — `who-iris/library/wpr-rdo-2020-003-eng/sections/page-007.md` ~ `who-iris/library/wpr-rdo-2020-003-eng/sections/page-008.md`
- 0.954 — `who-iris/library/wpr-rdo-2020-003-eng/sections/page-007.md` ~ `who-iris/library/wpr-rdo-2020-003-eng/sections/page-010.md`
- 0.968 — `who-iris/library/wpr-rdo-2020-003-eng/sections/page-008.md` ~ `who-iris/library/wpr-rdo-2020-003-eng/sections/page-010.md`
- 0.966 — `who-iris/library/wpr-rdo-2020-003-eng/sections/page-020.md` ~ `who-iris/library/wpr-rdo-2020-003-eng/sections/page-021.md`
- 0.957 — `who-iris/library/who-pub-tps-931/sections/page-039.md` ~ `who-iris/library/who-pub-tps-931/sections/page-040.md`
- 0.999 — `who-iris/library/who-pub-tps-931/sections/page-116.md` ~ `who-iris/library/who-pub-tps-931/sections/page-119.md`

---

Generated by `bun run lsi:viz` from the committed sidecars; `lsi:viz:check` fails when this page is stale.
