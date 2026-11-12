---
# folio-assistant-h9d1
$schema: bean/1.0.0
title: 'Memory: 11-11 follow-up to opt-in subgraphs: links gate on in CI, cleanup PRs, fa#3069 re-pin MERGED 13:00Z, tools#1900 slice fix merged; thread done'
status: completed
type: task
priority: low
created_at: 2026-11-12T09:45:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `subgraph-optin-links-2026-11-11.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: 11-11 follow-up to opt-in subgraphs: links gate on in CI, cleanup PRs, fa#3069 re-pin MERGED 13:00Z, tools#1900 slice fix merged; thread done

Thread cmsg_017WNUkNK8kdDziPK58Pv6G9R5a3GBLL4iHycFjXrEiM4Q. Continues folio-assistant-m4n1.

- Gate: tools#1843 (check-optin-links.ts, opt-in skills unlinked in README lists) + tools#1845 (composed into check-declaration-resolution as `optInLinks`; covered-by in gates.ts). Both merged. List regens cat-harness#1228, core#726 merged.
- fa#3069 (issue #3068, branch claude/optin-gate-repin): re-pin to current mains, gate shows 0 links. Stage red from (a) who-iris stale manifests (MM fixer who-iris#232 + other layers), (b) tools dbc369d4 moved todo pages to docs/todo/ while cat-harness declared docs/todos/ -> fix cat-harness#1235.
- Cleanup PRs, all green 03:38Z, sent to MM: cat-harness#1232 (skills reference regen), core#737 (svg/checklists/READMEs), tools#1858 (process-index test reads process dirs from the resolver incl. opt-in), sci#195 + fhir-harness#372 (dead links into opt-in groups unlinked).
- Next: after those + who-iris regen merge, re-pin fa#3069 again (python edit of index.config.json refs, `mount:remote --fresh`, `git checkout -- .github/workflows`, run jsonld --check + declaration-resolution), push, send sha to MM.
- Not mine: beans archive links (8rwa, tyyc, zq3f on state branch), fhir-harness Process_IgRelease chatter: MM fixers.

- DONE 11-11: fa#3069 merged 13:00Z (1d568823), all 12 pins at mains incl. smart-base 4804b342 (owner tap 07:23Z). Extra fixes: cat-harness#1235 (docs/todo/), core#741 (lint), tools#1862 (test IRI). tools#1900 merged 19:27Z: publish:check runs subgraph:jsonld before slice:sqlite (layer PRs had no payload tree). Rule (owner 10:56Z): re-pin PRs move EVERY pin to current main (tools#1881 gate). Full tier needs `release` label on fa PRs.
