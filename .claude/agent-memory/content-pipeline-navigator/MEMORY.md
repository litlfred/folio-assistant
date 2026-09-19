# content-pipeline-navigator — memory

**Edit `skills/memory/*.md`, not this file.** The region below is assembled by
`bun run agent-memory` and anything written into it by hand is overwritten;
everything outside it — the session log — is yours and is never touched.
Entry types: **STABLE** · **TRAP** · **BASELINE** (re-measure, never quote).

---

<!-- folio:memory:begin -->

## STABLE — adapter vs profile: a different axis, and conflating them is costly

- **Adapters** (`paper`, `dak`) partition block kinds into **disjoint**
  namespaces. `adapterForKind` is what QA-criterion scoping reads, and it
  must stay **total and unambiguous**.
- **Profiles** (`document`, `paper`) **nest**: every document kind is also a
  paper kind.

Making `document` a third adapter would have made `adapterForKind` ambiguous
on all **eight** shared kinds. When adding a content type, ask whether it
needs different **code** (adapter) or only different **rules** (profile plus
a subclass).

`PaperContentAdapter` extends `DocumentContentAdapter`; `MATH_BLOCK_KINDS` is
written out in `schemas/block-kinds.ts` and `DOCUMENT_BLOCK_KINDS` is its
**derived** complement, so a kind added to `BLOCK_KINDS` cannot go
unclassified. Keep that derivation — do not hand-maintain both lists.

## STABLE — the document render path takes no TeX

`content/pipeline/render-markdown.ts` assembles the folio to one Markdown
file; `document_render_{md,html,pdf}` take it through pandoc, the PDF via
weasyprint/prince/wkhtmltopdf. It **never** falls back to `latexmk`,
deliberately — a PDF that silently came out of LaTeX would misreport what the
folio needs to build, and the next person on a clean machine pays for that.
Registered for **both** content types, because it is the render that works
while drafting on a machine with no TeX.

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

## STABLE — re-measure, do not quote

| what | command |
|---|---|
| the pipeline's actual entrypoints | `ls content/pipeline/` |
| the scripts that exist on this side | `bun run` with no args, or read `package.json` |
| block kinds and their classification | read `schemas/block-kinds.ts` |
| sidecar staleness | `bun run content/pipeline/qa-staleness.ts <path>` |

> Relabelled from BASELINE to STABLE, 2026-09-19. `AGENTS.md` defines a
> BASELINE as *"a measured number, stored with the command that produced it
> and the date"* — and this entry stores no number. It is a table of commands
> to RUN, which is the opposite thing: a stable fact about how to measure,
> not a measurement. `MemoryNodeSchema` refused it as a baseline, correctly.

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

## STABLE — `uses[]` is EDITORIAL, and immediate-neighbours only

`uses[]` and `interprets` state what a *reader* must have read to follow a
block — agent/human maintained, part of the authored content. It lists
**immediate neighbours only**: if A→B and B→C, A lists only B. It is not the
import graph and not a transitive closure.

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

## TRAP — adding a block kind is ~30 files, not one

Builder, Zod schema, label prefix, viewer registration, constraint rows, QA
criteria. **There is no `recommendation` kind**: a normative statement is a
labelled, titled `prose` block
(`skills/folio-document-adapter/normative-statements.md`). Enumerate the cost
before starting rather than half-doing it.

Known-wrong and predating the document profile: `document-intake.md` maps
guideline recommendations onto `definition`, which is wrong for a document
folio, where `definition`'s `lean` field is **required**.

## TRAP — derive the gate list from the WORKFLOW, not from package.json

Three CI checks are invoked **by path**, not by npm-script name, so a sweep over
`bun run <script-name>` structurally cannot see them:
`gen-docs-pages.ts`, `gen-schema-docs.ts`, `gen-skill-docs.ts`, each `--check`.
`gen-docs-pages` has no `package.json` alias at all.

> Measured `bun run scripts/gen-docs-pages.ts --check` on 2026-09-19 (bean
> `nup0`): 18 named gates, `tsc`, `eslint`, `bun test` and 60 Playwright tests
> all green, and `TypeScript — tests, lint, types (hard)` still red on 20 stale
> `test/results/witnesses/**/*.kg.json` projections.

Get the list from the workflow:
`grep -oE "bun run (scripts/[a-z-]+\.ts[^ ]*|[a-z:.-]+)" .github/workflows/code-quality-gates.yml | sort -u`

**Editing a script that WRITES a witness restales every published projection of
it.** `kg-audit.ts` records its own `scriptHash` in 220 `kg-qa` sidecars *and*
20 `test/results/witnesses/**/*.kg.json`. Regenerate both. Verify by parsing each side and
blanking the hash keys — these are single-line JSON, so `grep -v scriptHash`
filters nothing.

**`MEMORY.md` is generated** from `skills/memory/` by `bun run agent-memory`; a
TRAP written into it directly is deleted by the next run. Keep the total under
200 lines — past that the harness does not inject the entry at all.

## TRAP — never assert on a QA VERDICT from the published corpus

`test/results/witnesses/**` is live state. A test that reads a VERDICT out of it breaks
when somebody fixes or adjudicates the finding — which is the system working.

> Measured on 2026-09-19 (bean `tywj`): `tests/qa-panel.e2e.ts` pinned the first
> row to `voice-status-leak`/`fail`/`critical`, the fold count to `47` and the
> checker hash to `5af6856733f3`. An adjudication in `c8fbad385` turned that
> criterion `pass`; four assertions went red for reasons unrelated to the panel.

**Read the document live; flip the ONE criterion you test, BY ID, where it
sits.** The settled answer (#319) keeps only the script witness, so the hash the
spec asserts is still the corpus's own.

**Do not freeze a captured copy.** I tried it and withdrew it: freezing the
criterion freezes its witness, so the hash literal outlives the checker — the
same defect one field down. Reading the value out of a frozen document makes the
assertion self-consistent, not correct.

**Never hoist the failure to `criteria[0]`.** The generator already sorts
worst-first, so a panel that sorted nothing would pass.

`severity`, `evidence` and `changed` exist only in states the corpus is not in,
so no live sidecar vouches for them. Beans `tywj`, `qjyi`, `iumj`.

## TRAP — the schema cannot catch a profile violation

`content/pipeline/profile-check.ts` runs on every `content_validate` and
catches what **Zod structurally cannot**: a `theorem` is a valid `theorem`
whatever folio it sits in, and `constraints.ts` cannot read
`harness.config.json`.

Two rules: kind-within-profile, and (document only) **no `lean` field and no
`.lean` sibling** — because `remark`, `example`, `algorithm` and `simulator`
all *declare* an optional `lean` that the type permits and the profile
forbids.

<!-- folio:memory:end -->

---

## Corrected invocations

The highest-value entries in this file. Format: *what an agent reached for →
what is actually right → date*. Append as you find them.

- read a QA verdict from `docs/assets/qa/**` in a test → read the live document
  and flip the ONE criterion under test **by id, where it sits**, via
  `tests/support/qa-fixture.ts` → 2026-09-19

  *Corrected the same day. This line first read "freeze the verdict in
  `tests/fixtures/`", which contradicts the TRAP above it — that entry records
  trying a frozen copy and withdrawing it, because freezing the criterion
  freezes its witness and the `scriptHash` literal then outlives the checker.
  There is no `tests/fixtures/` directory. The shipped answer (#319, then the
  shared helper in #314) freezes nothing.*

## Session log

One line per task: what you navigated, what you corrected. Keep under ~200
lines — prune the log, never the TRAPs.
