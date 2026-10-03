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
<div class="lv-stat"><b>4</b><span>committed indexes</span></div>
<div class="lv-stat"><b>3099</b><span>units indexed</span></div>
<div class="lv-stat"><b>4</b><span>graphs that need an index and lack a fresh one</span></div>
</div>

## Which graphs need an index

A graph needs one at 100 units and 20,000 words — a house threshold, with its
basis in `scripts/lsi.ts`. Below it a graph is **not judged**, which is not
the same as fine. The same verdict is `kg:audit`'s `tool-downstream-fresh` for the `lsi-index` Tool.

| graph | verdict | detail |
|---|---|---|
| `bootstrap-tools/bootstrap-tools-skills` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `bootstrap/skills` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `cat-harness/docs` | <span class="lv-fail">fail</span> | needs an LSI index and has none — run `bun run lsi index --instance cat-harness --graph docs` |
| `cat-harness/folio` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `cat-harness/library` | <span class="lv-pass">pass</span> | fresh |
| `cat-harness/methodologies` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `cat-harness/policies` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `cat-harness/skills` | <span class="lv-pass">pass</span> | fresh |
| `fhir-harness/fhir-ig-skills` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `fhir-harness/library` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant-core/core-library` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant-core/core-methodologies` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant-core/core-skills` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant-core/folios` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant-core/glossary` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant-sci/library` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant-sci/sci-methodologies` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant/beans` | <span class="lv-na">n/a</span> | state graph — indexed on demand, never committed |
| `folio-assistant/memory` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `folio-assistant/root-docs` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `smart-base/library` | <span class="lv-pass">pass</span> | fresh |
| `smart-base/methodologies` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `smart-base/smart-base-docs` | <span class="lv-fail">fail</span> | needs an LSI index and has none — run `bun run lsi index --instance smart-base --graph smart-base-docs` |
| `smart-base/smart-base-findings` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `smart-immunizations/smart-immunizations-docs` | <span class="lv-fail">fail</span> | needs an LSI index and has none — run `bun run lsi index --instance smart-immunizations --graph smart-immunizations-docs` |
| `smart-trust/smart-trust-docs` | <span class="lv-fail">fail</span> | needs an LSI index and has none — run `bun run lsi index --instance smart-trust --graph smart-trust-docs` |
| `who-iris/library` | <span class="lv-pass">pass</span> | fresh |
| `who-iris/who-iris-docs` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `who-iris/who-iris-site` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `who-iris/who-iris-skills` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `who-style-guide/glossary` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |

## cat-harness / library

**1697** units · **10713** terms · k = **100** · retains **45.6 %** of the weighted matrix · weighting `log-entropy` · sidecar `cat-harness/test/results/lsi/cat-harness/library.lsi.json`

> Dimension 1 has **no negative pole**: it most likely measures unit length and term frequency (a margin), not a theme. Read the themes from dimension 2 on.

Each dimension is a **contrast** between two poles, shown by their highest-loading terms. It is not named here: naming it is a reader's act.

| dim | σ | one pole | the other pole |
|---|---|---|---|
| 1 | 41.12 | prov, entity, agent, prefix, model, value, activity, used | *(none)* |
| 2 | 31.90 | prov, entity, activity, prefix, rdfs, qualified, owl, invalidation | algorithm, models, learning, reward, matrix, arm, algorithms, arxiv |
| 3 | 26.28 | quot, nbsp, string, x7b, json-ld, type, node, context | prov, arm, reward, entity, activity, instances, algorithm, learning |
| 4 | 25.06 | arxiv, conference, proceedings, preprint, zhang, international, wang, chen | arm, reward, algorithm, bound, proof, instances, theorem, let |
| 5 | 23.56 | quot, nbsp, x7b, x5b, x5f, inherited, meta, client | json-ld, node, term, iri, graph, expanded, document, map |
| 6 | 21.52 | spdx, skills, skill, license, xsd, element, package, core | quot, matrix, term, node, nbsp, iri, x7b, value |
| 7 | 21.15 | matrix, matrices, performance, singular, error, method, svd, approximation | json-ld, iri, avrim, string, node, phd, type, grit |
| 8 | 20.39 | skills, skill, claude, gemini, task, openhands, agent, context | xsd, spdx, matrix, element, string, package, externalref, core |

**Findings** — 1 narrow dimension(s), 557 near-duplicate pair(s).

*Narrow dimensions* — carried by very few units; usually boilerplate, specimen text or a bad page:

- dimension 11: `cat-harness/library/arxiv-2202.02427v1/sections/sec-020-references.md`, `cat-harness/library/arxiv-2202.02427v1/sections/sec-010-41-replay-protocol.md`, `cat-harness/library/arxiv-2202.02427v1/sections/sec-012-45-comparison-with-lce-variants.md`, `cat-harness/library/arxiv-2202.02427v1/sections/sec-011-44-comparison-with-baseline-methods.md`, `cat-harness/library/arxiv-2504.07199v3/sections/sec-013-conclusion.md`, `cat-harness/library/arxiv-2607.20636v1/sections/sec-088-parting-thoughts.md`, `cat-harness/library/arxiv-2202.02427v1/sections/sec-002-1-introduction.md`, `cat-harness/library/arxiv-2607.20636v1/sections/sec-front-matter.md`, `cat-harness/library/arxiv-2202.02427v1/sections/sec-018-52-graph-based-recommendation-models.md`, `cat-harness/library/arxiv-2202.02427v1/sections/sec-013-46-explicit-vs-implicit-embeddings.md`, `cat-harness/library/arxiv-2202.02427v1/sections/sec-005-31-lce-model.md`, `cat-harness/library/arxiv-2202.02427v1/sections/sec-001-abstract.md`, `cat-harness/library/arxiv-2504.07199v3/sections/sec-008-shared-task-participant-systems.md`, `cat-harness/library/arxiv-2602.12670v4/sections/sec-012-conclusion.md`

*Near-duplicates* (cosine ≥ 0.95) — similar is not duplicate; read both:

- 0.983 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-016-core-profile-compliance-point.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-017-software-profile-compliance-point.md`
- 0.959 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-016-core-profile-compliance-point.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-023-lite-profile-compliance-point.md`
- 0.956 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-016-core-profile-compliance-point.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-022-build-profile-compliance-point.md`
- 0.981 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-017-software-profile-compliance-point.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-022-build-profile-compliance-point.md`
- 0.972 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-017-software-profile-compliance-point.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-018-security-profile-compliance-point.md`
- 0.975 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-018-security-profile-compliance-point.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-022-build-profile-compliance-point.md`
- 0.966 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-018-security-profile-compliance-point.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-021-ai-profile-compliance-point.md`
- 0.966 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-020-dataset-profile-compliance-point.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-022-build-profile-compliance-point.md`
- 0.966 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-020-dataset-profile-compliance-point.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-021-ai-profile-compliance-point.md`
- 0.964 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-021-ai-profile-compliance-point.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-022-build-profile-compliance-point.md`
- 0.987 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-038-agent.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-057-person.md`
- 0.986 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-038-agent.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-060-softwareagent.md`
- 0.975 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-038-agent.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-055-organization.md`
- 0.984 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-039-annotation.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-043-creationinfo.md`
- 0.965 — `cat-harness/library/omg-2024-spdx-3-0/sections/sec-039-annotation.md` ~ `cat-harness/library/omg-2024-spdx-3-0/sections/sec-042-bundle.md`
- … and 542 more in the sidecar

## cat-harness / skills

**227** units · **6002** terms · k = **100** · retains **78.2 %** of the weighted matrix · weighting `log-entropy` · sidecar `cat-harness/test/results/lsi/cat-harness/skills.lsi.json`

> Dimension 1 has **no negative pole**: it most likely measures unit length and term frequency (a margin), not a theme. Read the themes from dimension 2 on.

Each dimension is a **contrast** between two poles, shown by their highest-loading terms. It is not named here: naming it is a reader's act.

| dim | σ | one pole | the other pole |
|---|---|---|---|
| 1 | 45.42 | kind, instance, directory, harness, page, graph, session, block | *(none)* |
| 2 | 21.71 | watcher, sibling, queue, prs, slot, block, backlog, commits | harness, instance, declaration, node, directory, directories, subgraph, asset |
| 3 | 18.03 | slot, chapter, block, edges, formal, project, watcher, proof | session, beans, page, epic, green, goals, window, minutes |
| 4 | 17.16 | page, block, text, tile, chapter, blocks, manifest, avatar | sibling, session, ledger, sessions, plan, subdirectory, subgraph, coordination |
| 5 | 15.51 | tile, glass, avatar, card, board, theme, sticky, tiles | rung, archive, sniff, archived, ingest, pdf, zip, arxiv |
| 6 | 15.11 | lane, actor, role, requirements, task, analysis, process, diagram | queue, sha, withheld, backlog, slide, bytes, library, rung |
| 7 | 14.70 | preview, staging, translation, url, locale, pages, translated, deploy | tile, glass, avatar, card, slot, sticky, fit, role |
| 8 | 14.53 | edges, forward, edge, backward, cross-chapter, logical, energy, storytelling | actor, lane, role, requirement, user, requirements, task, pipeline |

**Findings** — 0 narrow dimension(s), 0 near-duplicate pair(s).

## smart-base / library

**839** units · **7506** terms · k = **100** · retains **55.3 %** of the weighted matrix · weighting `log-entropy` · sidecar `cat-harness/test/results/lsi/smart-base/library.lsi.json`

> Dimension 1 has **no negative pole**: it most likely measures unit length and term frequency (a margin), not a theme. Read the themes from dimension 2 on.

Each dimension is a **contrast** between two poles, shown by their highest-loading terms. It is not named here: naming it is a reader's act.

| dim | σ | one pole | the other pole |
|---|---|---|---|
| 1 | 50.58 | registry, clinical, governance, facility, record, required, dpi-h, service | *(none)* |
| 2 | 26.89 | registry, dpi-h, requirement, consuming, limr, mandatory, authoritative, governed | user, intervention, training, accessed, pcposs, testing, interventions, handbook |
| 3 | 21.66 | provider, transmit, healthcare, registration, manage, facility, location, event | limr, fhir, models, computable, smart, cdse, semantic, standards |
| 4 | 20.53 | lhr, cdse, surveillance, hmis, phsp, alerts, clinical, transmit | product, master, supplier, identifier, mandatory, chain, canonical, date |
| 5 | 19.32 | accessed, world, organization, website, geneva, international, pdf, january | pcposs, user, worker, decision-support, logic, intervention, counselling, activity |
| 6 | 18.30 | accessed, website, world, adaptation, organization, geneva, pcposs, roll-out | architecture, product, infrastructure, goals, chain, supply, dhsc, shared |
| 7 | 17.87 | healthcare, transmit, provider, manage, fhir, clinical, models, limr | phsp, configurable, indicators, surveillance, lhr, outbreak, threats, investigation |
| 8 | 16.90 | intervention, limr, mhealth, project, evaluation, axis, consuming, versioning | pcposs, registry, identity, consent, roll-out, foundational, handbook, dpi |

**Findings** — 0 narrow dimension(s), 76 near-duplicate pair(s).

*Near-duplicates* (cosine ≥ 0.95) — similar is not duplicate; read both:

- 0.964 — `smart-base/library/who-dpi-h-reference-architecture-draft-v1/sections/sec-048-372-the-model.md` ~ `smart-base/library/who-dpi-h-reference-architecture-draft-v1/sections/sec-052-376-constructs-and-their-counterparts.md`
- 0.998 — `smart-base/library/9789240010567-eng/sections/page-004.md` ~ `smart-base/library/9789240116191-eng/sections/page-003.md`
- 0.997 — `smart-base/library/9789240010567-eng/sections/page-004.md` ~ `smart-base/library/9789240081949-eng/sections/page-004.md`
- 0.997 — `smart-base/library/9789240010567-eng/sections/page-004.md` ~ `smart-base/library/9789240101197-eng/sections/page-004.md`
- 0.973 — `smart-base/library/9789240010567-eng/sections/page-014.md` ~ `smart-base/library/who-rhr-1806-eng/sections/page-001.md`
- 0.993 — `smart-base/library/9789240010567-eng/sections/page-017.md` ~ `smart-base/library/9789240116191-eng/sections/page-013.md`
- 0.986 — `smart-base/library/9789240010567-eng/sections/page-017.md` ~ `smart-base/library/9789240101197-eng/sections/page-015.md`
- 0.983 — `smart-base/library/9789240010567-eng/sections/page-017.md` ~ `smart-base/library/9789240120747-eng/sections/page-016.md`
- 0.958 — `smart-base/library/9789240010567-eng/sections/page-018.md` ~ `smart-base/library/9789240116191-eng/sections/page-013.md`
- 0.953 — `smart-base/library/9789240010567-eng/sections/page-018.md` ~ `smart-base/library/9789240101197-eng/sections/page-015.md`
- 0.952 — `smart-base/library/9789240010567-eng/sections/page-021.md` ~ `smart-base/library/9789240010567-eng/sections/page-132.md`
- 0.965 — `smart-base/library/9789240010567-eng/sections/page-022.md` ~ `smart-base/library/9789240010567-eng/sections/page-132.md`
- 0.998 — `smart-base/library/9789240010567-eng/sections/page-051.md` ~ `smart-base/library/who-rhr-1806-eng/sections/page-004.md`
- 0.990 — `smart-base/library/9789240010567-eng/sections/page-059.md` ~ `smart-base/library/who-rhr-1806-eng/sections/page-001.md`
- 0.987 — `smart-base/library/9789240010567-eng/sections/page-099.md` ~ `smart-base/library/9789240101197-eng/sections/page-033.md`
- … and 61 more in the sidecar

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
