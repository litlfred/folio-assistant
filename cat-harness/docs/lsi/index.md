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
<div class="lv-stat"><b>2207</b><span>units indexed</span></div>
<div class="lv-stat"><b>5</b><span>graphs that need an index and lack a fresh one</span></div>
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
| `cat-harness/library` | <span class="lv-fail">fail</span> | stale — re-run `bun run lsi index --instance cat-harness --graph library` |
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
| `smart-immunizations/smart-immunizations-docs` | <span class="lv-fail">fail</span> | needs an LSI index and has none — run `bun run lsi index --instance smart-immunizations --graph smart-immunizations-docs` |
| `smart-trust/smart-trust-docs` | <span class="lv-fail">fail</span> | needs an LSI index and has none — run `bun run lsi index --instance smart-trust --graph smart-trust-docs` |
| `who-iris/library` | <span class="lv-pass">pass</span> | fresh |
| `who-iris/who-iris-docs` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `who-iris/who-iris-site` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `who-iris/who-iris-skills` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `who-style-guide/glossary` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |

## cat-harness / library

**816** units · **8465** terms · k = **100** · retains **53.9 %** of the weighted matrix · weighting `log-entropy` · sidecar `cat-harness/test/results/lsi/cat-harness/library.lsi.json`

> Dimension 1 has **no negative pole**: it most likely measures unit length and term frequency (a margin), not a theme. Read the themes from dimension 2 on.

Each dimension is a **contrast** between two poles, shown by their highest-loading terms. It is not named here: naming it is a reader's act.

| dim | σ | one pole | the other pole |
|---|---|---|---|
| 1 | 37.43 | prov, entity, prefix, activity, agent, xsd, value, model | *(none)* |
| 2 | 30.57 | prov, entity, activity, prefix, xsd, rdfs, qualified, datetime | algorithm, models, reward, learning, arm, model, matrix, best |
| 3 | 23.81 | json-ld, node, context, iri, graph, term, language, type | arm, reward, instances, algorithm, bound, agent, phd, bandits |
| 4 | 23.37 | conference, proceedings, arxiv, international, preprint, zhang, chen, yang | json-ld, value, node, definition, iri, arm, term, context |
| 5 | 19.82 | matrix, error, performance, approximation, matrices, random, method, randomized | json-ld, avrim, iri, node, phd, context, pages, expanded |
| 6 | 18.60 | matrix, analysis, swot, organization, strategic, management, international, business | subject, records, subjects, annif, gnd, all-subjects, tib, multilingual |
| 7 | 18.41 | swot, organization, strategic, threats, analysis, opportunities, weaknesses, strengths | algorithm, arm, lce, proceedings, conference, streaming, lightgcn, reward |
| 8 | 17.56 | lce, streaming, lightgcn, incremental, slim, items, yelp, model | algorithm, pages, algorithms, approximation, matrix, randomized, bound, arm |

**Findings** — 0 narrow dimension(s), 162 near-duplicate pair(s).

*Near-duplicates* (cosine ≥ 0.95) — similar is not duplicate; read both:

- 0.963 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-003.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-036.md`
- 0.957 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-003.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-063.md`
- 0.954 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-003.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-064.md`
- 0.971 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-012.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-021.md`
- 0.971 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-012.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-019.md`
- 0.970 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-012.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-020.md`
- 0.994 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-013.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-021.md`
- 0.993 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-013.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-019.md`
- 0.993 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-013.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-020.md`
- 0.989 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-014.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-018.md`
- 0.985 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-014.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-016.md`
- 0.984 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-014.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-017.md`
- 0.991 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-015.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-019.md`
- 0.989 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-015.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-020.md`
- 0.986 — `cat-harness/library/w3c-2024-prov-jsonld/sections/page-015.md` ~ `cat-harness/library/w3c-2024-prov-jsonld/sections/page-021.md`
- … and 147 more in the sidecar

## cat-harness / skills

**216** units · **5820** terms · k = **100** · retains **79.5 %** of the weighted matrix · weighting `log-entropy` · sidecar `cat-harness/test/results/lsi/cat-harness/skills.lsi.json`

> Dimension 1 has **no negative pole**: it most likely measures unit length and term frequency (a margin), not a theme. Read the themes from dimension 2 on.

Each dimension is a **contrast** between two poles, shown by their highest-loading terms. It is not named here: naming it is a reader's act.

| dim | σ | one pole | the other pole |
|---|---|---|---|
| 1 | 43.72 | instance, kind, session, harness, directory, page, graph, branch | *(none)* |
| 2 | 21.55 | watcher, queue, sibling, backlog, slot, prs, block, commits | harness, instance, declaration, node, directory, directories, graph, asset |
| 3 | 17.96 | slot, chapter, block, edges, proof, project, watcher, formal | session, beans, branch, epic, goals, window, sessions, store |
| 4 | 16.60 | page, tile, block, preview, avatar, theme, blocks, card | sibling, ledger, queue, subdirectory, sessions, plan, items, coordination |
| 5 | 15.04 | board, tile, page, avatar, card, theme, navbar, surface | edge, edges, lane, forward, actor, logical, backward, graph |
| 6 | 14.59 | edges, forward, edge, backward, logical, cross-chapter, energy, index | actor, lane, role, task, requirements, requirement, user, process |
| 7 | 14.49 | tile, avatar, card, glass, sticky, board, slot, art | preview, feature, phase, staging, feedback, github, url, workflow |
| 8 | 14.25 | translation, locale, translated, french, back-translation, badge, language, back-translator | edges, tile, impact, option, card, glass, theme, avatar |

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
