---
# folio-assistant-sepc
title: 'Separation of concerns — current/future architecture + migration plan (issue #223)'
status: in-progress
type: task
priority: normal
created_at: 2026-09-18T14:25:00Z
updated_at: 2026-09-18T14:25:00Z
---

Issue [#223](https://github.com/litlfred/folio-assistant/issues/223) asks for two
artefacts, both documentation: **document the current and future state software
architecture**, and **develop a change migration plan**.

Branch: `claude/sleepy-babbage-ls90iz`.

## What the issue asks for

1. A repo **taxonomy** — Tool, Test, Content and Consumer repos, and what each
   may contain.
2. The **future-state split** into five folio-assistant instances:
   `agentic-harness`, `folio-assist-core`, `smart-kg`, `smart-base`,
   `folio-asst-sci`.
3. **Phase I / II / III** migration.
4. (comment) rename top-level `content/` to `folio/`; make `folio` its own
   schema holding zero or more Content instances; LHS navbar section per node.

## Measured before writing (2026-09-18, `369d89e`)

- The dependency mechanism the split needs already exists —
  `dependencies.folioAssistant` in `folio.config.json`, walked depth-first
  (`schemas/folio-config.ts:239` `resolveDependencyTree`).
- **It is almost entirely unwired.** `resolveSkillDirs` and
  `resolveTranslationDirs` have **0** external callers; the only non-test
  consumer of the module is `content/pipeline/po-resolve.ts`.
- The module docstring claims content blocks resolve across dependencies (✅).
  **There is no `resolveContentDirs` function.**
- Schemas and MCP tools are documented as never resolved from a dependency —
  which is exactly what `folio-asst-sci` and `smart-base` need to contribute.
- `content/` is 431 files / 46,401 code lines and is *pipeline*, not content.
  The `content/` → `folio/` rename touches **2,408** literal occurrences across
  **429** files.

## Scope

Documentation only. The `content/` → `folio/` rename, the `folio` schema and the
navbar work are Phase I **code** and are deliberately left for a separate bean
so the plan can be reviewed before 2.4k references move.
