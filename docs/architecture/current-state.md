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
`content/`, `scripts/`, `tests/` and `types/`, resolves each relative import
(the codebase writes bare, `.js`-for-`.ts`, and directory forms, so all three
are tried), assigns each module to one of the five proposed repositories, and
reports the edges that cross a boundary **in the wrong direction**.

### The partition

**331 modules, 655 internal import edges** (2026-09-18):

| proposed repo | modules | by explicit rule | by keyword | fell through |
|---|---:|---:|---:|---:|
| `agentic-harness` | 43 | 43 | 0 | 0 |
| `folio-assist-core` | **119** | 119 | 0 | 0 |
| `folio-asst-sci` | 28 | 8 | 20 | 0 |
| `smart-kg` | **0** | 0 | 0 | 0 |
| `smart-base` | 4 | 1 | 3 | 0 |
| *(test material)* | 110 | 107 | 3 | 0 |
| **unassigned** | **27** | — | — | 27 |

Three things in that table are worth reading carefully.

**`smart-kg` is zero.** Not small — zero. Nothing in this repo is WHO L1
material today, which confirms from the code what
[the future state](future-state.html#smart-kg) says from the prose: the L1/L2
line has to be drawn by someone with the domain context, because there is no
existing code to infer it from.

**`smart-base` is four modules.** The WHO material here is overwhelmingly prose,
BPMN and schemas rather than TypeScript, so a file-count partition understates
it badly. Do not read 4 as "nearly done".

**27 modules are unassigned, and stay that way.** They are platform
meta-scripts — `gen-schema-docs`, `check-ci-health`, `render-bpmn`,
`generate-registry`, and so on. Most are probably `agentic-harness`, and the
tool deliberately does not say so: an assignment it guessed would be
indistinguishable in the report from one it derived. That list is a human's
call, and it is 27 items long, which is a tractable afternoon.

### The wrong-direction edges — Phase I's worklist

**41 edges** import across a proposed boundary in a direction the dependency
DAG forbids:

| importer | imports from | edges |
|---|---|---:|
| `folio-assist-core` | `folio-asst-sci` | **19** |
| `agentic-harness` | `folio-assist-core` | **17** |
| `agentic-harness` | `folio-asst-sci` | 3 |
| `folio-assist-core` | `smart-base` | 2 |

`bun run check:partition:edges` prints all 41 by name. The two large groups have
different causes and different fixes:

**core → sci (19)** is Lean and LaTeX reaching into generic code.
`content/pipeline/build.ts` imports `render-latex`, `generate-main-tex`,
`latex-preflight` and `lean-coverage`; `qa-utils.ts` imports `lean-signature`;
`schemas/constraints.ts` imports `lean-packages`. These are the seven math block
kinds' machinery embedded in the document pipeline — the profile split
`AGENTS.md` describes at the *schema* level, not yet carried through to imports.

**harness → core (17)** is the harness knowing about the content model.
`src/core/feedback.ts`, `src/routes/feedback.ts`, `src/types.ts` and
`schemas/assistant-types.ts` all import `schemas/types.ts`. This is the more
interesting group, because it is the harness's defining constraint —
[it must not "do" anything](future-state.html#agentic-harness) — failing in
practice: a harness that imports the content-object model cannot be extracted
from underneath core.

**A caution on the count.** The first run of this tool reported 33 cross-edges
with 135 modules unassigned; classifying the test material and the standalone
MCP server raised it to 41. **Classifying more modules finds more violations,
not fewer** — so 41 is itself a lower bound while 27 modules remain unassigned.
Treat it as a floor that rises as triage proceeds, never as a burn-down number.

## The mechanism the split already has

This is the most important finding on the page, and it cuts both ways.

`folio.config.json` already declares cross-instance dependencies:

```jsonc
"dependencies": {
  "folioAssistant": [
    { "name": "smart-base", "git": "…", "ref": "main",
      "provides": ["skills", "content", "translations"] }
  ]
}
```

`schemas/folio-config.ts` implements a **depth-first, listed-order, later-
overlays-earlier** resolution with cycle detection — explicitly the FHIR/SUSHI
dependency methodology, applied upstream of it. `resolveDependencyTree`
(`schemas/folio-config.ts:239`) and `flattenDependencies` are real, tested code.

**That is exactly the mechanism a five-repo future state needs.** The split does
not require inventing composition; it requires finishing it.

### What is not wired

```sh
for f in resolveSkillDirs resolveTranslationDirs resolveContentDirs; do
  echo "$f: $(grep -rn "$f" --include='*.ts' . --exclude-dir=node_modules \
    | grep -v 'schemas/folio-config' | wc -l) external refs"
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

### What the model rules out, and why it matters

The same docstring is explicit that two things are **never** resolved from a
dependency:

| Resource | Resolved? |
|---|---|
| Schemas | ❌ always from the root folio-assistant |
| MCP tools | ❌ always from the root folio-assistant |

For the current one-platform world that is a reasonable simplification. For the
proposed future state it is a **blocker**: `folio-asst-sci` exists precisely to
own the Lean/LaTeX/simulator *content types*, which means contributing block
kinds (schemas) and `lean_build` / `paper_render_pdf` (MCP tools). A dependency
that cannot contribute either can only ship prose.

This is the single largest unresolved design question in the migration, and it
is called out as such in [the plan](migration-plan.html#01--make-the-dependency-model-able-to-carry-the-split--blocker).

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
  the BPMN processes under `docs/workflows/`. These are schemas and Skill
  definitions: Content-repo material by the taxonomy, even though no subject
  matter lives here.
- **Test** — no Test repo exists. Fixtures are distributed: `tests/`,
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
