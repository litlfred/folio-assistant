---
# folio-assistant-lbz8
title: 'AUTO-DOCS FAMILY: generated FHIR IG pages (gen-ig-pages) move off main to cat/fhir-harness/ig-docs'
status: in-progress
type: task
priority: normal
created_at: 2026-10-04T12:55:24Z
updated_at: 2026-10-04T13:49:53Z
parent: folio-assistant-fs43
blocked_by:
    - folio-assistant-xsrv
---

Owner, 2026-10-04: *"auto-docs (e.g. fhir) should be in cat/cat-harness/auto-docs so not pollute main. or maybe cat/fhir-harness/ig-docs"*. Asked with options, the owner chose **cat/fhir-harness/ig-docs** (option 1 of 3).

## Why this name
- The pages have ONE writer: fhir-harness's `gen-ig-pages`. So the branch is named for the harness that produces them (`cat/<harness>/<subgraph>`), and route-keying's one-writer-per-route premise holds.
- The same name works unchanged inside every IG fork (n3ni stage E: litlfred/smart-trust#5 carries 2160 such pages under `smart-base/docs/`). It names nothing WHO-specific, which fhir-harness requires.
- Rejected: `cat/cat-harness/auto-docs`, because in a fork it is named after a harness that isn't the fork's and it mixes writers. Also rejected: waiting for stage F.

## Where it sits in the train
- `xu0t` (owner's order): beans, then auto-docs, then qa-reports.
- Within auto-docs, `xsrv` moves the first family (`docs/uml/`, one generator, one gate) using `storage.keyedBy: "route"` (#1996). **This is a later family and waits on xsrv**, so a red can be bisected to one family.
- Proposal #1966 (merged): one `auto-docs` subgraph, sub-sub-graphs per writer, layer `derived`. This bean is the gen-ig-pages sub-sub-graph.

## Size today (measured on main, 2026-10-04)
- smart-trust/docs: 2161 files
- smart-base and smart-immunizations docs: 305 and 756 pages per their `:pages:check` output

## Done when
- [x] the branch exists, seeded and verified (owner, 2026-10-04: "make cat/fhir-harness/ig-docs"), with `main` still authoritative
- [ ] the gen-ig-pages sub-sub-graph is declared under auto-docs with `storage` on cat/fhir-harness/ig-docs, keyed by route
- [x] `<ig>:pages:check` reads through the branch store (route-authority, #2053); `could not determine` (exit 4) when the branch is unreachable, never clean. The WRITE half (publishing to the branch) is still to do
- [ ] a MAIN workflow regenerates and publishes the route branches after each merge (owner, 2026-10-04)
- [ ] the STAGING workflow rebuilds only the dependency cone of a PR's changes (general rule, in the skills)
- [ ] the just-the-docs build pulls IG pages from cat/fhir-harness/ig-docs and QA results from qa-reports
- [ ] the pages leave main for each IG still staged here
- [x] each IG fork uses the same branch name for its own pages (litlfred/smart-trust#5 first: ee00983e)

## 2026-10-04: branch seeded (owner: "make cat/fhir-harness/ig-docs")

`cat/fhir-harness/ig-docs` is at b3357f16, an orphan commit modelled on `cat/cat-harness/uml-overview` (xsrv).
- **Contents:** gen-ig-pages output for smart-trust (2160), smart-base (305) and smart-immunizations (756), with paths mirroring the checkout. Each `docs/README.md` is excluded, because a different generator writes it and a route has one writer.
- **Manifest:** `state-manifest/v1`, `keyedBy: route`, `status: seed`, `authoritative: false`. Writer and gate are named.
- **Verified:** every page's blob equals main@63ec4fff's, checked before the push and again from a cold `git init` fetch.
- **Nothing reads it yet**, and main keeps its copy. The remaining steps, in order: the reader (`--check` reads the branch, unknown when unfetchable), then `storage` on the declarations, then removal from main on the owner's go. The owner's explicit ask moved the seed ahead of xsrv; the cutover stays behind it.

## 2026-10-04: the fork's branch too

litlfred/smart-trust now has its own `cat/fhir-harness/ig-docs` (ee00983e). It holds 2160 pages under `smart-base/docs/`, generated from the fork's artefact index by the folio-assistant submodule with #2082's fix, and `--check` reported them current. Its blobs equal folio-assistant's ig-docs `smart-trust/docs/` everywhere except `index.md`, whose front matter names each repository's index path. So one branch name and one layout serve both repositories.

## 2026-10-04: the reader (gen-ig-pages --check through route-authority)

`gen-ig-pages --check` now compares through `compareRoute` (#2053), keyed by the docs directory's declared id. Measured:
- **Live verdicts unchanged:** no `storage` is declared, so all three IGs read from the checkout and are current.
- **With storage declared temporarily on the real branch** (`authoritative: false`): it reads both copies, current, exit 0. A page edited only on disk is reported as DRIFT and refused.
- **With storage on a branch that doesn't exist:** "COULD NOT DETERMINE … not a pass", exit 4.

Next: the write half (`<ig>:pages` publishes to the branch through branch-store's `publish --id`), then `storage` on the declarations, then removal from main on the owner's go.

## Owner rulings, 2026-10-04 (asked: when is a route branch written, and what does a PR's check compare?)

> *"need main and staging workflows. staging rebuild only what is dependency cone of changes (general rule. update skills)"*
> *"also need to update justthedocs rendering pipeline to pull from cat/fhir-harness/ig-docs as well qa-reports"*

So:
- **A MAIN workflow:** after a merge, it regenerates and publishes to the route branches (`cat/fhir-harness/ig-docs`, and `xsrv`'s `cat/cat-harness/uml-overview`).
- **A STAGING workflow** (per-PR preview): it rebuilds **only the dependency cone of what the PR changed**. This is a GENERAL rule, so it goes into the skills, not just this bean.
- **The just-the-docs build** pulls IG pages from `cat/fhir-harness/ig-docs` and QA results from `cat/cat-harness/qa-reports`, rather than needing them committed on main.

Mapping the existing pipeline (docs-site, feature-staging, compose-docs's existing "cut", qa:fetch, branch-store) before building.

## 2026-10-04: two sibling beans
- **nama**, DERIVED-GRAPH DEPENDENCIES: derived subgraphs declare what they are computed FROM (fhir-ast -> ig-docs -> gh-pages; lean-cache). Until it lands, declaration order is the rendering order (owner).
- **4j86**, STAGING CONE at file level (owner chose option 1): this bean's staging item is that one.

QA results already come from qa-reports in both site builds (qa-site-assets.ts fetch and verify, in docs-site.yml and feature-staging.yml), so that half of the owner's site-build ask exists already.
