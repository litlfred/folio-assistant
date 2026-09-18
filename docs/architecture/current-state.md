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

```sh
find src schemas skills content adapters scripts -type f \
  \( -name '*.ts' -o -name '*.py' -o -name '*.sh' -o -name '*.md' \) | wc -l          # 805
… | grep -icE '(lean|latex|/tex|-tex|tex-|proof|simulator|sage|knot|witness)'          # 101
… | grep -icE '(who|smart|dak|fhir|fsh|ig-|-ig|ocl|l2-|l3-)'                           # 94
```

Of 805 source files, **101 are scientific-authoring specific** (Lean, LaTeX,
proofs, simulators, Sage, witnesses) and **94 are WHO/SMART specific** (DAK,
FHIR, FSH, OCL, L2/L3). Those are the two candidate extractions —
`folio-asst-sci` and the `smart-*` family — and at roughly 12 % of files each
they are large enough to be worth moving and small enough that the remainder is
still a coherent core.

The filename heuristic is a **lower bound and nothing more**: it finds
`lean-build-bg.sh` and misses a Lean special case buried in a generic validator.
Phase I's first task is to replace it with a real dependency scan.

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
