---
layout: default
title: Current state
parent: Architecture
nav_order: 2
---

# Current state — what this repo actually is
{: .no_toc }

1. TOC
{:toc}

---

> **All figures on this page were measured on `main` at `369d89e`, 2026-09-18**,
> with the commands shown. They are a snapshot, not a contract: re-run the
> command before quoting a number, per the `AGENTS.md` rule on BASELINE facts.

## The one-sentence summary

`folio-assistant` is a **Tool repo and a Content repo in one checkout**, with a
Test repo's worth of fixtures distributed through both, and no boundary that
anything enforces except review.

That is the mixture [issue #223](https://github.com/litlfred/folio-assistant/issues/223)
names. This page makes it specific enough to plan against.

## Size and shape

```sh
for d in src schemas skills content adapters scripts docs; do
  n=$(find $d -type f \( -name '*.ts' -o -name '*.py' -o -name '*.sh' -o -name '*.md' -o -name '*.json' \) | wc -l)
  l=$(find $d -type f \( -name '*.ts' -o -name '*.py' -o -name '*.sh' \) -exec cat {} + | wc -l)
  echo "$d: $n files, $l code lines"
done
```

| directory | files | code lines | what it is authoritative for | kind |
|---|---:|---:|---|---|
| `scripts/` | 232 | 49,348 | build, QA, Lean, LaTeX, translation, CI helpers | **Tool**, mostly |
| `content/` | 431 | 46,401 | the **pipeline** — validators, QA, render, graph | **Tool** (despite the name) |
| `adapters/` | 27 | 10,205 | per-content-type tools (`document`, `paper`, `mcp-server`) | **Tool** |
| `schemas/` | 77 | 9,707 | the content-object model + per-skill JSON Schemas | **Content** (schema half) |
| `src/` | 41 | 8,120 | the MCP server, core, and 11 generic tools | **Tool** |
| `skills/` | 144 | 435 | 9 skill packages — almost entirely prose | **Content** (skill definitions) |
| `docs/` | 165 | — | this site | self-documentation |

Two things fall out of that table immediately.

**`content/` contains no content.** It holds `content/pipeline/` (110 files) and
`content/docs/`. Actual folio content lives in a *separate* repository. The
directory is named for what it operates on, not what it holds — which is the
direct motivation for the `content/` → `folio/` rename in
[the issue's comment](https://github.com/litlfred/folio-assistant/issues/223#issuecomment-5726628913).

**`skills/` is 144 files and 435 lines of code.** Skill packages are
overwhelmingly Markdown instructions plus a `package-manifest.json`. That is the
taxonomy working as intended: a Skill is a *described* unit of work, and the
Tools that satisfy it live elsewhere. It is also why `skills/` is the cheapest
thing in the repo to split out.

## Where the domains already separate — and where they do not

An early version of this page answered by matching filenames. That is a lower
bound by construction — it finds `lean-build-bg.sh` and misses a Lean special
case inside a generic validator — so it has been replaced by a real import-graph
partition, `bun run check:partition`
(`scripts/repo-partition.ts`).

The tool walks every `.ts` module under `src/`, `schemas/`, `adapters/`,
`content/`, `scripts/`, `test/` and `types/`, resolves each relative import
(the codebase writes bare, `.js`-for-`.ts`, and directory forms, so all three
are tried), assigns each module to one of the five proposed repositories, and
reports the edges that cross a boundary **in the wrong direction**.

### The partition

**341 modules, 670 internal import edges** (2026-09-18):

| proposed repo | modules | by rule | hand-triaged | by keyword | fell through |
|---|---:|---:|---:|---:|---:|
| `cat-harness` | 58 | 43 | 15 | 0 | 0 |
| `folio-assistant-core` | **129** | 120 | 9 | 0 | 0 |
| `folio-assistant-sci` | 36 | 8 | 8 | 20 | 0 |
| `smart-kg` | **0** | 0 | 0 | 0 | 0 |
| `smart-base` | 4 | 1 | 0 | 3 | 0 |
| *(test material)* | 114 | 110 | 0 | 4 | 0 |
| **unassigned** | **0** | — | — | — | 0 |

`hand-triaged` is its own column on purpose. Thirty-two platform
meta-scripts — `gen-*`, `check-*`, `render-*` — were reported unassigned by the
structural rules and then read one at a time, by the bean `dh4f` question:
*does this read or write **platform**, or **content**?* The answer genuinely
differs per file and no path pattern separates them —
`scripts/gen-skill-docs.ts` is harness because Skills are a harness concept,
while `scripts/gen-schema-docs.ts` is core because the content-object model is
core's. Recording those as `triage` rather than folding them into `rule` keeps a
decision visible as a decision, so it can be revisited without first working out
which entries were judgements.

Two things in that table are worth reading carefully.

**`smart-kg` is zero.** Not small — zero. Nothing in this repo is WHO L1
material today, which confirms from the code what
[the future state](future-state.html#smart-kg) says from the prose: the L1/L2
line has to be drawn by someone with the domain context, because there is no
existing code to infer it from. It makes `smart-kg` **new construction, like the
Test repos** — not an extraction.

**`smart-base` is four modules.** The WHO material here is overwhelmingly prose,
BPMN and schemas rather than TypeScript, so a module-count partition understates
it badly. Do not read 4 as "nearly done".

### The wrong-direction edges — Phase I's worklist

**46 edges** import across a proposed boundary in a direction the dependency
DAG forbids. Every module is classified, so this is a complete count rather
than a floor:

| importer | imports from | edges |
|---|---|---:|
| `cat-harness` | `folio-assistant-core` | **21** |
| `folio-assistant-core` | `folio-assistant-sci` | **20** |
| `cat-harness` | `folio-assistant-sci` | 3 |
| `folio-assistant-core` | `smart-base` | 2 |

`bun run check:partition:edges` prints all 46 by name. The two large groups have
different causes and different fixes.

**core → sci (20)** is Lean and LaTeX reaching into generic code.
`content/pipeline/build.ts` imports `render-latex`, `generate-main-tex`,
`latex-preflight` and `lean-coverage`; `qa-utils.ts` imports `lean-signature`;
`schemas/constraints.ts` imports `lean-packages`. This is the seven math block
kinds' machinery embedded in the document pipeline — the profile split
`AGENTS.md` describes at the *schema* level, not yet carried through to imports.
It is the expected shape of the problem, and the most mechanical to fix.

**harness → core (21)** is the more serious one. `src/core/feedback.ts`,
`src/routes/feedback.ts`, `src/types.ts` and `schemas/assistant-types.ts` all
import `schemas/types.ts` — the content-object model. That is the harness's
defining constraint, [that it does not "do" anything](future-state.html#cat-harness),
failing in practice: **a harness that imports the content model cannot be
extracted from underneath core.** It makes `cat-harness` harder to extract
than `folio-assistant-sci`, not easier, which is the opposite of the intuition that
the most-depended-upon repo comes out first.

**On the count's history.** The first run reported 33 cross-edges with 135
modules unassigned; classifying the test material and the standalone MCP server
took it to 41; triaging the last 27 took it to 45. **Classifying more modules
finds more violations, not fewer.** The number only stopped moving because the
unassigned column reached zero — which is why that column, not the edge count,
is the one to check first when re-running this.

**It then went to 46 without anyone touching a boundary.** Merging ten commits
from `main` brought five new modules — the CRDM stakeholder-map tooling and the
BPMN reference check, all harness — and one of them imports the content model.
So the harness → core violation is not a fixed debt being paid down; **it grows
as ordinary work lands**, because nothing today stops a new harness module
importing `schemas/types.ts`. That is an argument for a CI gate
(`check:partition --strict`) once the count is driven down, not for treating 46
as a number that will sit still.

## The mechanism the split already has

This is the most important finding on the page, and it cuts both ways.

`<name>.config.json` already declares cross-instance dependencies:

```jsonc
"dependencies": {
  "folioAssistant": [
    { "name": "smart-base", "git": "…", "ref": "main",
      "provides": ["skills", "content", "translations"] }
  ]
}
```

`schemas/harness-config.ts` implements a **depth-first, listed-order, later-
overlays-earlier** resolution with cycle detection — explicitly the FHIR/SUSHI
dependency methodology, applied upstream of it. `resolveDependencyTree`
(`schemas/harness-config.ts:239`) and `flattenDependencies` are real, tested code.

**That is exactly the mechanism a five-repo future state needs.** The split does
not require inventing composition; it requires finishing it.

### What is not wired

```sh
for f in resolveSkillDirs resolveTranslationDirs resolveContentDirs; do
  echo "$f: $(grep -rn "$f" --include='*.ts' . --exclude-dir=node_modules \
    | grep -v 'schemas/harness-config' | wc -l) external refs"
done
```

| exported resolver | external callers |
|---|---:|
| `resolveSkillDirs` | **0** |
| `resolveTranslationDirs` | **0** |
| `resolveContentDirs` | *does not exist* |

The only non-test consumer of the entire module is
`content/pipeline/po-resolve.ts` — the **translation** fallback chain. So of the
three resolution paths the dependency model promises, one is wired, one is
declared-but-uncalled, and one was never written.

The module's own docstring overstates this. Its table reads:

| Resource | Resolved? | How |
|---|---|---|
| Skills | ✅ | `skills/` directory, overlaid depth-first |
| Content blocks | ✅ | `content/` directory, overlaid depth-first |

Skills resolve only in the sense that a function exists which nobody calls.
Content blocks have no function at all. **Fixing that table — or the code under
it — is Phase I work, not a documentation nit**, because every later phase
assumes a dependency can contribute skills and content.

### What the model used to rule out — resolved 2026-09-18

The docstring was, until this change, explicit that two things are **never**
resolved from a dependency: schemas, and MCP tools — "always from the root
folio-assistant". For a single-platform world that was a reasonable
simplification. For the proposed split it was a blocker: `folio-assistant-sci` exists
to own the math block kinds, the paper adapter and `lean_build`, and a
dependency able to contribute none of them can only ship prose.

That is now [Phase 0.1](migration-plan.html#01--make-the-dependency-model-able-to-carry-the-split--decided-and-built),
decided and built: `schemas/contributions.ts` plus `loadContributions()`. A
dependency declares `"contributes": "./contributions.ts"` and adds block kinds,
an adapter and MCP tools at load time. Collisions throw rather than resolving by
load order; a diamond dependency graph is explicitly not a collision.

**The same docstring was also optimistic in the other direction**, and that
half is not fixed, only correctly reported. It claimed content blocks resolve
across dependencies (✅) when no such function has ever existed, and that skills
resolve when `resolveSkillDirs` has no caller. The table now distinguishes
wired (✅), written-but-uncalled (⚠️) and absent (❌), so it states what the code
does rather than what it intends. **Two resolution paths remain genuinely
unbuilt** — content-directory overlay, and QA criteria from a dependency.

## The failure mode this repo has already paid for

Bean `dh4f` (completed 2026-08-08) triaged **30 pipeline scripts** that computed
paths from their own location — correct before the platform/folio split, wrong
after — and/or named a specific folio paper in platform code. 23 were fixed.

Three of them had been *reporting success over a corpus they had never read*:

| script | before | after |
|---|---|---|
| `validate-tex` | "No errors found", exit 0, over 0 files | 1 file, 2 snippets, both valid |
| `conditional-class-banner-audit` | ✓ over 0 blocks, exit 0 — **a CI gate** | refuses, exit 1 |
| `audit-tex-source` | "✓ No TeX-source hazards detected" over 0 files | scans the real corpus |

**Every repo boundary the migration creates can reproduce this defect**, and a
green check is its symptom. The plan's per-phase gate is written accordingly:
an empty corpus must exit non-zero, and each extraction is verified by running
the moved tool against a synthetic folio, not by observing that CI is still
green.

## What this repo is authoritative for today

Reading the taxonomy against the measurements:

- **Tool** — the MCP server (`src/server.ts`, 11 generic tools), the content
  pipeline, the adapters, the build/QA/render scripts. This is the bulk.
- **Content** — the content-object model (`schemas/types.ts`,
  `constraints.ts`, `builders.ts`), the block kinds, the 9 skill packages, and
  the BPMN processes under `processes/`. These are schemas and Skill
  definitions: Content-repo material by the taxonomy, even though no subject
  matter lives here.
- **Test** — no Test repo exists. Fixtures are distributed: `test/`,
  `scripts/tests/`, and the synthetic-folio helpers bean `dh4f` describes. There
  are no Test Plans and no Gherkin. Test data is **not** a folio content type,
  which the taxonomy says it should be.
- **Consumer** — `ui/`, `viewer/`, `home_page/` and `blueprint/` are in-repo
  clients of the model.

The Test gap is worth stating plainly because it is the one kind the issue
describes that this repo has **not** begun: everything else exists in some form
and needs sorting, whereas the Test repo needs building.

---

Next: [Future state](future-state.html) — the five target repositories.
