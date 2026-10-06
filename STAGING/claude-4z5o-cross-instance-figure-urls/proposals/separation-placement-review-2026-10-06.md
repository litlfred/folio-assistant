# Separation placement review — 2026-10-06

Arc `7x5n` (GOAL 1 `vuip`). Measured on `main` `8b6039d` by two read-only review
agents and the coordinating session
(https://claude.ai/code/session_012qoycyCSGidZqW245vXhze). This page records what
must move, or be cut, **before** `litlfred/cat-harness(-tools)` and
`litlfred/folio-assistant-{core,sci}` are seeded from their staging directories.

**The owner's placement rule, verbatim (2026-10-06):**

> folio-asst-core focused on content authroiung, review pubilcation.   cat-harness on SDLC, tooling, decision making, general methdologies, basic common infra/state mgmt

**The owner on pace, verbatim:** *"not a race to separate.   do it properly."*

## Where each layer stands

`bun run seed:ready --layer <L>` (no `--rehearse`), 06:30Z:

| layer | verdict | rule | layer PRs | moving PRs | upward declared paths | standalone |
|---|---|---|---|---|---|---|
| cat-harness | not yet | `Rule_NextLayer` | 12 | 5 (#2229, #2197, #2192, #2189, #2080) | 0 of 134 | not measured (needs `--rehearse`); 375 failing on 10-06 |
| cat-harness-tools | not yet | `Rule_NextLayer` | 5 | 0 | 0 | not measured |
| folio-assistant-core | not yet | `Rule_NextLayer` | 6 | 1 (#2080) | 0 | not measured |
| folio-assistant-sci | not yet | `Rule_LayerMoves` | 2 | 2 (#2192, #2080) | 0 of 1 | not measured |

All four target repositories are **empty**: `git ls-remote` returns no refs, 2026-10-06.

## Graph dependencies

| check | result |
|---|---|
| `check:import-direction` | **0** wrong-direction imports in every instance. 76 `import(expr)` calls in 40 files cannot be determined |
| `check:partition` | 1,259 modules, 0 unassigned, 0 wrong-direction edges in cat-harness code |
| `check:tools-closure` | bootstrap-tools imports only itself and its declared packages |
| cat-harness-tools imports | all stay within {bootstrap-tools, cat-harness, cat-harness-tools}; `needs` matches |
| `check:reference-direction:strict` | **4,552** wrong-direction *mentions* (prose, names, paths) in 524 files; 162 files name several instances above them; 8 stale PENDING entries |

Imports are clean. Upward **paths and mentions** are not. A mention that is a
link or a path breaks when the layer stands alone.

### Hard-coded upward paths that no import gate sees (prerequisite)

- `cat-harness/scripts/check-term-mapping.ts:99` walks `folio-assistant-core/glossary`.
- `cat-harness/scripts/external-schemas.ts:336` reads `folio-assistant-core/schemas`.
- `cat-harness/skills/kg/graph-management/kg-detangle.ts:92` names `folio-assistant-core/schemas`.
- `cat-harness/tools/index.ts:2512`: Tool `glossary-build` runs `folio-assistant-core/scripts/build-glossary.ts`. Line 1544 names `folio-assistant-core/ns.jsonld`.
- `cat-harness/schemas/translation-tools.ts:221` points at a core BPMN.
- `cat-harness/scripts/gates.ts:199,237,248` runs `fhir-harness/scripts/*`. `task-io.ts` and `regen-after-merge.ts` name `smart-*` tasks.
- `cat-harness-tools/scripts/merge-train.ts:250-256` runs `smart-base` scripts.
- `qa-refresh.ts:162` hardcodes `["cat-harness","smart-base","who-iris"]`. `check-secret-leaks.ts:203` `ROOTS` includes `who-iris`.
- `cat-harness/schemas/jsonld.ts` defines core's vocabulary under `folio-assistant-core:` (38 lines), including the sci terms `leanRef` and `sorryFree`.

## Code still in cat-harness (D2: the KG repository holds no code)

- **1,475** tracked `.ts` files: 641 tests and 834 non-test. The 10-01 figure was 1,522.
- Non-test by directory: content 317 (189 `content/docs` block manifests, about 128 `content/pipeline`), scripts 277, schemas 172, src 41, skills 11, translations 7, tools 6, types 2, adapters 1.
- **220 KG-node `.ts` → code edges** (`y9r6`). 189 of them are `content/docs` manifests importing `schemas/builders.ts` (172) and `schemas/webpage.ts` (17).
- Moving cat-harness's code **wholesale into cat-harness-tools** (S5 `txue`) creates **no** upward import edges. Upward risk comes only from moving modules **above** tools.

## Move candidates

### Skills, processes, docs: new, not covered by any ruling

| item | now → proposed | confidence |
|---|---|---|
| `skills/sdlc/sdlc-core/diff.md` | cat-harness → core (content review) | high |
| `docs/guides/reseeding-the-lean-cache.md`, `docs/sage-mcp.md` | cat-harness → sci | high |
| `docs/concepts/architecture/folio-board-requirements.md` | cat-harness → core (boards already ruled to core) | high |
| `docs/guides/new-content-type.md` | cat-harness → core | med |
| `docs/qou-migration-checklist.md` | cat-harness → sci or the qou folio | med |
| `docs/process/publication-workflow.md` (+5 locales) | split: content processes to core; the index stays | med |
| `skills/ui/ui-core/html-rendering-qc.md`, `docs-generation.md` | split: generic half stays; content/paper half to core/sci | med |
| `folio-assistant-core/skills/library/cataloguing/glossary-build.md` | split: LaTeX half to sci; SKOS half and name stay | med |
| `skills/sdlc/sdlc-core/staging-review.md` | **keep or split, never whole**: 2 cat-harness BPMN name it | low |
| `docs/proposals/translation-block-audit.md` | cat-harness → core | low |
| 19 generated `docs/processes/*` pages for core/sci processes | retarget `gen-processes-viz.ts`; do not move by hand | high |

### Code and schemas

| module group | now → proposed | status | inbound / upward if moved |
|---|---|---|---|
| Lean, TeX, proof, witness code and Tool nodes | CH/CHT → sci | **ruled** (Q4, partition) | 78 / 5 |
| maths checkers (`q-usage`, `triviality`, `vacuity`, `conjectural-*`) | CH → sci | high | (counted above) |
| `_folio-chapter-profiles.qou.ts` | CH → the qou folio, as data | high | 2 / 1 |
| authoring/publication Tool nodes (`glossary-build`, `ingest-*`, `upload-url`, `l1-complete-check`, `folio-block-*`, …) | CH/tools → core/tools | high | n/a |
| folio MCP surfaces (`folio-init`, `readme-*`, `preview`, `translation`, …) | CHT → core | **ruled in part** (MCP placement; `mer2`) | 2 / 1 |
| review store and block CRUD (`feedback`, `qa-agent-write`, `blocks/*`, `manifest-entries`) | CH/CHT → core | **ruled** (C1) | 12 / 2 |
| `folio`/`glossary` graph typologies, `glossary-ledger` | CH → core | **ruled** (`q2wn`) | 30 / **22** |
| **content-object model** (`types`, `builders`, `webpage`, `block-kinds`, …) | **stays** (owner, 2026-10-06) | **ruled: keep** | 310 / 219 |
| bibliography (`citations`, `bib-qa`, `validate-references*`, …) | CH → core | med-high | 27 / 6 |
| library / L1 intake | CH → core | partition-triaged | 48 / 2 |
| content validation and publication pipeline | CH → core | med-high | 36 / 2 |
| authoring/review scripts (`narratives`, `summaries`, `todos`, `gen-docs-pages`, …) | CH → core | medium | 45 / 5 |
| **downward:** KG materialisation and subscription (`kg-materialize`, `materialization`, `kg-subscribe`, `kg-instantiate`) | core → CHT | medium | 15 / 0 |
| `schemas/jsonld.ts` vocabulary | split: core vocab to core, Lean terms to sci | medium | not measured |

### Ruled moves still pending (not relitigated here)

- Q1: five watchers and `narrative-asserts-code` to sci.
- Q2: `content-graph`, `uses-editorial-review` and `corpus-grep` split.
- Q3: Milnor to sci; `markdown-render-check` split.
- PR2: `getting-started`, `repo-conversion`, `board-windows`, `board-diagram-interchange` and `evidence-appraisal` to core, plus the editorial set: 14 skills to core `folio-editorial`, 3 to core `one-voice`, 6 to sci `paper-editorial`. **The per-item list was never written into the tree.** A proposed assignment is in the review report.
- PR9: the content-type doc pages.

## Open owner decisions

1. **Ruling 1A against the 2026-10-06 rule: RULED 2026-10-06.** The owner said *"do content split propoerly across repos"*, then *"that needs to be done before F"* (GOAL 5 resumes after the split). Read as a SPLIT: the method write-ups (the "how") stay in cat-harness as general methodology, and the operational content-authoring, review and publication skills, processes and code move to core, each split cleanly with no upward reference left behind. The question as it was put: 1A (2026-09-30) and the completed PR3 keep a generic `content` group in cat-harness: `content-lifecycle` (8 skills), the voice-review skills (3), `technical-documentation`, `review-task`, `review-narrative` and `voice-review.bpmn`. Today's rule says content authoring and review belong in core. Which wins decides the largest single skills move.
2. **The content-object model: RULED 2026-10-06, KEEP in cat-harness.** The owner chose "Keep in cat-harness" from three options (split with seams staying; keep; move all to core). It is common infrastructure every layer builds on. Nothing moves, and cat-harness's `content/docs` manifests keep importing `builders`/`webpage`. Under D2 those builders still go to cat-harness-tools with the rest of the code (S5), which is downward and allowed. The question as it was put: **The content-object model** (`schemas/types`, `builders`, `webpage`, `block-kinds`, …): core, or kept below as the seam every layer builds on? Moving it puts 219 importers below it, 189 of them cat-harness's own `content/docs` manifests.

## Prerequisites for a clean split, in order

1. In-flight PRs land; their sessions are wrapping up.
2. The owner's decisions above.
3. Hard-coded upward paths are cut: replaced by declaration lookups or by registration on load.
4. S5 `txue`: cat-harness code moves wholesale to cat-harness-tools, including the `y9r6` cut of the 220 KG-node → code edges.
5. Ruled and approved moves land, one concern group per PR, with a rewording pass wherever a staying file names a moved one.
6. Upward **mentions** that are links or paths are fixed (`check:reference-direction`).
7. The standalone failures reach 0 (`ho66`; Session A).
8. `bun run seed:ready --layer <L> --rehearse` answers **settled**; then the seed PRs go to each empty repository, on a branch.
