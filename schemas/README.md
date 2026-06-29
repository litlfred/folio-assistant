# folio-assistant Schema Documentation

Type definitions and validation schemas for the folio-assistant content-object
model. Content-agnostic: nothing here is specific to a particular paper.

## Content-Object Model

The core document model, organized as atomic knowledge units:

- **[types.ts](./types.ts)** — TypeScript types: `Block`, `Chapter`, `Paper`, `Section`, etc.
- **[constraints.ts](./constraints.ts)** — Zod runtime schemas + constraint rules
- **[builders.ts](./builders.ts)** — Validated constructor functions (`definition()`, `theorem()`, etc.)

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
