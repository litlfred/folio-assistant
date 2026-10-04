---
# folio-assistant-lbz8
title: 'AUTO-DOCS FAMILY: generated FHIR IG pages (gen-ig-pages) move off main to cat/fhir-harness/ig-docs'
status: in-progress
type: task
priority: normal
created_at: 2026-10-04T12:55:24Z
updated_at: 2026-10-04T13:22:44Z
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
- [ ] `<ig>:pages` writes and `<ig>:pages:check` reads through the branch store; `could not determine` when unmounted, never clean
- [ ] the pages leave main for each IG still staged here
- [ ] each IG fork uses the same branch name for its own pages (litlfred/smart-trust#5 first)

## 2026-10-04: branch seeded (owner: "make cat/fhir-harness/ig-docs")

`cat/fhir-harness/ig-docs` is at b3357f16, an orphan commit modelled on `cat/cat-harness/uml-overview` (xsrv).
- **Contents:** gen-ig-pages output for smart-trust (2160), smart-base (305) and smart-immunizations (756), with paths mirroring the checkout. Each `docs/README.md` is excluded, because a different generator writes it and a route has one writer.
- **Manifest:** `state-manifest/v1`, `keyedBy: route`, `status: seed`, `authoritative: false`. Writer and gate are named.
- **Verified:** every page's blob equals main@63ec4fff's, checked before the push and again from a cold `git init` fetch.
- **Nothing reads it yet**, and main keeps its copy. The remaining steps, in order: the reader (`--check` reads the branch, unknown when unfetchable), then `storage` on the declarations, then removal from main on the owner's go. The owner's explicit ask moved the seed ahead of xsrv; the cutover stays behind it.
