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
<div class="lv-stat"><b>5</b><span>committed indexes</span></div>
<div class="lv-stat"><b>1667</b><span>units indexed</span></div>
<div class="lv-stat"><b>6</b><span>graphs that need an index and lack a fresh one</span></div>
</div>

## Which graphs need an index

A graph needs one at 100 units and 20,000 words — a house threshold, with its
basis in `scripts/lsi.ts`. Below it a graph is **not judged**, which is not
the same as fine. The same verdict is `kg:audit`'s `tool-downstream-fresh` for the `lsi-index` Tool.

| graph | verdict | detail |
|---|---|---|
| `agent-skills/library` | <span class="lv-fail">fail</span> | no successful run recorded — re-run `bun run lsi index --instance agent-skills --graph library` |
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
| `large-datasets/large-datasets-skills` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `smart-base/library` | <span class="lv-fail">fail</span> | no successful run recorded — re-run `bun run lsi index --instance smart-base --graph library` |
| `smart-base/methodologies` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `smart-base/smart-base-docs` | <span class="lv-fail">fail</span> | needs an LSI index and has none — run `bun run lsi index --instance smart-base --graph smart-base-docs` |
| `smart-trust/smart-trust-docs` | <span class="lv-fail">fail</span> | needs an LSI index and has none — run `bun run lsi index --instance smart-trust --graph smart-trust-docs` |
| `who-iris/library` | <span class="lv-pass">pass</span> | fresh |
| `who-iris/who-iris-docs` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `who-iris/who-iris-site` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `who-iris/who-iris-skills` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |
| `who-style-guide/glossary` | <span class="lv-na">n/a</span> | below the need-an-index threshold — not judged |

## agent-skills / library

**174** units · **2605** terms · k = **100** · retains **88.5 %** of the weighted matrix · weighting `log-entropy` · sidecar `cat-harness/test/results/lsi/agent-skills/library.lsi.json`

> Dimension 1 has **no negative pole**: it most likely measures unit length and term frequency (a margin), not a theme. Read the themes from dimension 2 on.

Each dimension is a **contrast** between two poles, shown by their highest-loading terms. It is not named here: naming it is a reader's act.

| dim | σ | one pole | the other pole |
|---|---|---|---|
| 1 | 18.54 | gemini, task, office, science, model, industrial, agent, openhands | *(none)* |
| 2 | 15.41 | office, industrial, science, finance, media, gpt, opus, deepseek | defects, defect, safety, routing, body, detected, checks, description |
| 3 | 13.21 | arxiv, wang, zhou, language, yang, yao, jiang, liu | defects, defect, routing, office, industrial, safety, detected, body |
| 4 | 12.16 | openhands, gemini, gpt, configurations, opus, flash, condition, pro | defects, defect, arxiv, safety, liu, routing, coding, zhang |
| 5 | 11.34 | openhands, defects, gemini, gpt, flash, pro, opus, defect | reasoning, tool, reference, docs, cookie, file, multimodal, coding |
| 6 | 10.31 | oracle, human, fraction, verifier, augmentation, pytest, passed, submissions | claude, openhands, opus, gpt, flash, pro, deepseek, gemini |
| 7 | 9.45 | behaviour, hook, mechanisms, interface, call, external, advisory, ordinary | cookie, claude, services, docs, platform, analyze, usage, policy |
| 8 | 8.90 | wang, xiangyi, tier, university, spec, retrieved, well, checks | reasoning, yao, generated, spec-aware, providing, framework, chat, hook |

**Findings** — 0 narrow dimension(s), 0 near-duplicate pair(s).

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

**212** units · **5832** terms · k = **100** · retains **79.8 %** of the weighted matrix · weighting `log-entropy` · sidecar `cat-harness/test/results/lsi/cat-harness/skills.lsi.json`

> Dimension 1 has **no negative pole**: it most likely measures unit length and term frequency (a margin), not a theme. Read the themes from dimension 2 on.

Each dimension is a **contrast** between two poles, shown by their highest-loading terms. It is not named here: naming it is a reader's act.

| dim | σ | one pole | the other pole |
|---|---|---|---|
| 1 | 43.61 | instance, harness, kind, directory, session, graph, block, page | *(none)* |
| 2 | 21.41 | watcher, slot, sibling, queue, backlog, prs, block, commits | harness, instance, declaration, directory, node, directories, graph, bootstrap |
| 3 | 17.77 | session, beans, branch, goals, store, window, epic, push | slot, chapter, block, edges, formal, glossary, project, proof |
| 4 | 16.39 | page, block, section, sections, blocks, chapter, manifest, text | ledger, sibling, subdirectory, items, sessions, queue, window, renderable |
| 5 | 14.82 | locale, translated, navbar, translation, page, french, staging, theme | edges, forward, edge, logical, backward, cross-chapter, energy, sections |
| 6 | 14.77 | lane, requirements, actor, role, feature, task, phase, impact | rung, queue, slide, arm, bytes, zip, archive, sha |
| 7 | 14.38 | edges, forward, preview, backward, edge, cross-chapter, energy, logical | actor, lane, role, backlog, rung, criterion, login, roles |
| 8 | 14.14 | locale, translation, translated, french, back-translation, translations, badge, language | preview, feature, phase, theme, option, sha, merge, staging |

**Findings** — 0 narrow dimension(s), 0 near-duplicate pair(s).

## smart-base / library

**595** units · **6151** terms · k = **100** · retains **54.5 %** of the weighted matrix · weighting `log-entropy` · sidecar `cat-harness/test/results/lsi/smart-base/library.lsi.json`

> Dimension 1 has **no negative pole**: it most likely measures unit length and term frequency (a margin), not a theme. Read the themes from dimension 2 on.

Each dimension is a **contrast** between two poles, shown by their highest-loading terms. It is not named here: naming it is a reader's act.

| dim | σ | one pole | the other pole |
|---|---|---|---|
| 1 | 35.53 | user, requirements, systems, service, care, training, adaptation, pcposs | *(none)* |
| 2 | 20.36 | transmit, provider, healthcare, manage, event, alerts, diagnostic, commodities | requirements, accessed, handbook, design, adaptation, pcposs, website, user |
| 3 | 18.89 | accessed, world, website, organization, geneva, international, pdf, january | pcposs, lane, activity, decision-support, swim, symbol, workflows, depict |
| 4 | 17.14 | intervention, evaluation, axis, project, mhealth, studies, study, projects | pcposs, adaptation, roll-out, handbook, annexes, decision-support, activity, business |
| 5 | 15.12 | standards, interoperability, enterprise, architecture, software, requirements, fhir, pcposs | research, qualitative, studies, accessed, study, quantitative, lane, client |
| 6 | 14.58 | material, licence, translation, rights, igo, citation, work, imply | accessed, website, january, doi, pdf, org, qualitative, lane |
| 7 | 14.06 | studies, qualitative, quantitative, study, designs, element, intervention, methods | axis, points, mhealth, scaling, domain, lane, swim, symbol |
| 8 | 13.52 | element, hiv, elements, pcposs, testing, workers, forms, duplicated | enterprise, business, studies, qualitative, activities, symbol, quantitative, swim |

**Findings** — 0 narrow dimension(s), 25 near-duplicate pair(s).

*Near-duplicates* (cosine ≥ 0.95) — similar is not duplicate; read both:

- 0.996 — `smart-base/library/9789240010567-eng/sections/page-004.md` ~ `smart-base/library/9789241511766-eng/sections/page-002.md`
- 0.996 — `smart-base/library/9789240010567-eng/sections/page-004.md` ~ `smart-base/library/9789240081949-eng/sections/page-004.md`
- 0.994 — `smart-base/library/9789240010567-eng/sections/page-004.md` ~ `smart-base/library/9789240120747-eng/sections/page-004.md`
- 0.969 — `smart-base/library/9789240010567-eng/sections/page-014.md` ~ `smart-base/library/who-rhr-1806-eng/sections/page-001.md`
- 0.981 — `smart-base/library/9789240010567-eng/sections/page-017.md` ~ `smart-base/library/9789240120747-eng/sections/page-016.md`
- 0.969 — `smart-base/library/9789240010567-eng/sections/page-022.md` ~ `smart-base/library/9789240010567-eng/sections/page-132.md`
- 0.998 — `smart-base/library/9789240010567-eng/sections/page-051.md` ~ `smart-base/library/who-rhr-1806-eng/sections/page-004.md`
- 0.986 — `smart-base/library/9789240010567-eng/sections/page-059.md` ~ `smart-base/library/who-rhr-1806-eng/sections/page-001.md`
- 0.989 — `smart-base/library/9789240010567-eng/sections/page-099.md` ~ `smart-base/library/9789240120747-eng/sections/page-034.md`
- 0.986 — `smart-base/library/9789240010567-eng/sections/page-099.md` ~ `smart-base/library/9789240010567-eng/sections/page-173.md`
- 0.986 — `smart-base/library/9789240010567-eng/sections/page-099.md` ~ `smart-base/library/9789240010567-eng/sections/page-174.md`
- 0.988 — `smart-base/library/9789240010567-eng/sections/page-116.md` ~ `smart-base/library/9789241511766-eng/sections/page-038.md`
- 0.952 — `smart-base/library/9789240010567-eng/sections/page-120.md` ~ `smart-base/library/9789241511766-eng/sections/page-064.md`
- 0.981 — `smart-base/library/9789240010567-eng/sections/page-157.md` ~ `smart-base/library/9789240010567-eng/sections/page-159.md`
- 0.999 — `smart-base/library/9789240010567-eng/sections/page-173.md` ~ `smart-base/library/9789240010567-eng/sections/page-174.md`
- … and 10 more in the sidecar

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
