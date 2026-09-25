# folio-assistant Schema Documentation

Type definitions and validation schemas for the folio-assistant content-object
model. Content-agnostic: nothing here is specific to a particular paper.

## Content-Object Model

The core document model, organized as atomic knowledge units:

- **[types.ts](./types.ts)** — TypeScript types: `Block`, `Chapter`, `Paper`, `Section`, etc.
- **[constraints.ts](./constraints.ts)** — Zod runtime schemas + constraint rules
- **[builders.ts](./builders.ts)** — Validated constructor functions (`definition()`, `theorem()`, etc.)

## The harness graphs — what an instance is, and who works in it

Not content. These describe the **instance** and the people and processes
around it, and they are read by tools rather than rendered.

- **[cat-harness.ts](./cat-harness.ts)** — the repository's declaration
  declaration: which directories an instance scans and what **kind of graph**
  each holds (`tools`, `kg`, `schemas`, `beans`, and `folio`, which core
  registers because only core can render).
- **[bean-graph.ts](./bean-graph.ts)** — what `beans/` is: a graph with named
  nodes (`defs` for work items, `workflows` for running BPMN state), declared by
  `beans/beans.json` so the whole store relocates by moving one folder.
- **[role-graph.ts](./role-graph.ts)** — **Actor, Role, Skill.** *An actor
  performs a task in a process as a role, using that role's skills.* A role **is
  a BPMN swimlane**; `inherits` is a static IS-A closure and the subprocess stack
  is a scoped union along a call path, and the two are deliberately not merged.
  Declared in `scenarios/roles.json`.
- **[kg-qa.ts](./kg-qa.ts)** — the QA sidecar for that graph: 14 criteria, one
  per join, written to `kg-qa/` beside each audited node by
  `scripts/kg-audit.ts`. The third QA subject kind, after blocks and scripts.

## CI/Output Schemas

Types consumed by CI pipelines and published to GitHub Pages:

- **[formalization-types.ts](./formalization-types.ts)** — Proof objects, glossary, coverage, test infrastructure

## Block Kinds

| Kind | Label prefix | Lean required? | Builder |
|------|-------------|----------------|---------|
| `definition` | `def:` | **Yes** | `definition()` |
| `theorem` | `thm:` | Expected | `theorem()` |
| `lemma` | `lem:` | Expected | `lemma()` |
| `proposition` | `prop:` | Expected | `proposition()` |
| `corollary` | `cor:` | Expected | `corollary()` |
| `conjecture` | `conj:` | Optional | `conjecture()` |
| `example` | `ex:` | Optional | `example()` |
| `remark` | `rem:` | Optional | `remark()` |
| `proof` | `prf:` | Optional | `proof()` |
| `prose` | — | N/A | `prose()` |
| `equation` | `eq:` | N/A | `equation()` |
| `diagram` | `fig:` | N/A | `diagram()` |
