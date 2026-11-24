---
# folio-assistant-sp4k
$schema: bean/1.0.0
title: 'Content sites: shared site build presets and a link check that refuses the publish'
status: completed
type: task
priority: high
created_at: 2026-11-16T07:10:00Z
updated_at: 2026-11-22T15:45:00Z
parent: folio-assistant-v8bg
tags:
    - site-publish
    - handover
---

Owner chose option A (coordinator card, 2026-11-15/16) after smart-ra's glossary and bibliography 404s: one shared, layered list of site build steps for every content site, and every publish fails on a broken internal link. Thread "Stop content sites missing pages" (https://claude.ai/code/project/chan_017WNUkNK8kdDziPK58Pv6G9?thread=cmsg_017WNUkNK8kdDziPK58Pv6G9TknJmb6WAJuHJXQCHbrj7K).

## Design

- `site.build.extends: "<preset>"` → `templates/site-presets/<name>.json` of a mounted layer (cat-harness-tools `scripts/lib/site-presets.ts`). Preset fields = site.build + `extends`, `scripts` (step commands; the site's own package script of the same name wins), `when` (step needs a path; absent → skipped and said). Preset steps first, site's own after; within a phase the upper list orders steps it names again.
- `links: refuse` gates ALL unresolved internal links (platform pages, content pages, self-address, diagrams). Namespace IRIs (`…/v<N>/ns…`) never count. Declared `links`/`coverage` (even `report`) override the preset.
- Presets: cat-harness-tools `folio-base` (archimate when `archimate`, context, links refuse); folio-assistant-core `document-folio` extends it (document, library when `library`, review-sheet when `review`, glossary, bibliography, archimate, context).

## State

- Issue cat-harness-tools#2345; draft PR cat-harness-tools#2346 (mechanism + folio-base).
- Issue core#824; draft PR core#825 (document-folio preset).
- Drift found 2026-11-16: dth-hrh/dth-phc/dth-sc lack bibliography; dth-phc/dth-sc lack archimate+context; dth-pc lacks glossary+library. smart-ra fixed by WHO smart-ra#49 (merged 6211ebd).

## Next

1. Merge manager: core#855 (declare core's test/attestations/: the 4 links every site refused) and core#857 (glossary ArchiMate links to a mounted layer's pages go to its own site: dth-pc's 58), then WHO dth-hrh#160 (stale KG nodes; publish red on main since 11-18).
2. Re-pin core in each site PR after #855 (and #857 for dth-pc), then hand over: WHO dth-hrh#158, smart-ra#92, dth-pc#5, dth-phc#13, dth-sc#8 (all draft, extends document-folio).
3. Close cat-harness-tools#2345 and core#824 when the five are merged.

_2026-11-16T07:10:00Z_ — Created by thread "Stop content sites missing pages", session https://claude.ai/code/session_01Qmmkt8uBwv6vsMUHNmy7AQ.

_2026-11-21T16:49:35Z_ — tools#2346 and core#825 merged. Five site PRs open, one per site (above), each built locally with links: refuse: dth-hrh 28,749 pages/4 misses, smart-ra 32,800/4, dth-sc 28,280/4, dth-phc 28,990/4 (+22 Fig. 3 links fixed in #13: old elements/ address), dth-pc 28,356/62 (4 + 58 fixed by core#857). The 4 shared misses are core's undeclared attestation pages (core#854/#855). Found WHO dth-hrh Site publish red since 11-18 (KG nodes stale after the IRI base move): #159/#160.

_2026-11-22T15:45:00Z_ — Done. tools#2483 and core#857 fixed the shared misses (core#855 closed instead). All five re-pinned (owner card 2026-11-21 17:48Z), 0 unresolved links locally, full tier green. Merged on the owner's "only non-content" answer (11-21 23:25Z): smart-ra#92 24d0049, dth-pc#5 499564b, dth-sc#8 1e3558e, dth-hrh#158 ca131e4. dth-phc#13 935dbce on the owner's content-exception card (11-22 15:33Z). tools#2345 closed; core#824 was already closed. Note: the full tier runs only with a release or ready-to-merge label, and only a release or preview label event starts a run.
