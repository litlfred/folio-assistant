---
name: glossary-build
roles: [reader, collaborator, owner]
---

# Glossary Build Skill

## Role

Maintain the project-wide glossary of defined terms. Builds the
`glossary.json` index from every block's `defines: [...]` field,
generates the `chapters/glossary.tex` chapter, and gates CI with
`--check` mode.

## When to invoke

- A user mentions: glossary, defined terms, `defterm`, `refterm`,
  `defines[]`, "build glossary", "regenerate glossary".
- After any block's `defines: [...]` field is added, modified, or
  removed.
- As part of `content-validation` whenever a chapter is validated
  end-to-end.

## Tools

| Command | Purpose |
|---------|---------|
| `cd content && bun run pipeline/build-glossary.ts <paper-dir>` | Generate `glossary.json` + `chapters/glossary.tex` |
| `cd content && bun run pipeline/build-glossary.ts <paper-dir> --check` | CI gate — non-zero exit on duplicates or out-of-date JSON |
| `cd content && bun run pipeline/glossary-candidates.ts <paper-dir>` | Phase C: propose candidate owner blocks per slug → `glossary-candidates.json` (gitignored) |
| `cd content && bun run pipeline/apply-glossary-curation.ts <paper-dir>` | Dry-run: show edits implied by `glossary-curation.json` |
| `cd content && bun run pipeline/apply-glossary-curation.ts <paper-dir> --write` | Apply curated `defines: [...]` insertions to chosen `.ts` files (idempotent) |
| `cd content && bun run pipeline/codemod-refterm.ts <chapter-dir>` | Dry-run: preview `:refterm[…]` backfill in a chapter |
| `cd content && bun run pipeline/codemod-refterm.ts <chapter-dir> --write` | Apply backfill to disk |
| `cd content && bun run validate <paper-dir>` | Includes the five glossary-term validation rules |
| `cd content && bun run validate <paper-dir> --strict` | Adds `term-mention-coverage` (bare-text mentions) |

### Curator web UI (Phase C)

`/folio/glossary-curator.html?paper=<paper-dir>` is a propose-and-pick
interface served by the folio-assistant HTTP server.

- The page calls `GET /api/glossary/candidates` (which runs
  `proposeCandidates()` and returns the same data as
  `glossary-candidates.json`).
- The author clicks one candidate per slug (or "skip for now"), then
  hits **save** to `POST /api/glossary/curation`, persisting the
  decisions to `<paper>/glossary-curation.json` (committed).
- The agent then runs `apply-glossary-curation.ts --write` to insert
  the chosen `defines: ["…"]` fields into each owner block's `.ts`
  file, followed by `codemod-refterm.ts <chapter> --write` to backfill
  `:refterm[…]` mentions.

Roles: `GET` is open; `POST` requires `collaborator` or higher.

## Authoring contract

Every term registered in any block's `defines: [...]` field **must** be
wrapped at every occurrence:

- **Defining occurrence** (exactly one block): `:defterm[Visible]` /
  `:defterm[Visible]{#slug}` in `.md`; `\defterm{slug}[{Visible}]` in
  `.tex`.
- **Reference occurrences** (every other mention, anywhere in the
  project): `:refterm[Visible]` / `:refterm[Visible]{#slug}` in `.md`;
  `\refterm{slug}[{Visible}]` in `.tex`.

Plain text and `\emph{}` are no longer permitted for defined terms once
the slug appears in any `defines[]` list.

## Validation rules (Phase B)

| Rule | Severity | Trigger |
|------|----------|---------|
| `defterm-declared` | error | `:defterm[X]` whose `X` is not in this block's `defines[]` |
| `defterm-marked` | warning | `defines[]` entry with no `:defterm[X]` in the `.md` |
| `refterm-resolves` | error | `:refterm[X]` not declared in any block's `defines[]` |
| `defterm-unique` | warning | Same slug declared by multiple blocks |
| `term-mention-coverage` | warning (`--strict`) | Bare-text mention of a known slug not wrapped in `:refterm[…]` |

## CI integration (formal-pipeline tie-in)

If the project has a formal-proof pipeline (e.g. Lean), the glossary
build can regenerate a synonyms module from `glossary.json`, emitting
`abbrev`s to library synonyms (owner-recorded decision):

```lean
-- Auto-generated from glossary.json — do not edit by hand.
namespace Project.Glossary
open CategoryTheory
abbrev MonoidalCategory := CategoryTheory.MonoidalCategory
abbrev BraidedMonoidalCategory := CategoryTheory.BraidedMonoidalCategory
-- For non-library synonyms, emit a `def ... := sorry` stub
-- with a `-- Ref: [manuscript]` comment.
end Project.Glossary
```

`abbrev` is preferred over `def` so that elaboration sees the library
type definitionally. The formal-proof CI should re-run `--check` after
this file is regenerated to ensure the JSON-to-source mapping is in
sync.

The strict-mode validator (`--strict`) is enabled in CI **after** the
first backfill batch lands, to avoid an avalanche of
`term-mention-coverage` warnings on existing prose.

## See also

- `content-validation` — full authoring contract and agent-facing rules
- `content/pipeline/validate-defterm.ts` — validator implementation
- `content/pipeline/build-glossary.ts` — builder implementation
- `content/pipeline/codemod-refterm.ts` — backfill codemod
- `content/pipeline/glossary-candidates.ts` — Phase C proposer
- `content/pipeline/apply-glossary-curation.ts` — Phase C applier
- `ui/glossary-curator.html` — curator web UI
- `src/routes/glossary.ts` — curator API routes
