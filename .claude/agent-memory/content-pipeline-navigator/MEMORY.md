# content-pipeline-navigator — memory

Entry types: **STABLE** · **TRAP** · **BASELINE** (re-measure, never quote).
Seeded 2026-08-29 from `AGENTS.md` and a listing of `content/pipeline/` +
`schemas/` at `5aea6cc0`. Confirm entries as you use them.

---

## STABLE — the stages, in order

```
.ts manifests + .md content
  → Zod schema validation (shape + types)          schemas/constraints.ts
  → constraint rules (file existence, cross-refs, lean requirements)
  → profile check (kind-within-profile)            content/pipeline/profile-check.ts
  → render (LaTeX or Markdown)                     render-latex.ts / render-markdown.ts
  → AST validation of the rendered output
  → chapters/*.tex  or  one assembled .md
```

## STABLE — who owns which file (the split agents get wrong)

**This repo (the platform)** holds the pipeline that *acts on* content:
`validate.ts`, `render-latex.ts`, `render-markdown.ts`, `build.ts`,
`qa-sweep.ts`, `qa-staleness.ts`, `profile-check.ts`, `export-bibtex.ts`,
`citations.ts`, `build-glossary.ts`, the `validate-*` family, and every
schema under `schemas/` (`types.ts`, `constraints.ts`, `builders.ts`,
`block-kinds.ts`, `block-qa.ts`, `lean-packages.ts`).

**A folio** holds its own audit scripts — vacuity/axiom, clarity, orphan,
trace-convention, and so on — under its own `content/pipeline/`.

A folio reaches the platform through a clone-plus-symlink (in qou,
`scripts/setup-folio-assistant.sh`), so from inside a folio the platform
paths are prefixed `folio-assistant/`. **Check which side a script is on
before invoking it**; qou's own `AGENTS.md` carries this warning because the
wrong guess is a path that does not exist.

Several convenience aliases were dropped in that migration and not re-wired
(`validate-refs`, `export-bibtex`, `migrate-lean-refs`). Do not assume a
`bun run <shortcut>` exists — check `package.json` on the side you are on.

## STABLE — the commands that do exist here

```sh
bun install
bun run src/index.ts --http      # the assistant (HTTP); --stdio for stdio MCP
bun test                         # unit tests
bunx playwright test             # e2e  (npm script: test:e2e)
eslint .
bun run src/index.ts --check-deps   # probe environment capabilities
bun run init-folio --help           # scaffold a new folio
bun run readme:sync[:check] | readme:sections
bun run check:ci-health | check:corpus-gate | check:workflow-policy
bun run typecheck | lint | gen:jsonld[:check] | render:bpmn[:check]
```

## STABLE — profiles vs adapters (read before adding a kind)

- **Adapters** (`paper`, `dak`) partition kinds into **disjoint** namespaces;
  `adapterForKind` is what QA-criterion scoping reads and must stay total and
  unambiguous.
- **Profiles** (`document`, `paper`) **nest**: every document kind is also a
  paper kind. `PaperContentAdapter` extends `DocumentContentAdapter`.
- `MATH_BLOCK_KINDS` is written out in `schemas/block-kinds.ts`;
  `DOCUMENT_BLOCK_KINDS` is its **derived** complement, so a kind added to
  `BLOCK_KINDS` cannot go unclassified. Keep it derived.

Different **code** → adapter. Different **rules** → profile plus a subclass.

## TRAP — the schema cannot catch a profile violation

A `theorem` is a valid `theorem` whatever folio it sits in, and
`constraints.ts` cannot read `folio.config.json`. `profile-check.ts` runs on
every `content_validate` and enforces two rules the schema structurally
cannot: kind-within-profile, and (document only) **no `lean` field and no
`.lean` sibling** — because `remark`, `example`, `algorithm` and `simulator`
all *declare* an optional `lean` that the type permits and the profile
forbids.

## TRAP — adding a block kind is ~30 files, not one

Builder, Zod schema, label prefix, viewer registration, constraint rows, QA
criteria. **There is no `recommendation` kind**: a normative statement is a
labelled, titled `prose` block
(`skills/folio-document-adapter/normative-statements.md`). Enumerate the cost
before starting rather than half-doing it.

Known-wrong and predating the document profile: `document-intake.md` maps
guideline recommendations onto `definition`, which is wrong for a document
folio, where `definition`'s `lean` field is **required**.

## STABLE — the document render path takes no TeX, deliberately

`render-markdown.ts` assembles the folio to one Markdown file;
`document_render_{md,html,pdf}` take it through pandoc, the PDF via
weasyprint/prince/wkhtmltopdf. It **never** falls back to `latexmk` — a PDF
that silently came out of LaTeX would misreport what the folio needs to
build, and the next person on a clean machine pays for that. Registered for
**both** content types, because it is the render that works while drafting on
a machine with no TeX.

## STABLE — QA sidecars

`<block>.qa.json` (block-qa/v1) carries per-criterion reviewer entries;
`<criterion-id>.script.json` is qa-script/v1. Producing types are
`schemas/block-qa.ts`. A sidecar is **stale** when the recorded source hashes
or a reviewer `script_hash` drift from the current file contents; refresh by
deleting the stale `criteria.<crit>` entry and re-running
`bun run content/pipeline/qa-sweep.ts <path> --only <crit>`.

`qa-staleness.ts` reports; `qa-sweep.ts` repairs.

**A standalone library `.lean` file has no sidecar** and escapes every
per-block checker. Nothing but an agent checks it.

## STABLE — `uses[]` is EDITORIAL, and immediate-neighbours only

`uses[]` and `interprets` state what a *reader* must have read to follow a
block — agent/human maintained, part of the authored content. It lists
**immediate neighbours only**: if A→B and B→C, A lists only B. It is not the
import graph and not a transitive closure.

## BASELINE — re-measure, do not quote

| what | command |
|---|---|
| the pipeline's actual entrypoints | `ls content/pipeline/` |
| the scripts that exist on this side | `bun run` with no args, or read `package.json` |
| block kinds and their classification | read `schemas/block-kinds.ts` |
| sidecar staleness | `bun run content/pipeline/qa-staleness.ts <path>` |

---

## Corrected invocations

The highest-value entries in this file. Format: *what an agent reached for →
what is actually right → date*. Append as you find them.

- (none recorded yet)

## Session log

One line per task: what you navigated, what you corrected. Keep under ~200
lines — prune the log, never the TRAPs.
