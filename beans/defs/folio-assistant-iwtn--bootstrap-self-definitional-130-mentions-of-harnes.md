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
