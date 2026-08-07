---
# folio-assistant-lnt1
title: 'ESLint backlog: 171 no-explicit-any (track 2 AST partly drained)'
status: todo
type: task
priority: normal
created_at: 2026-08-07T18:00:00Z
updated_at: 2026-08-07T20:35:00Z
---

`bun run lint` now runs (it never could before — no config, and neither
`eslint` nor `typescript-eslint` was a dependency). It exits 0 with **337
warnings**, deliberately: a rule is an ERROR in `eslint.config.mjs` only once
its count is zero, so a red lint always means a regression rather than
pre-existing debt.

Counts at the time the config landed, over 194 files:

| rule | count | note |
|---|---:|---|
| `@typescript-eslint/no-explicit-any` | 201 | gradual typing — a project-wide call, not a drive-by |
| `@typescript-eslint/no-unused-vars` | 111 | dead bindings; real cleanup, needs review per site |
| `@typescript-eslint/no-require-imports` | 13 | CommonJS holdouts |
| `@typescript-eslint/no-unsafe-function-type` | 10 | bare `Function` types |
| `@typescript-eslint/no-this-alias` | 2 | |

`prefer-const` was driven to **0** (15 auto-fixed) and is already an error.

## How to drain

Take ONE rule at a time, drive it to zero, then promote it from the warn
block to the error block in `eslint.config.mjs`. That keeps the gate green
throughout and makes each promotion a permanent ratchet.

`no-unused-vars` is the best first candidate: mechanical, and `--fix` does
not touch it so every removal gets looked at. Note the config already honours
the `^_` convention for deliberately-unused bindings, so the remaining 111 are
genuinely unreferenced rather than marked-intentional.

`no-explicit-any` is the largest and the least mechanical — it is a typing
decision per site, and probably wants its own plan rather than a sweep.

## Already paid off

The parse check alone found a live bug on its first run:
`scripts/generate-docs.ts` had `skills/*` + `/package-manifest.json` inside a
JSDoc block, and that `*` immediately followed by `/` closed the comment
early, leaving the rest parsed as code. bun could not load the file at all.
Fixed; the script now imports and runs.


## Drained: `no-unused-vars` 111 -> 0, promoted to ERROR

First rung of the ratchet. 337 -> 226 warnings; a new unused binding now
FAILS the lint (verified with a probe file).

Removed 70 unused import members, 5 fully-dead non-exported functions, and the
dead locals. Verified after every batch with `tsc --noEmit` + the 269-test
suite; both clean throughout.

### What it surfaced — dead bindings were hiding dead CHECKS

Not all of these were tidy-ups. Several were computations whose result was
discarded, i.e. a check that silently did nothing:

- **`adapters/mcp-server/server.ts` — swallowed build failure. FIXED.**
  `spawnSync("bun run content/pipeline/build.ts")`'s result was discarded, so
  a failed or timed-out content build was invisible and the lightning `.tex`
  was then assembled from stale or missing output. Now checks `status` and
  logs, matching the sibling spawnSync sites. Hard-failing may be the better
  end state — left as a follow-up rather than changing control flow untested.

- **`proof-narrative-lean-equiv-sweep.ts` — a check that was never wired.**
  `const mdStatement = extractMdStatement(mdText)` under the comment
  "Check if .md has a statement", result never used. `extractMdStatement` had
  exactly one caller — that line. So the md-statement check has never run.
  Both removed; **the check itself is still unimplemented** and someone should
  decide whether it is wanted.

- **`validate-bib.ts` — `yearMatch`** computed from the description and
  discarded. Same shape: a year check that does not happen.

- **`scripts/lean-audit.ts` — `witnessedFiles` / `pendingFiles`** partitioned
  and never reported.

- **`scripts/headless-render-qc.ts` — `appJs`** read from the viewer and
  unused. Harmless to remove, but it exposes something worth knowing: the QC
  page defines its **own** inline `mdToHtml` (line ~119) rather than using the
  viewer's. So headless render QC validates a COPY of the render logic and can
  pass while the real viewer differs. Worth its own bean.

Two were deliberate leftovers whose comments already explained them
(`isArchimedean` superseded by `hasRealType` in the wall checker;
`maskedLines` superseded by comments-only masking in the float checker) —
removed the bindings, kept the reasoning.

## Next rung

`no-explicit-any` (201) is the only substantial one left. It is a per-site
typing decision rather than a sweep, and probably wants a plan before anyone
starts. `no-require-imports` (13) is the cheapest next ratchet.


## Second rung: `no-require-imports` 13 -> 0, promoted to ERROR

226 -> 213 warnings. Verified with a probe file that a new `require()` now
fails the lint.

All 13 were lazy inline `require()` of Node builtins (`fs`, `child_process`)
inside function bodies — a CommonJS idiom in an ESM/TS codebase. Deferring a
builtin's load buys nothing, and six of the eight files already imported the
same module at top level, so this was mostly widening an existing member list:

| file | hoisted |
|---|---|
| `adapters/mcp-server/git.ts` | `symlinkSync`, `readdirSync` -> existing `fs` import |
| `src/core/git.ts` | `symlinkSync`, `readdirSync` -> existing `fs` import |
| `adapters/mcp-server/server.ts` | `readdirSync` -> existing `fs` import |
| `adapters/paper/index.ts` | 3 sites -> one `child_process` import |
| `adapters/mcp-server/paths.ts` | inline `require("fs").readFileSync(…)` -> named import |
| `content/pipeline/proof-axis-dashboard.ts` | `execSync` |
| `scripts/tests/lean-projects.test.ts` | `execSync` |
| `src/routes/branches.ts` | 2 sites -> one `child_process` import |

No behaviour change: the `try` blocks around these calls guard the OPERATION
(a symlink that may already exist, a `git` that may be absent), not the module
load.

## Remaining: 213

| rule | count |
|---|---:|
| `no-explicit-any` | 201 |
| `no-unsafe-function-type` | 10 |
| `no-this-alias` | 2 |

`no-this-alias` (2) and `no-unsafe-function-type` (10) are the next cheap
rungs. `no-explicit-any` is the only substantial one and is a per-site typing
decision rather than a sweep — it wants a plan before anyone starts.


## Third + fourth rungs: `no-unsafe-function-type` 10 -> 0, `no-this-alias` 2 -> 0

213 -> 201. Both promoted to ERROR; both ratchets verified with probe files.

`no-unsafe-function-type` — every site was a redundant widening, not a real
gap:
- `src/server.ts` and `adapters/mcp-server/server.ts` cast an
  ALREADY-typed handler `(...a: unknown[]) => Promise<unknown>` to `Function`
  before calling it. In `src/server.ts` that cast turned out to be
  load-bearing for the wrong reason: it also widened the RETURN, which is what
  let the wrapper be assigned back into the SDK's typed slot. Fixed by moving
  the cast to the assignment (`as ToolSlot`) where it belongs, so the call
  keeps its signature.
- three test files typed their tool-registration stubs as `Function`; replaced
  with a real `ToolHandler` call signature.

`no-this-alias` — both were `const self = this` forced by
`Bun.serve({ async fetch(req) {…} })`. A method shorthand binds its own
`this`; an arrow captures it lexically and the alias is unnecessary.

## What is left: 201 `no-explicit-any`, and why it is not a sweep

This is the only rule still on `warn`, and deliberately. The four drained so
far were mechanical — dead bindings, CommonJS idiom, redundant casts, a
`this` alias — each with one obviously-correct rewrite. `any` is not like
that: every occurrence is a separate typing decision, and a blanket
`any` -> `unknown` either fails to compile or pushes a cast to every call
site, which is the same unsoundness wearing a longer name.

**Do not start this as a sweep.** It needs a plan first: bucket the 201 by
shape (JSON boundaries, third-party gaps, genuinely-dynamic dispatch, plain
laziness), decide which buckets get real types and which get a documented
`unknown` + narrowing, and drain per bucket with the ratchet.


## The plan for the last 201 (this is the "plan first" the section above asks for)

Bucketed all 201, and the useful cut is by DOMAIN, not by syntax. The headline:
**108 of 201 (54%) annotate something this repo already has a type for.** They
are not missing types; they are unused ones.

| track | count | the type that already exists |
|---|---:|---|
| content structure | 55 | `Block`, `Section`, `Chapter`, `Paper` in `schemas/types.ts` (verified present, lines 963/1031/1084/1119) |
| markdown / LaTeX AST | 53 | `Root`, `Parent`, `Node`, `RootContent` from `@types/mdast` (verified installed) |
| genuinely heterogeneous | 93 | none — case by case |

Most-annotated identifiers, which is what makes track 1 obvious:
`block` ×19, `node` ×18, `nodes` ×7, `todo` ×5, `todos` ×4, `sec` ×4.

Concentration — 32 files, but heavily skewed:

    43  adapters/mcp-server/server.ts     (mixed: content structure + escape casts)
    30  content/pipeline/render-latex.ts  (almost entirely AST)
    20  adapters/paper/resolver.ts        (content structure)
    11  scripts/generate-docs.ts
    10  content/pipeline/validate-bib.ts

### Suggested order

1. **Track 2 (AST) first**, starting with `render-latex.ts` — 30 of the 53 in
   one file, one type family (`mdast`), and the file is pure transformation so
   the blast radius is contained. Good calibration for whether the mdast types
   fit the actual traversal or need narrowing helpers.
2. **Track 1 (content structure)**, starting with `adapters/paper/resolver.ts`
   (20, homogeneous) then the content-structure half of `server.ts`. Watch for
   the case where `any` is hiding a genuine schema gap — if `Block` does not
   actually have the field the code reads, that is a finding, not a cast to
   write.
3. **Track 3 last**, per site, and expect some of it to stay `any` with a
   comment saying why. That is a legitimate outcome.

Ratchet per track: drive the track to zero in its files, keep the rule on
`warn` until ALL 201 are gone, then promote once. Unlike the earlier rungs
this rule cannot be promoted incrementally — a rule is global.

### Why not a scripted sweep

The four drained rungs each had one obviously-correct rewrite, so a script plus
`tsc` + tests was a safe net. `any` -> `unknown` is not that: it either fails
to compile or pushes a cast to every call site, which is the same unsoundness
with a longer name. Each site is a decision. Estimated at a few focused
sessions per track, not one pass.


## Track 2 started: `render-latex.ts` 30 -> 0

201 -> 171. The file the plan nominated first, and it calibrated as hoped:
the existing types fit, with one wrinkle worth recording.

**It was TWO node families, not one.** The plan assumed mdast; the file also
walks the unified-latex AST (`splitLongMath`, `countNodes`,
`checkEnvironmentBalance`, `checkBareHash`). Both have real types —
`@types/mdast` and `@unified-latex/unified-latex-types` — so both were typed,
with the LaTeX one aliased on import (`LatexAstUnion` -> `LatexNode`) so the
two families cannot be confused at a glance.

**The mdast plugin node types needed explicit augmentation imports.** The
renderer switches on `math` / `inlineMath` / the three directive kinds, which
are not in base `@types/mdast`. `mdast-util-math` and `mdast-util-directive`
declare `module 'mdast'` augmentations, but only if imported — hence two
`import type {} from …` side-effect imports.

**One helper was needed, and it explains why the signatures were `any` at
all.** mdast splits nodes into `Parent` and leaves, and the renderer walks
both through the same paths. The `node.children ?? []` idiom is a type ERROR
on a leaf (no such property), not `undefined` — so `any` was the path of least
resistance. `childrenOf(node)` does the `"children" in node` check once.

**All three content-structure casts turned out to be unnecessary.**
`(block as any).title` carried the comment "extra field from builders", and
`(entry.block as any).cites` was similarly defensive. Both fields are on the
declared types today; removing the casts type-checks. Stale, not a schema gap
— the finding the plan told me to watch for did not materialise here.

### Verified by output, not just by `tsc`

Types should not change behaviour, but `childrenOf` and the `raw` narrowing
did change expressions, so: rendered **3483 blocks** through the committed
renderer and the typed one and diffed. **Byte-identical, zero differences.**

## Remaining: 171

Track 2 continues in the other AST files; track 1 (content structure,
~55, start `adapters/paper/resolver.ts`) and track 3 (heterogeneous) unchanged.
