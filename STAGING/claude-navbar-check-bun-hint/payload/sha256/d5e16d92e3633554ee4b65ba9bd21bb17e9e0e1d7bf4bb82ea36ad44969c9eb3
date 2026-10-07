---
# folio-assistant-ibxa
title: 'REQUIREMENTS SUB-GRAPHS: proposals under docs/proposals/, filed to docs/requirements/ on ship; a bootstrap Requirement; test runs reference requirements'
status: completed
type: task
priority: normal
created_at: 2026-09-23T19:34:00Z
updated_at: 2026-09-23T20:42:41Z
parent: folio-assistant-2upx
---

Issue #1164. Owner, 2026-09-23: CRDM proposal documents for harness feature work live under docs/proposals/ (a declared sub-graph of docs, folded in the navbar — general behaviour); when the feature ships they become docs/requirements/, filed against a requirements schema generalised from the DAK one with NO outside concept in bootstrap; the Test schema lists requirements as an array.

Owner's choices: schema home '1 + 2' (base in bootstrap, cat-harness built on it); test array = references; on ship = move, no name collision; format = markdown front matter for now.

## Done when
- [x] bootstrap/schemas/requirement.ts, with no outside concept, and cat-harness Requirement built on it
- [x] folio-test-run/v1 carries requirements: req:<slug>#<key>[]
- [x] check:bootstrap-concepts holds bootstrap schemas to it; the smart-guidelines example is gone
- [x] proposals and requirements kinds, within docs, declared; the navbar folds any kind with within
- [x] check:requirements: schema-valid front matter, id = file name, no slug in both
- [x] crdm-requirements-workflow says where the documents live and how a proposal is filed

## Summary of Changes

Built 2026-09-23, issue #1164.

- **`bootstrap/schemas/requirement.ts`**. A requirement is titled statements, each with a `conformance` level. The level keeps the existing field name, so no file moved. Statements come in two kinds:
  - `functional`: `activity`, `capability` ("I want"), `benefit` ("so that").
  - `non-functional`: `category`.

  A statement of one kind carrying the other kind's fields is refused. So are duplicate keys, and a superseded requirement that names no successor. Also provided: `req:<slug>[#<key>]` references, `proposedIn`, and `status`. The schema names no outside concept, even in quotation.
- **The cat-harness `Requirement` is built on it.** Only `satisfiedBy` is narrowed, and the base's refinements are re-applied. All 7 existing `skills/requirements/*.json` files still parse. The FHIR wording went from its comments.
- **`folio-test-run/v1`** gains `requirements: RequirementRef[]`. It is optional, so older runs still parse. Tests point at requirements, never the reverse.
- **`check:bootstrap-concepts`** reads the bootstrap instances' DECLARED schema directories. It fails on derivative, organisation or standard names, and it is not fooled by English: "who" and "smart" pass. The `smart-guidelines` example is gone from `discussion.ts` and from its generated JSON Schema.
- **Sub-graphs declared FROM WITHIN.** Per the owner's #980 ruling, `docs/docs.json` names `proposals/` and `requirements/`, and `docs` names that file as its `declarationFile`. The kinds `proposals` and `requirements` declare `within: "docs"`, a new general registry relation. They are non-renderable, because `docs` builds their pages. A first cut declared them from the root, and `check:layout-norms` refused it. That was correct: it is the forbidden shape.
- **The navbar folds any `within` kind** under its parent's row, in a `<details>` with no `open`. A child whose parent is not listed stands alone. `harness-tiles` lists only nested entries whose kind says `within` its parent, so `beans/` and `todos/` inner nodes do not become folders. The conventional page now also accepts `index.md`, and that changed no existing kind.
- **`check:requirements`** checks that front matter parses as a `Requirement`, that the id equals the file name, and that no slug is in both sub-graphs.
- **The CRDM skill** has a new STRICT section: proposals are updated in place under `docs/proposals/`. On ship, the proposal is `git mv`'d to `docs/requirements/` and filed. How filing is ORGANISED waits on `qh1s` (literature search) and `1gf7` (open standards).
- Avatars for both kinds, and rows for both in `directory-conventions.md`'s kind table.

**Left for the owner:** `smart-guidelines` also appears in the bootstrap SKILLS (`discussion.md`, `confirm-harness.md`), in `initialize-harness.bpmn` and in its five `.pot` catalogues. The ask named schemas, so those were not touched.

Verified: `requirements.test.ts` passes 19/19. Navbar-row e2e passes 43/43, and turning off the nesting makes the new spec fail. `check:bootstrap-concepts` fails with the old example restored. The full e2e suite passes 623/623, and `bun run gates` passes 138/138.
