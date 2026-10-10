---
# folio-assistant-ml9h
title: 'DRAIN 2026-10-10: open bean backlog across cat-harness, cat-harness-tools and folio-assistant-core, leaves up, three lanes'
status: in-progress
type: epic
priority: high
created_at: 2026-10-10T15:40:10Z
updated_at: 2026-10-10T15:46:50Z
---

Drain the open bean backlog across the three bean stores the separation left, working LEAVES UP: a bean is taken only when it is `todo`, not an epic/milestone, has no open children and no open blocked-by. Parents close when their last child closes — never before.

## Census (2026-10-10 15:40 UTC)

| store | where it lives | open | ready leaves (todo) |
|---|---|---|---|
| cat-harness graph | `beans/` here (state branch `cat/cat-harness/beans`) | 190 | 64 not duplicated elsewhere |
| cat-harness-tools | `litlfred/cat-harness-tools` `beans/defs` | 74 | 31 |
| folio-assistant-core | `litlfred/folio-assistant-core` `beans/defs` | 64 | 43 not duplicated in tools |

The separation COPIED beans: 50 ids sit in both cat-harness and tools, 42 in both cat-harness and core, 6 in tools and core.
**Ownership rule for duplicates:** the separated repo's store owns the bean; the cat-harness copy is a mirror. Whoever closes a duplicated bean closes every copy in the same turn (the cat-harness copy via `bun run cat state:push`), so no lane re-does it.

## Lanes

- **Lane A** — this session (`claude/funny-keller-n85iva`): cat-harness-only beans.
- **Lane B** — new session: cat-harness-tools store (incl. its duplicates).
- **Lane C** — new session: folio-assistant-core store (minus those also in tools).

## Rules every lane follows

1. Skip `in-progress` beans: five sibling sessions are live and a claim is theirs until a stale-claim sweep says otherwise.
2. Claim before work (`-s in-progress`, pushed), one bean at a time, bugs and high priority first.
3. One PR per bean or tight cluster, driven to green. MERGE WINDOW: owner ruled "4 hours" at 15:46 UTC 2026-10-10 — merge when green until 19:46 UTC; relayed to lanes B and C. After that, leave green PRs for review.
4. A bean that turns out to need an owner decision: record the question in the bean (`## Owner decision`, ≤4 numbered options, recommended first, default stated) and move on — never block the lane on it.
5. A bean that is obsolete after the separation: scrap with `## Reasons for Scrapping`.
6. Close with `## Summary of Changes`; then close the parent if it has no open children left.

### Lane A — 52 workable, 12 need an owner decision

- [ ] `folio-assistant-kpcl` (high, task) STREAM 4/4: trust the instruments — the stale-claim sweep, CI that does not fire, and the QA record (1xhc + 1s
- [ ] `folio-assistant-4tnt` (normal, bug) folio-test main lags the pipeline: the dogfood folio does not exercise what folio_init writes today
- [ ] `folio-assistant-5ulq` (normal, bug) STRICT IN NAME ONLY: 9 workflow instances against 755 merges, and no gate reads beans/workflows at all
- [ ] `folio-assistant-7x8o` (normal, bug) TRANSLATIONS: 8 pairs may carry less than their source — but 7 of the original 9 were the extractor's hard wra
- [ ] `folio-assistant-g4oc` (normal, bug) Upstream DAK post-processing defects: view-page tabs, stale schemas/ copies, dead hub links
- [ ] `folio-assistant-m4s1` (normal, bug) TRANSLATION CATALOGUES: 36 (locale, page) .po files must be AUTHORED — the templates now exist, nobody has bee
- [ ] `folio-assistant-0lde` (normal, task) L1 EVIDENCE: ingest the external evidence an L1 guideline computes from (PICO question sets, Cochrane/WHO syst
- [ ] `folio-assistant-4475` (normal, task) Run build-ig-site in an IG's own repository (smart-trust first), once folio-assistant is split
- [ ] `folio-assistant-4dbr` (normal, task) Forge portability: GitLab and sovereign-compute as additional Tool nodes, not a sixth repo
- [ ] `folio-assistant-4y2i` (normal, task) TOPOLOGY: sovereign cloud — hosted forge, jurisdiction-defined URLs, L4-L5 data stores
- [ ] `folio-assistant-61tg` (normal, task) TOPOLOGY: self-sovereign — own infrastructure, inward-facing, wallets and DAK intake
- [ ] `folio-assistant-79t3` (normal, task) A repo's type set is the markers it carries, closed under the dependency tree
- [ ] `folio-assistant-7jkp` (normal, feature) cat-openapi: two ingest tools — OpenAPI into the KG from SOURCE (a repo) or from RENDERED (a published spec/si
- [ ] `folio-assistant-8fq9` (normal, task) Placement PR7: tests regroup by concern group, retargeted to cat-harness-tools/
- [ ] `folio-assistant-8lcl` (normal, task) Separation stage 1b: Zod moves to cat-harness-tools; generated JSON Schema stays in cat-harness
- [ ] `folio-assistant-8mlt` (normal, task) CREDENTIALS (iv): rename BOOTSTRAP_PAGES_TOKEN -> PUBLISH_SITE_BOOTSTRAP (bootstrap-tools) and MERGE_MAIN_TOKE
- [ ] `folio-assistant-95sk` (normal, task) FOLIO AS CONVENTION (R24, R27–R29): the folio on any harness, materialised assets and reader documents in foli
- [ ] `folio-assistant-9hxd` (normal, task) CREDENTIALS (iii): credentials/ declaration (needs, profile, registry) for bootstrap-tools and folio-assistant
- [ ] `folio-assistant-a9tx` (normal, feature) IG PUBLISHER FORK: requirements for an agent working a local experimental fork, and what the AST must carry
- [ ] `folio-assistant-amom` (normal, feature) MODE: test/swarm — a stack of models over shared or independent work queues
- [ ] `folio-assistant-b5f0` (normal, task) INSTANTIATION: what it means to instantiate a harness — the config file, the slot, and the process that cannot
- [ ] `folio-assistant-bbza` (normal, task) S5-b: tool implementations land on their layer — folio-specific to core, maths to sci (23 rows)
- [ ] `folio-assistant-c4rz` (normal, task) Migrate the feedback store into the declared todos/ graph
- [ ] `folio-assistant-cy4p` (normal, task) BPMN ENGINE: a Tool node, with downcompilation per coding agent
- [ ] `folio-assistant-ec2a` (normal, feature) LSI over blocks and Lean declarations: extend lsi-indexing with folio and lean-decl graph kinds and a cross-gr
- [ ] `folio-assistant-esz4` (normal, feature) Every special branch carries a README declaring what it is, how and when it was generated — and it is KG, not 
- [ ] `folio-assistant-f1e1` (normal, feature) Identity of the person typing, outside a GitHub environment — needs WAY more work
- [ ] `folio-assistant-f8wp` (normal, task) Placement PR8: schemas regroup and move with their importers; library sources by group; residual gate
- [ ] `folio-assistant-h3tx` (normal, feature) PHASE P4: the Publisher invoked for AST + QA only; a release still cut from a full build and saying so
- [ ] `folio-assistant-jzba` (normal, task) CREDENTIALS (ii): secrets:check — declared needs vs workflow usage vs secret names vs expiry registry
- [ ] `folio-assistant-k3ml` (normal, task) CREDENTIALS (i): secrets skill — add/rotate/revoke per mechanism, GitHub App walkthrough for a personal accoun
- [ ] `folio-assistant-lthi` (normal, task) S4-c: cat-harness items owed to core, who-iris, smart-base, fhir-harness or the root (~45 rows)
- [ ] `folio-assistant-mgxw` (normal, task) S7 seed staging repos the sibling's way: one seed PR per litlfred/<name> repo, on a branch
- [ ] `folio-assistant-mkqf` (normal, task) QUEUED STREAM C: what the reader receives — deployment topologies and translation (5a3l + bzyu, 20 open beans)
- [ ] `folio-assistant-ohx6` (normal, task) CAT-HARNESS/FOLIO: a minimal just-the-docs rendering describing folio, and folio/render for the rendering skil
- [ ] `folio-assistant-oycs` (normal, task) Remove the legacy special-branch names (qa-reports, lake-cache/, fhir-ast/, state) once every remote is rename
- [ ] `folio-assistant-oz9e` (normal, feature) BENCHMARK: outcome evaluation of harness runs across models (close B8 — accuracy, not only structure)
- [ ] `folio-assistant-pzwb` (normal, task) Placement PR2: finish splitting folio-core and regroup the harness skill topics
- [ ] `folio-assistant-q2aj` (normal, task) Recheck Beads (gastownhall/beads) maturity against beans
- [ ] `folio-assistant-qh1s` (normal, task) LIT SEARCH: a process and methodologies for organising requirements as they are filed
- [ ] `folio-assistant-qzsq` (normal, task) Subscriptions vs remote mounts of the same instance: kg:subscribe on cat-harness trips reference-direction; on
- [ ] `folio-assistant-rfuq` (normal, task) S4 direction and placement: zero wrong-direction edges; placement PR2-PR9; 9umr finale
- [ ] `folio-assistant-rnfl` (normal, task) Phase I.3 — rename `content/` → `folio/` (2,408 occurrences, 429 files) (#223)
- [ ] `folio-assistant-saqd` (normal, task) S5-a: maths code out of cat-harness into folio-assistant-sci's code (#223 partition; 49 MOVE + 10 split)
- [ ] `folio-assistant-syiq` (normal, task) S4-a: cat-harness sci-subject skills move or split to folio-assistant-sci (watchers, editorial graph, Milnor; 
- [ ] `folio-assistant-txue` (normal, task) S5 code out of cat-harness: stages 1a-1d (70lx absorbs w2gr 3b), 8lcl, y9r6, vj2p
- [ ] `folio-assistant-vj2p` (normal, task) Separation stage 1d: cat-harness is self-contained — each instance hosts its own outputs; prose cites code by 
- [ ] `folio-assistant-vm6m` (normal, feature) TEST DATA: fixed and generated data sets as a skill family, specialised per content type
- [ ] `folio-assistant-w1gy` (normal, task) Separation stage 5: QA both new repositories from fresh sibling clones
- [ ] `folio-assistant-whbf` (normal, feature) Overview panel: the DYNAMIC half — drag, re-run layout, alternate arrangements
- [ ] `folio-assistant-x4mt` (normal, task) SKILLS: cross-agent installation + fa- namespace prefix (issue #247)
- [ ] `folio-assistant-ybsz` (normal, task) S6 standalone rehearsal: ho66, pyds, mer2 -> tndo -> zmdo, izqr, wggr

Owner-decision (collect, ask in one batch, do not block on):
- [ ] `folio-assistant-rq8s` A SESSION BLOCKED ON THE OWNER IS INVISIBLE: four sessions held verbatim questions that only the session API c
- [ ] `folio-assistant-4682` Agent memory target: Gemini CLI (not implemented — owner 2026-10-06)
- [ ] `folio-assistant-4fv8` Placement PR4: whole roles, stories, actors and capabilities move up to their owners
- [ ] `folio-assistant-502c` EXPERIMENT: forced along a BPMN vs managing it — do outcomes change, at what compute?
- [ ] `folio-assistant-5zs1` Agent memory target: OpenAI Codex CLI (not implemented — owner 2026-10-06)
- [ ] `folio-assistant-ffv7` ASK DOWNSTREAM: would a kg-to-portal consumer read SPDX (SBOM or licence ids)? D1 of the SPDX proposal waits o
- [ ] `folio-assistant-l9v6` DECISION (proposed): which CDN layer, if any, in front of the WHO L1 corpus (slide 2, #1614)
- [ ] `folio-assistant-smbc` Separation stage 3: owner authorises seeding litlfred/cat-harness and litlfred/cat-harness-tools
- [ ] `folio-assistant-uvfs` Agent memory target: Cursor (not implemented — owner 2026-10-06)
- [ ] `folio-assistant-vljz` QA: test data for SME review of decision support and indicator definitions
- [ ] `folio-assistant-w0at` S8 cut over: submodule if imported, subscription if read; in-tree copy removed only on owner OK
- [ ] `folio-assistant-xxh4` Agent memory target: GitHub Copilot (not implemented — owner 2026-10-06)

### Lane B — 28 workable, 3 need an owner decision

- [ ] `folio-assistant-lvoa` (high, bug) TYPECHECK PROGRAM: folio-assistant-core/scripts is outside it — 33 files, and every instance-boundary move add
- [ ] `folio-assistant-0dav` (high, task) QA READERS F2b: the eleven self-sidecar gates compute and judge; audit-coverage stops reporting a moved kind a
- [ ] `folio-assistant-197s` (normal, bug) Dependabot cannot run Bun here: 'could not run Bun … configuration error' on #908, and the npm ecosystem never
- [ ] `folio-assistant-1qrr` (normal, bug) FEATURE-STAGING: the workflow definition comes from the BASE but the checkout is the PR HEAD, so a newly-added
- [ ] `folio-assistant-34cm` (normal, bug) The committed site build under cat-harness/docs/ is 44% of all merge conflicts, and the publish workflow rebui
- [ ] `folio-assistant-5qy8` (normal, bug) QA SIDECAR LOCATION CONTRADICTION: the folio_init template commits *.qa.json while AGENTS.md puts QA on the qa
- [ ] `folio-assistant-5rmf` (normal, bug) NAVBAR QR ICON GONE: the LHS top row's QR code for the current page no longer appears, though its generator st
- [ ] `folio-assistant-ey1c` (normal, bug) MERGE PIPELINE ASYMMETRY: merge-main regenerates a PR branch, but nothing regenerates main after a PR merges i
- [ ] `folio-assistant-loxz` (normal, bug) regen reports audit:coverage:strict current while the artefact on disk differs from what its writer produces
- [ ] `folio-assistant-p3zo` (normal, bug) AGENT CONTAINERS RUN THE WRONG BUN: the session-start hook should install .bun-version (1.3.14), not leave the
- [ ] `folio-assistant-1dre` (normal, feature) PAGES SERVING PROBE: the instrument pages-publish-health counts, and it can only be built in CI because egress
- [ ] `folio-assistant-2ae2` (normal, task) Readers: docs site, feature staging, review heat map and MCP tools fetch QA from qa-reports
- [ ] `folio-assistant-5xfr` (normal, task) qou's pin bump must rename folio.config.json AND add qaAxes in the same commit, or it silently loses both
- [ ] `folio-assistant-6qk5` (normal, task) QA REVIEW MODE: translation QA joins the audited review record under test/results
- [ ] `folio-assistant-7mwa` (normal, task) Retire qa:resolve-conflicts and the test/results .gitattributes entries; move the 14 per-instance test/results
- [ ] `folio-assistant-89wq` (normal, task) Four QA checkers are unconditional n/a stubs — 8949 sidecar entries indistinguishable from a correct decline, 
- [ ] `folio-assistant-abmq` (normal, task) MERGE GATE (c): RED FLAG taxonomy, verdict sidecar shape, and the recorded override path
- [ ] `folio-assistant-eqxp` (normal, task) MERGE FRICTION, one week on: the top churners have changed and four more pass 1swy's test
- [ ] `folio-assistant-ff09` (normal, task) DOGFOOD test plan #1: certify the crdm-detect skill against a plan built from its existing 27-case run
- [ ] `folio-assistant-h1uq` (normal, task) WARN -> BLOCK NEEDS A NUMBER: no false-positive rate exists for any agentic reviewer, and only a warn-only pha
- [ ] `folio-assistant-lx2s` (normal, task) Feature-branch staging under gh-pages (issue #215)
- [ ] `folio-assistant-oz5w` (normal, task) STAGING CLEANUP vs BRANCH REUSE: merging PR N deletes the preview PR N+1 just published
- [ ] `folio-assistant-pnn5` (normal, task) v8n5 Done-when #2 promised coverage 'the day instance #2 declares a theme' — that day came and nothing compare
- [ ] `folio-assistant-sopq` (normal, task) Mine the WHO IG starter kit SOPs for DAK QA criteria
- [ ] `folio-assistant-w8jq` (normal, task) MERGE GATE (a): adversarial agentic code review is a required check on any agent-touched PR, with a committed 
- [ ] `folio-assistant-xqdi` (normal, task) MERGE GATE (b): content-type compile gates - Lean builds, SUSHI/IG AST compiles, JSON-LD + schema validate; si
- [ ] `folio-assistant-zaui` (normal, task) CERTIFICATION family in qa-attestations/v1: where test-plan-execution files a signed certification
- [ ] `folio-assistant-0qjq` (low, bug) MERGE-MAIN APPROVAL STALL — CORRECTED: already handled by design; the only gap is `stage`, deliberately previe

Owner-decision (collect, ask in one batch, do not block on):
- [ ] `folio-assistant-1l13` witness-pipeline.yml has never run — keep, template, or retire?
- [ ] `folio-assistant-4iey` PER-PLAN exit-criteria DMN: test-plan-execution looks up the plan's own decision table
- [ ] `folio-assistant-68k7` resolveDirectories climbs the checkout's PARENT: is that intended for the ROOT instance?

### Lane C — 40 workable, 3 need an owner decision

- [ ] `folio-assistant-6xaz` (normal, bug) pdf-structure infers a TOC from a worked EXAMPLE and ships it as the document's own structure
- [ ] `folio-assistant-mw5z` (normal, bug) who-iris's two AUTHORED docs pages render as raw markdown and nothing links them
- [ ] `folio-assistant-0jtl` (normal, task) SKILLS: a review package in folio-assistant-core — large-document-review, review-heatmap, review-navigation, l
- [ ] `folio-assistant-1r0p` (normal, task) INGEST: audio — transcription and translation
- [ ] `folio-assistant-423d` (normal, task) REVIEW COMMENTS: anchored to block id as 9gyz Findings, surviving moves — and the write path a static page lac
- [ ] `folio-assistant-4kj4` (normal, task) AVATARS: per-kind avatar, in and out of trash, both schemes, with a QA axis for coverage
- [ ] `folio-assistant-55ao` (normal, task) Add a first-class `recommendation` block kind for document folios
- [ ] `folio-assistant-5xzc` (normal, feature) QA: block ids in the folio/ graph are unique and stable across render, move and re-ingest — the precondition e
- [ ] `folio-assistant-6eiw` (normal, task) Library titles for non-PDF entries (pptx deck, CODATA table)
- [ ] `folio-assistant-7x7g` (normal, task) external-schemas visualiser: 8 wireframe findings
- [ ] `folio-assistant-9scf` (normal, task) folio visualiser: 5 wireframe findings
- [ ] `folio-assistant-bgrz` (normal, task) translation-status visualiser: 6 wireframe findings
- [ ] `folio-assistant-ckej` (normal, feature) CONJECTURE REGISTER: a register node per open problem, and a formal|identification field on conjecture() (foli
- [ ] `folio-assistant-cz17` (normal, task) Migrate dak.json in: the DAK type is ours, and its Logical Model is pending upstream
- [ ] `folio-assistant-d5f1` (normal, task) INGEST: narrative description per image, localized, including images extracted from PDFs
- [ ] `folio-assistant-db80` (normal, task) methodologies visualiser: 8 wireframe findings
- [ ] `folio-assistant-dm4j` (normal, task) todos/index.html serves ZERO notes without JavaScript — the one page most about notes is the only one with no 
- [ ] `folio-assistant-dp1j` (normal, task) KG AFFORDANCES: browse, materialise, instantiate, copy-into-my-folio — as processes and skills, gated by write
- [ ] `folio-assistant-duez` (normal, task) beans visualiser: 7 wireframe findings
- [ ] `folio-assistant-eief` (normal, feature) CSVW skill + ingestion tools: tabular metadata as far as it can be determined
- [ ] `folio-assistant-hf2q` (normal, feature) PROGRAMME PROGRESS: an epic burn-down and a math-progress heat map as a board feed
- [ ] `folio-assistant-jo87` (normal, task) QUEUED STREAM A: INGEST — uploads/ to a complete L1 library (slw1, 13 open beans)
- [ ] `folio-assistant-k660` (normal, task) QUEUED STREAM B: the authoring surface — content model, memory and voice (0lmb + 8jt6 + 2upx, 16 open beans)
- [ ] `folio-assistant-krmw` (normal, task) docs-index visualiser: 6 wireframe findings
- [ ] `folio-assistant-ktt2` (normal, task) INGEST: round-trip translation QA — back-translate to catch semantic drift and bad terminology
- [ ] `folio-assistant-kx0p` (normal, task) catalogue visualiser: 6 wireframe findings
- [ ] `folio-assistant-kx6i` (normal, feature) PAPER SITE in the harness rendering (yj32): math, Lean links and notation macros, blocking qou's legacy-render
- [ ] `folio-assistant-nnpk` (normal, task) schemas visualiser: 5 wireframe findings
- [ ] `folio-assistant-o7eq` (normal, feature) URL SPACE: rendered assets mirror the instantiation structure — <baseurl>/ for the root, <baseurl>/<instance>/
- [ ] `folio-assistant-oi3h` (normal, task) fsh-guts visualiser: 7 wireframe findings
- [ ] `folio-assistant-qbfi` (normal, task) REVIEW HEAT MAPS: section-by-metric matrix of change, coverage, findings, QA and staleness — published, never 
- [ ] `folio-assistant-qbfm` (normal, task) tools visualiser: 6 wireframe findings
- [ ] `folio-assistant-qdai` (normal, feature) repo-conversion: scan OUTSIDE the content tree for math (docs/, .lean/.py under docs/audits, .tex-only tables 
- [ ] `folio-assistant-r96p` (normal, task) LIBRARY: draft summaries for the withheld who-iris entries (0/121, 0/250)
- [ ] `folio-assistant-s0ki` (normal, task) uploads visualiser: 6 wireframe findings
- [ ] `folio-assistant-supn` (normal, task) HARNESS CARDS BECOME TODOS: outstanding work, a next-action recommendation from initialisation state, and heal
- [ ] `folio-assistant-tntp` (normal, feature) no-orphan-lean checks only that a .ts sibling exists; it should check each lean.ref lands in a Lake target CI 
- [ ] `folio-assistant-u9lb` (normal, task) TOC benchmark: score Nougat on the 13 outline PDFs (needs huggingface.co) (#2302)
- [ ] `folio-assistant-v49e` (normal, task) WORKFLOW VIEW: cat-harness folio shows where todos and beans sit in the BPMN/DMN, and where a process is break
- [ ] `folio-assistant-xp72` (normal, task) SCALE FIXTURE: a before/after large-document pair with a golden ChangeSet and a measured performance budget

Owner-decision (collect, ask in one batch, do not block on):
- [ ] `folio-assistant-6h47` RENDER STAGE 3: the dynamic-state export has a position but no filename — the owner left it open on purpose
- [ ] `folio-assistant-f327` DIFF RENDERER: structural diff for DAK artefacts — a decision-table row, data element, indicator or FHIR profi
- [ ] `folio-assistant-jg8s` DECIDED: a sheet is a grouping node IFF the source has sheets — model reality, do not force conformance

## Sessions

- Lane A: session_01JkK6uP3iU2etyMbrw7v3cu (folio-assistant, `claude/funny-keller-n85iva`)
- Lane B: session_01QmRtjQNyHiH2RuimTfuJDu (litlfred/cat-harness-tools)
- Lane C: session_018NFVUeJjQJdrEU32AS1Mco (litlfred/folio-assistant-core)
