---
# folio-assistant-dep1
title: 'Phase 0.1 — let a dependency contribute block kinds, an adapter and MCP tools (#223)'
status: completed
type: task
priority: high
created_at: 2026-09-18T15:00:27Z
updated_at: 2026-09-18T15:00:27Z
---

**BLOCKER for the whole five-repo split.** See
[migration plan §0.1](../../../cat-harness/docs/architecture/migration-plan.md).

`dependencies.folioAssistant` resolves translations only. Measured 2026-09-18:
`resolveSkillDirs` 0 external callers, `resolveTranslationDirs` 0,
`resolveContentDirs` does not exist, and schemas + MCP tools are ruled out
**by design** (`schemas/folio-config.ts` docstring).

`folio-asst-sci` exists to own `MATH_BLOCK_KINDS` (schemas), `PaperContentAdapter`
(code) and `lean_build` (MCP tool). It is unbuildable until this changes.

Needs a maintainer decision between three shapes: load-time registration /
manifest-declared contributions / adapters stay root-only. Gate: a synthetic
two-repo fixture where the dependency contributes one block kind, one skill and
one MCP tool, with a test asserting a kind collision is **refused**, not
silently overlaid (`adapterForKind` must stay total and unambiguous).

---

## Outcome — load-time registration (maintainer's call, 2026-09-18)

`schemas/contributions.ts` (registry) + `loadContributions()` in
`schemas/folio-config.ts` (walks the dependency tree, imports each
`contributes` module, registers). A dependency declares:

```jsonc
{ "contributes": "./contributions.ts" }
```

**Gate met** — `schemas/contributions.test.ts`, 13 tests: a synthetic two-repo
fixture where the dependency contributes one block kind, one adapter and one
MCP tool and the root resolves all three, plus a kind collision **refused**.

### The shape's cost, and the mitigations inside it

Load-time registration makes load ORDER semantically significant. That is
accepted. What is not accepted is order deciding collisions:

- **A kind claimed by two contributors throws**, naming both. Last-writer-wins
  would make `adapterForKind` ambiguous *and* make the ambiguity depend on
  listing order.
- **A dependency may not redefine a platform kind or adapter.** Shadowing
  `theorem` from a config two repos away would change what every existing folio
  validates against.
- **A diamond is not a collision.** `base -> kg -> core` and `sci -> core` means
  a depth-first walk reaches `core` twice; identical re-registration from the
  same contributor is a no-op. Without this every realistic tree throws a false
  collision, and the obvious fix (dropping the check) is the wrong one.
- **The dependency entry's name wins** over what the module calls itself — a
  self-renaming contributor could claim another's namespace and turn a
  collision into a silent merge.
- **A declared-but-missing module is a hard error** — the `AGENTS.md` "wiring
  without script" failure mode, caught where it happens.

### Placement

`schemas/` (core), not `src/core/` (harness). Putting it under `src/` would
have added another harness->core import, already the largest wrong-direction
group at 20 edges. **Verified: `check:partition` reports 45 edges before and
after.** MCP tools are carried as opaque registrar callbacks so the MCP SDK
type never reaches the content model.

### Still open (finishing work, not design; does not block Phase I)

`resolveSkillDirs` still has no caller and there is no content-directory
resolver. The `folio-config.ts` docstring table now distinguishes wired (OK),
written-but-uncalled, and absent, instead of claiming both work.

Gate at close: `tsc` 0 errors, `eslint` clean, `bun test` 1485 pass / 0 fail.
