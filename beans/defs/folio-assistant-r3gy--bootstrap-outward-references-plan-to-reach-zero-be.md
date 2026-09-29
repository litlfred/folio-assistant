---
# folio-assistant-r3gy
title: 'BOOTSTRAP OUTWARD REFERENCES: plan to reach zero before the repo split'
status: todo
type: task
created_at: 2026-09-29T18:18:26Z
updated_at: 2026-09-29T18:18:26Z
parent: folio-assistant-vke6
---

## Why

`bootstrap/` is the floor (`needs: []`) and is meant to become `litlfred/bootstrap`. An analysis on 2026-09-29 (artifact https://claude.ai/artifact/92M8FmwCJeHUvs6NXutsar, §3) listed 22 places where bootstrap's own files point outside bootstrap or at folio-assistant. Each one dangles once the directory is its own repository. This bean is the plan to remove them, grouped by how each group gets fixed. Sibling `zhg2` measures reference direction across all instances; this bean is the bootstrap-only work to reach zero.

## Groups, in order

### A. Stale text inside bootstrap (content only, no decision)
- [ ] `bootstrap.json:2,37` says `workflows/`; the directory is `processes/`
- [ ] `bootstrap.json:24` says "ONE entry"; 7 are declared
- [ ] `skills/discussion.md:83` says the schemas sit in `bootstrap/skills/`; they are in `schemas/`
- [ ] `processes/log-message.bpmn:14-18` says "the second and last diagram"; `discussion.bpmn` is a third
- [ ] "CAT_BOOTSTRAP" / "cat-bootstrap" in 3 BPMN files → "bootstrap"
- [ ] `initialize-harness.bpmn:83` says `kg-navigation`; bootstrap's skill is `bootstrap-kg-navigation`
- [ ] README "every file here" table: add `models.json`, `model-registry.schema.json`, `requirement.schema.json`, `glossary-ledger.json`, `test/results/`

### B. Upward names in bootstrap prose (content only, no decision)
Rule: bootstrap may name a ROLE the Harness plays ("the Harness's README tool"), never a specific artefact of the layer above.
- [ ] bean ids `lv3j`, `ug4r` (BPMN comments), `dh4f`, `2krx` (`bootstrap.json:115,122`)
- [ ] `readme_sync`, `content-context-and-state-graphs` (`initialize-harness.bpmn:119,121`, `skills/root-readme.md:35,52,66`)
- [ ] "data-modelling, step 8" (`skills/log-message.md:19`)
- [ ] `models/models.json:3`: `skills/communication-language.md` (does not exist in bootstrap) and `check:model-languages`

### C. Repository-root-relative paths (needs a code change in cat-harness)
- [ ] `initialize-harness.bpmn:26` precondition `ref="bootstrap/README.md"` is resolved from the repository root. Make `file-exists` resolve against the INSTANCE root (`src/workflow/process-model.ts`), change the ref to `README.md`, and update `precondition.test.ts:81-102`.
- [ ] Prose `bootstrap/README.md` references (`initialize-harness.bpmn:14`, `discussion.bpmn:20`, `scenarios/roles.json:8`, `skills/discussion.md:3`) → `README.md`

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
