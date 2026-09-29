---
# folio-assistant-r3gy
title: 'BOOTSTRAP OUTWARD REFERENCES: plan to reach zero before the repo split'
status: in-progress
type: task
priority: normal
created_at: 2026-09-29T18:18:26Z
updated_at: 2026-09-29T19:14:25Z
parent: folio-assistant-vke6
---

## Why

`bootstrap/` is the floor (`needs: []`) and is meant to become `litlfred/bootstrap`. An analysis on 2026-09-29 (artifact https://claude.ai/artifact/92M8FmwCJeHUvs6NXutsar, §3) listed 22 places where bootstrap's own files point outside bootstrap or at folio-assistant. Each one dangles once the directory is its own repository. This bean is the plan to remove them, grouped by how each group gets fixed. Sibling `zhg2` measures reference direction across all instances; this bean is the bootstrap-only work to reach zero.

## Groups, in order

### A. Stale text inside bootstrap (content only, no decision)
- [x] `bootstrap.json:2,37` says `workflows/`; the directory is `processes/`
- [x] `bootstrap.json:24` says "ONE entry"; 7 are declared
- [x] `skills/discussion.md:83` says the schemas sit in `bootstrap/skills/`; they are in `schemas/`
- [x] ~~`processes/log-message.bpmn:14-18` says "the second and last diagram"~~ — a false report from the analysis: the phrase is not in the file. Nothing to change.
- [x] "CAT_BOOTSTRAP" / "cat-bootstrap" in 3 BPMN files → "bootstrap"
- [x] `initialize-harness.bpmn:83` says `kg-navigation`; bootstrap's skill is `bootstrap-kg-navigation`
- [x] README "every file here" table: add `models.json`, `model-registry.schema.json`, `requirement.schema.json`, `glossary-ledger.json`, `test/results/`

### B. Upward names in bootstrap prose (content only, no decision)
Rule: bootstrap may name a ROLE the Harness plays ("the Harness's README tool"), never a specific artefact of the layer above.
- [x] bean ids `lv3j`, `ug4r` (BPMN comments), `dh4f`, `2krx` (`bootstrap.json:115,122`)
- [x] `readme_sync`, `content-context-and-state-graphs` (`initialize-harness.bpmn:119,121`, `skills/root-readme.md:35,52,66`)
- [x] "data-modelling, step 8" (`skills/log-message.md:19`)
- [x] `models/models.json:3`: `skills/communication-language.md` (does not exist in bootstrap) and `check:model-languages`

### C. Repository-root-relative paths (needs a code change in cat-harness)
- [x] `initialize-harness.bpmn:26` precondition `ref="bootstrap/README.md"` is resolved from the repository root. Make `file-exists` resolve against the INSTANCE root (`src/workflow/process-model.ts`), change the ref to `README.md`, and update `precondition.test.ts:81-102`.
- [x] Prose `bootstrap/README.md` references (`initialize-harness.bpmn:14`, `discussion.bpmn:20`, `scenarios/roles.json:8`, `skills/discussion.md:3`) → `README.md`

### D. Vocabulary bootstrap uses but does not define (design)
- [ ] The 7 graph kinds (`skills`, `schemas`, `scenarios`, `processes`, `models`, `swimlane-glossary`, `qa`) are defined only in `cat-harness/schemas/graph-kind-registry.ts`. `graph.schema.json` should enumerate the kinds bootstrap itself uses (generated, so the Zod source gains the list).
- [ ] `$schema` ids `folio-glossary-ledger/v1` and `folio-model-registry/v1`: bootstrap already ships `model-registry.schema.json`; add the ledger's schema beside it, so every `$schema` a bootstrap file carries resolves inside bootstrap.
- [ ] `theme: "bootstrap"` (`bootstrap.json:30`) is defined in `themes.ts:182`. Treat it as a rendering hint that a harness MAY honour and falls back from, and say so in `graph.schema.json`.
- [ ] `kg-qa/v1` and `kg-qa-manifest/v1` in `test/results/`: these are harness OUTPUT about bootstrap. Depends on decision 2 below.

### E. Published addresses (decision 1)
- [ ] `$id` of all 5 schemas, `processes/ns.jsonld`, BPMN `xmlns:bootstrap.processes` and `targetNamespace`, and the owed `bootstrap.jsonld` are under `https://litlfred.github.io/folio-assistant/bootstrap/`. 71 BPMN files outside bootstrap bind the namespace.
- [ ] `bootstrap.json:36,41` link to `github.com/litlfred/folio-assistant/tree/main/bootstrap`. Repoint to `github.com/litlfred/bootstrap` at the moment that repository is seeded, not before, or the link is broken in between.

### F. Auditor prose in generated sidecars
- [ ] `test/results/kg-qa/scenarios/kg.kg-qa.json` describes `.claude/skills/actors/`, `permissions.json`, `repoRootFor`. The fix is in `kg-audit.ts`'s messages for `repo`-scoped criteria (already recorded n/a for an instance run), not in the sidecar. Moot if decision 2 moves the sidecars out.

## Decisions for the owner
1. **Address base for bootstrap's IRIs** (group E): keep `litlfred.github.io/folio-assistant/bootstrap/` permanently (no consumer changes; folio-assistant's site keeps publishing them), or move to a base owned by the new repo (every one of the 71 bindings changes once).
2. **Where bootstrap's QA sidecars live** (groups D, F): stay in `bootstrap/test/results/` (bootstrap then carries harness output and needs a cross-repo refresh), or move to `cat-harness/test/results/bootstrap/` like the `.pot` templates in #1448 (bootstrap stays authored-only).

## Done when
`graph.test.ts`'s `ALLOW` list needs only the entries decision 1 keeps, and `check:reference-direction --findings` reports no edge from a file under `bootstrap/` to any instance above it.


## Decision 1 — settled by the owner, 2026-09-29

Owner chose option 2: **bootstrap's IRIs move to a base the new bootstrap repository owns** (not `litlfred.github.io/folio-assistant/bootstrap/`). All 71 external `xmlns:bootstrap.processes` bindings change once. Group E proceeds on that basis. Decision 2 (where the kg-qa sidecars live) remains open; group D design dispatched to an agent.

Groups A and B authorised to start (owner: "Do A B").

## Groups A and B — done (2026-09-29)

- A: `bootstrap.json` `_comment` rewritten for 7 directories and 3 processes; "ONE entry" and the `workflows/` note fixed; `discussion.md` points at `schemas/`; `CAT_BOOTSTRAP` / `CatBootstrap` / `cat-bootstrap` → bootstrap; `kg-navigation` → `bootstrap-kg-navigation`; README file table gains 5 rows.
- A, beyond the list: `bootstrap.json:2` also said "two directories" and "TWO processes", and named cat-harness as the layer composed on top. All three corrected.
- B: bean ids `lv3j`, `ug4r`, `dh4f`, `2krx`, `46uh` removed; `readme_sync` → "the harness's own README tool"; `content-context-and-state-graphs` → "its own skill on context and state"; "data-modelling, step 8" dropped; `models.json` no longer names `check:model-languages` or `skills/communication-language.md`; `skill_fetch` and `beans` → "skill-fetching tool", "work-plan store".
- Regenerated with their own tools, not by hand: 15 `.pot` templates (`translate-bpmn.ts --instance ./bootstrap --extract`) and 7 bootstrap kg-qa sidecars (`kg:audit:all`; only `source_hash` changed, no verdict).
- Still present by design: `kg-audit.ts`-era wording is gone, but `bootstrap.json`'s `qa` description still describes the auditor generically; that directory is decision 2.

## Group C — done (2026-09-29)

- `file-exists` preconditions now resolve against the INSTANCE that owns the diagram, found at parse time with `findInstanceRoot` (the lookup `checkCodeLists` already used) and carried on the check as `base`. `evaluatePrecondition`, `evaluatePreconditions` and `preflight` no longer take a root, so no caller can resolve against a different directory.
- Parse now refuses: a ref that is absolute or has a `..` segment, and a file check on a diagram no instance declaration owns.
- `initialize-harness.bpmn`: `ref="bootstrap/README.md"` -> `ref="README.md"`. Four prose mentions -> "bootstrap's README.md". `processes/ns.jsonld` now says what `ref` is relative to.
- Sabotage: resolving against the working directory fails 3 tests; dropping the `..` guard fails 1; dropping the no-owner guard fails 1.
- The GitHub link at `bootstrap.json:41` is group E and stays for now.
