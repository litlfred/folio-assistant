# QOU Schema Documentation

Type definitions and validation schemas for the **Quantum Observable Universe** paper system.

## Content-Object Model

The core document model, organized as atomic knowledge units:

- **[types.ts](./types.ts)** — TypeScript types: `Block`, `Chapter`, `Paper`, `Section`, etc.
- **[constraints.ts](./constraints.ts)** — Zod runtime schemas + constraint rules
- **[builders.ts](./builders.ts)** — Validated constructor functions (`definition()`, `theorem()`, etc.)

## CI/Output Schemas

Types consumed by CI pipelines and published to GitHub Pages:

- **[qou-types.ts](./qou-types.ts)** — Proof objects, glossary, coverage, test infrastructure

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
