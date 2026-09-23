---
# folio-assistant-iwtn
title: 'BOOTSTRAP SELF-DEFINITIONAL: ~130 mentions of harnesses above bootstrap across 16 files (bpmn, skills, bootstrap.json)'
status: in-progress
type: task
priority: normal
created_at: 2026-09-23T19:19:45Z
updated_at: 2026-09-23T19:44:11Z
parent: folio-assistant-88mg
---

Owner, 2026-09-23: *"bootstrap = self definitional. no semantic leakage, no graph leakage."* The README, AGENTS.md and the new `schemas/graph.schema.json` now comply (pv51, with a test in `bootstrap-tools/schemas/graph.test.ts`). The rest of `bootstrap/` does not.

**Measured 2026-09-23:** mentions of WHO, DAK, smart-guidelines, smart-base, cat-harness, folio or f-a-sci, or a `../` path, per file:

| file | count |
|---|---|
| bootstrap.json (mostly `_comment` fields) | 32 |
| processes/initialize-harness.bpmn | 24 |
| processes/discussion.bpmn | 13 |
| scenarios/roles.json | 9 |
| skills/bootstrap-graph-emission.md | 8 |
| skills/discussion.md | 7 |
| processes/log-message.bpmn | 7 |
| schemas/discussion.output.schema.json (generated, from its Zod) | 6 |
| skills/confirm-harness.md, skills/bootstrap-kg-navigation.md | 4 each |
| skills/root-readme.md, log-message.md, bootstrap-graph-publication.md, discussion.input.schema.json | 3 each |

About 130 in all. Each is either an example naming a Harness above bootstrap (replace it with `<name>`), a link or path above bootstrap (remove it), or design history (move it to the bean it came from).

## Done when
- [ ] no file in `bootstrap/` names anything above it, except the published `$id` host
- [x] the leak test in `bootstrap-tools/schemas/graph.test.ts` covers every file in `bootstrap/`, not only the README. The allowed names are stated in it, and the structural ones are pinned in a PENDING list, so none can grow unnoticed. It was checked by adding a leak, which failed the test.
- [x] the `.pot` translation templates are re-extracted after the `.bpmn` edits (`translate-bpmn --instance ./bootstrap --extract`)

## Round 1 — 2026-09-23 (session_017nyJj3PsjvszpF3DyGeBgE)

**Fixed (prose):**
- `confirm-harness`, `discussion` and `bootstrap-kg-navigation` gave harness names as examples. They now say `<owner>/<repo>` or "any Harness built on bootstrap".
- `bootstrap-graph-emission` and `bootstrap-graph-publication` were mostly the change history of cat-harness scripts, tests and beans. They are rewritten to their contract only: what the file holds, its four properties, one address that equals its `@id`, and why it is not committed. The old text is recoverable from git (`eebeb2a8`), and each fact it cited lives in its bean (`n350`, `dyd3`, `blv9`, `hwzu`).
- In the three `.bpmn` diagrams, three documentation strings named harnesses.
- In `roles.json`, two Role descriptions and both comments. "CatBootstrap's three roles" was also wrong: there are four.
- In `bootstrap.json`, the Subgraph descriptions, the render-exemption reason and what it owes, and the sticky comment.
- In the two discussion schemas, fixed in their Zod source and regenerated.
- A broken link: `log-message.md` pointed at `../workflows/`, which does not exist. It now points at `../processes/`.

**Waiting on the owner (structural; pinned in the test's PENDING list):**
1. **The `folio:` BPMN extension prefix** (`folio:skill`, `folio:precondition`, `folio:role`), and the `folio-*/v1` schema identifiers in `models.json` and `glossary-ledger.json`. Renaming means changing the platform's parser and every diagram in every Harness.
2. **bootstrap's skills Subgraph has the id `cat-harness`.** Subgraph overrides match on id, and the platform's default Subgraph for skills uses that id. Renaming it, to `skills` say, has to change the platform's default at the same time, or the directory resolves twice.
3. **`renderExemption.reachableAt` points into `cat-harness/docs/`**: where a person is sent to read about bootstrap. Either bootstrap gets a page of its own, or the pointer stays.
4. **`schemas/model-registry.ts`** is TypeScript inside bootstrap, which breaks FR-7 (no program code). Move it to `bootstrap-tools`, or reword FR-7.

## Round 2, 2026-09-23: ruling 1 answered

#1177 merged (c33dd611). **Ruling 1 (the `folio:` prefix and the `folio-*/v1` ids):** the owner answered that the prefix is the Subgraph that declares the asset, and a nested Subgraph joins its path with dots (`bootstrap.processes:`). The work is staged in bean `12s9`. Rulings 2 to 4 are still open.

**Ruling 2 (the Skills Subgraph id):** the owner answered *"bootstrap is bootstrap, bootstrap/skills is bootstrap.skills … do all the needed renames and fix paths"*. Both declarations (bootstrap's and cat-harness's) and `DEFAULT_DIRECTORIES` now use the id `skills`. Its qualified name is `<harness>.skills`. `RENAMED_DIRECTORY_IDS` reads the old id `cat-harness` as `skills` in both resolvers, so a folio declaration in another repository keeps overriding the entry it meant; a test covers this. The PENDING entry is removed. Rulings 3 (`renderExemption.reachableAt`) and 4 (`model-registry.ts` against FR-7) are still open.

**Ruling 3 (`renderExemption.reachableAt`):** the owner answered *"see previous answer"*, which is ruling 2's "bootstrap is bootstrap … fix paths". `reachableAt` is now `README.md`, relative to the instance, and `harness-tiles` refuses a path outside the instance. The site build publishes bootstrap's own files at `<base>/bootstrap/` with `publish-instance-files.ts`, which renders each `.md` as `.html` and never overwrites the graph's `bootstrap.json` copy. The tab links to `/bootstrap/README.html`. The owner also approved `remark-gfm` so its tables render (fz39 completed). The PENDING entry is removed. Ruling 4 (`model-registry.ts` against FR-7) is still open.

**Initiator → Bootstrapping Agent** (owner, 2026-09-23, asked "what about 'boot strapping agents'" and chose the rename). The Role's name, its id (`bootstrapping-agent`), the diagram lanes (`Lane_BootstrappingAgent`) and the precondition `told-it-is-a-bootstrapping-agent` are renamed in bootstrap, bootstrap-tools and the platform code and tests that name them. The glossary ledger retires `role/initiator` on 2026-09-23 rather than rewriting it. History in beans and retired files is unchanged.

**Ruling 4 (`model-registry.ts` against FR-7):** the owner answered *"cat-harness/tools like renderer. zod is in cat-harness"*. The Zod source now lives in `cat-harness/schemas/model-registry.ts`, beside `check-model-languages`, which reads it. bootstrap keeps the data (`models/models.json`) and a generated `schemas/model-registry.schema.json`. A new test enforces FR-7: no file in `bootstrap/` is a program. The PENDING list is now **empty**, so all four rulings are applied, and ruling 1's rename is staged in bean `12s9`.
