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

More: `detail/adapter-vs-profile.md`

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
`schemas/block-qa.ts`. `qa-staleness.ts` reports; `qa-sweep.ts` repairs.

More: `detail/qa-sidecars.md`

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

`bun install`, `bun test`, `bunx playwright test`, `eslint .`,
`bun run typecheck`. The rest — the server, the scaffolder, the check: family
and the generators — are in the detail file rather than memorised.

More: `detail/the-commands-that-do-exist-here.md`

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

## STABLE — a mkdtemp fixture is outside every instance root, so it cannot test anything using findContentRepoRoot

A check that has stopped working still passes such a test, because the test
never reaches the path that broke. Measured 2026-09-19: every pre-existing
`no-orphan-sidecar` fixture was `mkdtemp`, so none noticed that check becoming a
no-op returning a clean bill of health.

Build a miniature folio and `process.chdir` into it, restoring in `finally`.
Stubbing the root is worse than nothing — the test then agrees with the code by
construction.

## STABLE — `uses[]` is EDITORIAL, and immediate-neighbours only

`uses[]` and `interprets` state what a *reader* must have read to follow a
block — agent/human maintained, part of the authored content. It lists
**immediate neighbours only**: if A→B and B→C, A lists only B. It is not the
import graph and not a transitive closure.

## STABLE — who owns which file (the split agents get wrong)

**The platform** holds the pipeline that ACTS ON content (`validate.ts`,
`render-*.ts`, `build.ts`, `qa-sweep.ts`, `profile-check.ts`, the `validate-*`
family, everything under `schemas/`). **A folio** holds its own audit scripts
under its own `content/pipeline/`.

From inside a folio the platform is symlinked under `folio-assistant/`, so the
same script name resolves to two different paths. **Check which side you are on
before invoking** — the wrong guess is a path that does not exist. Do not assume
a `bun run <shortcut>` exists either; several aliases were dropped in the
migration and never re-wired.

More: `detail/who-owns-which-file-the-split-agents-get-wrong.md`

## TRAP — a 'could not check' notice reusing a finding's wording inflates the census it protects

Consumers count findings by grepping the message, so a status line carrying the
finding's phrase is counted as one.

Measured 2026-09-19: a "could not read the results tree" warning worded with
`orphan QA sidecar` turned ten assertions red — it inflated the orphan census
the check exists to keep honest. Name the check by its **id** in a diagnostic,
never by the finding's phrase.

## TRAP — adding a block kind is ~30 files, not one

Builder, Zod schema, label prefix, viewer registration, constraint rows, QA
criteria. **There is no `recommendation` kind**: a normative statement is a
labelled, titled `prose` block
(`skills/folio-document-adapter/normative-statements.md`). Enumerate the cost
before starting rather than half-doing it.

Known-wrong and predating the document profile: `document-intake.md` maps
guideline recommendations onto `definition`, which is wrong for a document
folio, where `definition`'s `lean` field is **required**.

## TRAP — a block's QA verdict is no longer beside the block — scanning its directory finds nothing

`${block.root}.qa.json` has found nothing since bean `2634`, and finding
nothing reads as "never audited" rather than as an error — a false pass.

Never compose the path; the helpers in `content/pipeline/qa-paths.ts` are the
one answer, and they differ for reading and writing.

More: `detail/block-verdicts-moved-to-the-results-tree.md`

## TRAP — derive the gate list from the WORKFLOW, not from package.json

Three CI checks are invoked **by path**, not by npm-script name, so a sweep
over `bun run <script-name>` structurally cannot see them: `gen-docs-pages.ts`,
`gen-schema-docs.ts`, `gen-skill-docs.ts`, each `--check`. Get the list from the
workflow itself, not from `package.json`.

**Editing a script that WRITES a witness restales every published projection of
it** — regenerate both sides and verify by parsing, not by grep.

More: `detail/derive-the-gate-list-from-the-workflow.md`

## TRAP — validateObjects detects 'validated nothing' via issues.length === 0, so any advisory issue turns invalid into valid

`validateObjects` refuses success over a corpus it read nothing from, detected
as `allBlocks.size === 0 && issues.length === 0`. **Any** issue raised in
`loadBlocksFromDir` disarms it — including a warning that a check could not run.

Measured 2026-09-19: a third-state notice on `no-orphan-sidecar` flipped "an
empty directory is INVALID" to `valid: true`. Suppressed there; the fragility
remains for the next check that adds an advisory issue.

## TRAP — never assert on a QA VERDICT from the published corpus

`test/results/witnesses/**` is live state. A test that reads a VERDICT out of it
breaks when somebody fixes or adjudicates the finding — which is the system
working, not a regression.

**Read the document live and flip the ONE criterion you test, BY ID, where it
sits.** Do not freeze a captured copy: freezing the criterion freezes its
witness, so the hash literal outlives the checker. And never hoist the failure
to `criteria[0]` — the generator already sorts worst-first, so a panel that
sorted nothing would pass.

More: `detail/never-assert-on-a-qa-verdict-from-the-published-corpus.md`

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
