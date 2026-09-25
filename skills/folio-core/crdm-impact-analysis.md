---
name: crdm-impact-analysis
roles: [reader, collaborator, owner]
description: >
  Guide for CRDM Phase 4 — Impact Analysis and Migration Planning.
  Performs systematic scans across schemas, pipeline scripts, adapters,
  active folios, agent skills, tests, and documentation to assess ripples,
  breaking changes, and data migration needs before code is written.
---

# CRDM Impact Analysis and Migration Planning

> Skill id: `crdm-impact-analysis` · Roles: `[reader, collaborator, owner]` · Phase: `Phase 4`

This skill guides the agent through **CRDM Phase 4 — Impact Analysis and Migration Planning**.
Before any implementation begins for an approved set of requirements (from [`crdm-requirements-template.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/crdm-requirements-template.md)),
the agent performs a thorough, multi-layered scan across the platform and all active folios to determine
what the changes affect, what could break, what must be migrated, and how to verify correctness.

The completed analysis is posted to the associated GitHub issue as part of the Phase 4/5 sign-off gate
defined in [`crdm-requirements-workflow.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/crdm-requirements-workflow.md).

---

## 1. When to Use This Skill

Activate this skill when:
- **Phase 3 requirements are complete**: Functional requirements (`REQ-001`, `REQ-002`, etc.) have been structured and agreed with the Business Analyst (BA).
- **Evaluating platform modifications**: A proposed feature alters files under [`schemas/`](file:///Users/litlfred/space_cats/folio-assistant/schemas), [`content/pipeline/`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline), [`adapters/`](file:///Users/litlfred/space_cats/folio-assistant/adapters), or [`src/`](file:///Users/litlfred/space_cats/folio-assistant/src).
- **Planning migrations**: Assessing whether existing folio content manifests or configuration files need codemods, schema version bumps, or manual edits.
- **Preparing the Phase 5 sign-off**: Producing the formal impact table and migration strategy for stakeholder review on the issue.

---

## 2. The Seven Impact Dimensions

The agent systematically assesses seven architectural dimensions before writing implementation code.

```
                    ┌─────────────────────────────────────────┐
                    │       CRDM Phase 4 Impact Scan          │
                    └────────────────────┬────────────────────┘
                                         │
     ┌───────────────┬───────────────────┼───────────────────┬───────────────┐
     ▼               ▼                   ▼                   ▼               ▼
1. Schemas      2. Pipeline         3. Adapters         4. Active        5. Skills &
& Types         & Validators        & Routing           Folios           Memory
     │                                                                       │
     └───────────────────────────────┬───────────────────────────────────────┘
                                     ▼
                    ┌─────────────────────────────────────────┐
                    │   6. Migration & Rollback Assessment    │
                    │   7. Tests & Documentation Planning     │
                    └─────────────────────────────────────────┘
```

### Dimension 1: Schema Impact (`schemas/*.ts`)

Scan [`schemas/`](file:///Users/litlfred/space_cats/folio-assistant/schemas) for affected types, builders, and validation constraints.

1. **Core AST and Types ([`schemas/types.ts`](file:///Users/litlfred/space_cats/folio-assistant/schemas/types.ts), [`schemas/assistant-types.ts`](file:///Users/litlfred/space_cats/folio-assistant/schemas/assistant-types.ts))**:
   - Are new block properties added? Are existing properties modified or renamed?
   - Is field optionality preserved? *(Warning: Changing an optional field to required breaks existing manifests!)*
   - Does Zod parsing use `.strip()`, `.passthrough()`, or `.strict()`? Ensure unknown fields are not unintentionally discarded.
2. **Block Kinds Registry ([`schemas/block-kinds.ts`](file:///Users/litlfred/space_cats/folio-assistant/schemas/block-kinds.ts))**:
   - Is a new block kind introduced?
   - If yes: Remember the architectural rule in [`AGENTS.md`](file:///Users/litlfred/space_cats/folio-assistant/AGENTS.md):
     - `MATH_BLOCK_KINDS` is explicit.
     - `DOCUMENT_BLOCK_KINDS` is its derived complement.
     - New kinds MUST be classified so `BLOCK_KINDS` remains total.
     - Check `adapterForKind` mapping — it must partition kinds unambiguously into disjoint namespaces (`paper`, `dak`, `document`).
3. **Constraint Matrix ([`schemas/constraints.ts`](file:///Users/litlfred/space_cats/folio-assistant/schemas/constraints.ts))**:
   - Does the change affect kind placement rules, nesting rules, or child block kinds?
   - Check if new constraints require updates to [`content/pipeline/profile-check.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/profile-check.ts).
4. **Builders ([`schemas/builders.ts`](file:///Users/litlfred/space_cats/folio-assistant/schemas/builders.ts))**:
   - Are factory functions (`makeBlock`, `prose`, etc.) updated?
   - Will the builder shim in folio repositories (`content/schema/builders.ts`) remain backward-compatible without an immediate submodule pull?
5. **Configuration ([`schemas/folio-config.ts`](file:///Users/litlfred/space_cats/folio-assistant/schemas/folio-config.ts))**:
   - Does `folio.config.json` gain new top-level or nested sections? Provide defaults so unmigrated folios continue to validate.

### Dimension 2: Pipeline Impact (`content/pipeline/*.ts`)

Scan [`content/pipeline/`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline) for affected validators, renderers, extractors, and graph tools.

1. **Validators**:
   - [`content/pipeline/validate.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/validate.ts): Does the primary schema and manifest validator run cleanly?
   - [`content/pipeline/profile-check.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/profile-check.ts): Are profile-specific rules (e.g. document forbidden from carrying Lean bindings) respected?
   - [`content/pipeline/validate-tex.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/validate-tex.ts) / [`content/pipeline/validate-references.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/validate-references.ts): Do reference integrity and LaTeX checks pass?
2. **Renderers**:
   - [`content/pipeline/render-markdown.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/render-markdown.ts): Does the Markdown assembly path format the new or updated blocks properly?
   - [`content/pipeline/render-latex.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/render-latex.ts) / [`content/pipeline/generate-main-tex.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/generate-main-tex.ts): If the change touches paper blocks, how does TeX generation handle them?
   - Document render rule: The document render path never invokes TeX. Verify the render pipeline does not introduce hidden TeX dependencies into document-only folios.
3. **Extractors, Generators & Codemods**:
   - [`content/pipeline/pot-extract.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/pot-extract.ts) / [`content/pipeline/po-inject.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/po-inject.ts): Are translatable strings extracted properly?
   - [`content/pipeline/gen-block-jsonld.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/gen-block-jsonld.ts) / [`content/pipeline/citations.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/citations.ts): Does metadata generation handle new block kinds?
   - [`content/pipeline/readme-sections.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/readme-sections.ts): Are generated README markers or sections affected?
4. **Content Graph & QA Suite**:
   - [`content/pipeline/content-graph.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/content-graph.ts): Does the dependency graph track new block relationships or edge kinds?
   - [`content/pipeline/qa-criteria-registry.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/qa-criteria-registry.ts) / [`content/pipeline/qa-sweep.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline/qa-sweep.ts): Do new QA criteria need registration? Will existing criteria fail unexpectedly?

### Dimension 3: Adapter Impact (`adapters/`)

Scan [`adapters/`](file:///Users/litlfred/space_cats/folio-assistant/adapters) and adapter skills for routing and inheritance changes.

1. **Inheritance Cascade**:
   - `PaperContentAdapter` extends `DocumentContentAdapter`.
   - **Critical Rule**: Any change to [`adapters/document/`](file:///Users/litlfred/space_cats/folio-assistant/adapters/document) directly cascades into [`adapters/paper/`](file:///Users/litlfred/space_cats/folio-assistant/adapters/paper). Verify that paper-specific workflows (Lean verification, LaTeX builds) are not disrupted by document adapter modifications.
2. **Block-Kind Routing**:
   - Inspect [`adapters/document/resolver.ts`](file:///Users/litlfred/space_cats/folio-assistant/adapters/document/resolver.ts) and tool registrations in [`adapters/document/tools/`](file:///Users/litlfred/space_cats/folio-assistant/adapters/document/tools/).
   - Ensure every block kind resolves cleanly to its expected handler without fallback collisions.
3. **Adapter vs Profile Scoping**:
   - If the feature introduces a new content variant, verify whether it needs an **Adapter** (new distinct code, disjoint block kinds, separate MCP tools) or a **Profile** (shared adapter code, different constraint rules checked by `profile-check.ts`). Do not conflate adapters and profiles.

### Dimension 4: Active Folio Impact

Assess how active downstream folios that consume this platform will be affected:

1. **Active Folio Types**:
   - **Paper Folios** (e.g., Quantum Observable Universe — `qou`): Rely on Lean 4 theorem proving, LaTeX rendering, and mathematical AST blocks.
   - **Document Folios** (e.g., policy documents, standards, clinical guidelines): Rely on pandoc/HTML rendering, normative prose blocks, and metadata schemas.
   - **DAK / WHO SMART Folios** (e.g., digital adaptation kits): Rely on decision tables, FHIR/DAK blocks, and spreadsheet ingestion.
   - **Folio Scaffold** ([`scripts/init-folio.ts`](file:///Users/litlfred/space_cats/folio-assistant/scripts/init-folio.ts)): Used to initialize new repositories. Does the template output still match platform expectations?
2. **Breakage & Incompatibility Assessment**:
   - Will running `content_validate` in existing folios suddenly report errors?
   - Will existing `folio.config.json` files be rejected?
   - Do existing block manifests (`content/**/*.json` or `.md`) need codemods?
   - How is the platform linked in each folio (git submodule vs sibling repo)? If submodules are used, will updating the pointer break the folio build?

### Dimension 5: Skill & Agent Memory Impact

Scan agent skills and persistent memory to prevent stale agent behavior:

1. **Skill File References ([`skills/`](file:///Users/litlfred/space_cats/folio-assistant/skills))**:
   - Grep across [`skills/folio-core/`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core), [`skills/folio-document-adapter/`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-document-adapter), [`skills/folio-paper-adapter/`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-paper-adapter), and [`skills/content-lifecycle/`](file:///Users/litlfred/space_cats/folio-assistant/skills/content-lifecycle) for modified file names, tool names, or schema names.
   - Update skill instructions if command-line arguments, tool invocations, or data formats have changed.
2. **Subagent Memory ([`.claude/agents/`](file:///Users/litlfred/space_cats/folio-assistant/`/.claude/agents), [`.claude/agent-memory/`](file:///Users/litlfred/space_cats/folio-assistant/`/.claude/agent-memory))**:
   - Check if any `STABLE` paths or `TRAP` entries in `platform-boundary-guard`, `ci-health-watcher`, or `content-pipeline-navigator` are affected.
   - If a trap was discovered or a rule revised during this feature design, record it in the corresponding `MEMORY.md`.

### Dimension 6: Migration & Rollback Assessment

Determine what data migration is necessary before changes are merged:

1. **Migration Classification**:
   - **None (Purely Additive)**: Optional fields or new standalone tools that do not affect existing files.
   - **Automated Codemod Required**: Changes to existing block structure or manifest syntax. Must provide a runnable codemod in [`content/pipeline/codemod-*.ts`](file:///Users/litlfred/space_cats/folio-assistant/content/pipeline).
   - **Manual Folio Configuration Update**: Changes to `folio.config.json` that require author input.
2. **Schema Versioning**:
   - Does [`schemas/package.json`](file:///Users/litlfred/space_cats/folio-assistant/schemas/package.json) need a semver bump?
   - Breaking changes to schema exports require a major/minor bump.
3. **Rollback Strategy**:
   - If an updated folio fails in CI, can it roll back cleanly by pinning the prior platform commit or submodule SHA?
   - Are changes forward- and backward-compatible during the rollout window?

### Dimension 7: Test & Documentation Impact

Identify the test updates and documentation edits needed to accompany the change:

1. **Test Suite ([`scripts/tests/`](file:///Users/litlfred/space_cats/folio-assistant/scripts/tests), [`schemas/*.test.ts`](file:///Users/litlfred/space_cats/folio-assistant/schemas))**:
   - Which unit tests in `scripts/tests/` or inline `*.test.ts` files must be updated?
   - What new test cases must be added (happy path, edge cases, error conditions)?
   - Are Playwright E2E tests (`bunx playwright test`) or CI workflows affected?
2. **Documentation Pages ([`content/docs/`](file:///Users/litlfred/space_cats/folio-assistant/content/docs), [`docs/`](file:///Users/litlfred/space_cats/folio-assistant/docs))**:
   - List every documentation page under `content/docs/` that must reflect the new capability.
   - Check Jekyll navigation in [`docs/_config.yml`](file:///Users/litlfred/space_cats/folio-assistant/docs/_config.yml) or [`docs/_data/`](file:///Users/litlfred/space_cats/folio-assistant/docs/_data).
   - If process flows change, update the corresponding BPMN diagrams in [`docs/workflows/*.bpmn`](file:///Users/litlfred/space_cats/folio-assistant/docs/workflows) and re-render SVGs into [`docs/assets/img/workflows/`](file:///Users/litlfred/space_cats/folio-assistant/docs/assets/img/workflows).

---

## 3. Automated Scanning Commands

Run these shell probes to quickly identify affected files and references across the codebase:

```bash
# 1. Search for references to a schema type or field
rg "targetTypeName" schemas/ content/pipeline/ adapters/

# 2. Check which pipeline scripts import a specific schema
rg "from '\.\./\.\./schemas/.*'" content/pipeline/

# 3. Check which skills reference a tool or script name
rg "script-name\.ts" skills/

# 4. Check for block kind usage across the platform
rg "'my_block_kind'" schemas/ content/pipeline/ adapters/

# 5. Run tests to establish baseline
bun test

# 6. Verify environment and CI health
bun run check:ci-health
```

---

## 4. Structured Output Format for GitHub Issues

When Phase 4 analysis is complete, post the findings to the parent GitHub issue using this standard markdown template:

```markdown
## CRDM Phase 4: Impact Analysis & Migration Plan

### Executive Summary
- **Overall Impact Level**: [Low | Medium | High | Breaking]
- **Migration Required**: [No | Yes - Automated Codemod | Yes - Manual]
- **Target Release / Branch**: `feature/<slug>`

---

### Detailed Impact Matrix

| Dimension | Affected File(s) / Component | Nature of Change | Breaking? | Required Mitigation / Follow-up |
|---|---|---|:---:|---|
| **Schemas** | `schemas/block-kinds.ts`<br>`schemas/types.ts` | Add new block kind `X`; declare Zod schema | No | Update `adapterForKind` and matrix in `constraints.ts` |
| **Pipeline** | `content/pipeline/render-markdown.ts`<br>`content/pipeline/validate.ts` | Add Markdown serializer branch; update validator | No | Ensure null/undefined handling for legacy blocks |
| **Adapters** | `adapters/document/resolver.ts` | Register resolver routing for block kind `X` | No | Verify no collision with `paper` adapter |
| **Active Folios** | `litlfred/qou` (paper)<br>`who-guideline` (doc) | Document folios can use kind `X`; paper folios inherit | No | Backward-compatible; existing manifests untouched |
| **Skills** | `skills/folio-core/md-authoring.md` | Document authoring guidelines for kind `X` | No | Update skill examples and allowed block kinds |
| **Tests** | `scripts/tests/block-kinds.test.ts` | Add unit tests for kind `X` validation & rendering | No | Add positive and negative test cases |
| **Docs & BPMN** | `content/docs/content-types/` | Add reference documentation for kind `X` | No | Update documentation site and navigation |

---

### Downstream Folio Assessment

| Folio / Repository | Content Profile | Current Status | Impact & Action Required |
|---|---|---|---|
| **Platform Scaffold** (`scripts/init-folio.ts`) | Generic | Direct | Update initial manifest template to reference new builder |
| **Document Folios** | `document` | Consumer | Fully compatible; can immediately adopt feature |
| **Paper Folios** | `paper` | Consumer | Fully compatible via `PaperContentAdapter` inheritance |

---

### Migration & Rollback Strategy

- **Data Migration**: [State whether existing manifests require modification. If yes, link to codemod script.]
- **Schema Version Bump**: [Specify version change, e.g. `schemas/package.json` v1.4.0 -> v1.5.0]
- **Rollback Plan**: In the event of regression, revert the feature PR on `main`. Downstream folios remain pinned to their existing submodule SHA until verified.

---

### Verification Checklist

- [ ] Unit tests pass: `bun test`
- [ ] Schema validation succeeds across sample folios: `bun run test:e2e` (or `content_validate`)
- [ ] Profile checks enforce constraints: `scripts/tests/profile-check.test.ts`
- [ ] Documentation updated under `content/docs/`
```

---

## 5. Phase 4 Execution Checklist for the Agent

When executing this skill:

1. [ ] **Retrieve Requirements**: Read the finalized requirement list from [`crdm-requirements-template.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/crdm-requirements-template.md) on the GitHub issue.
2. [ ] **Execute Dimension Scans**: Review each of the seven dimensions (Schemas, Pipeline, Adapters, Folios, Skills, Migration, Tests/Docs).
3. [ ] **Verify Invariants**:
   - Check `PaperContentAdapter` inheritance integrity.
   - Verify `adapterForKind` partitions block kinds cleanly.
   - Confirm document render path remains free of TeX dependencies.
4. [ ] **Formulate Migration Plan**: If data changes, specify the automated codemod or migration steps.
5. [ ] **Post Output to Issue**: Format the results using the structured Markdown template and post to the GitHub issue.
6. [ ] **Notify BA**: Inform the BA that Phase 4 impact analysis is complete and ready for Phase 5 sign-off.

---

## Cross-References

- [`crdm-requirements-workflow.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/crdm-requirements-workflow.md) — The parent six-phase CRDM process
- [`crdm-requirements-template.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/crdm-requirements-template.md) — Phase 3 requirements definition guide and schema
- [`crdm-detect.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/crdm-detect.md) — CRDM trigger and capability detection
- [`todo-manager.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/todo-manager.md) — Phase 5 bean creation and check-before-create protocol
- [`staging-review.md`](file:///Users/litlfred/space_cats/folio-assistant/skills/folio-core/staging-review.md) — Phase 6 before/after comparison staging review
- [`AGENTS.md`](file:///Users/litlfred/space_cats/folio-assistant/AGENTS.md) — Platform rules, adapter vs profile boundaries, and bean reporting
