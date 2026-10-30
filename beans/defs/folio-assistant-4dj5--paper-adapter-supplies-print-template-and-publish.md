---
# folio-assistant-4dj5
$schema: bean/1.0.0
title: 'PAPER TEMPLATE WIRING: the sci paper adapter supplies its print preamble to generate-main-tex, and publish.yml uses it (#2117 P2, P5)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-30T11:55:00Z
updated_at: 2026-10-30T17:15:00Z
parent: folio-assistant-7x5n
---

The platform half of [#2117](https://github.com/litlfred/folio-assistant/issues/2117) still open after #2118.
The template exists at `folio-assistant-sci/adapters/paper/latex/paper-preamble.tex`,
but its README says "Not yet wired":

- **P2.** `generate-main-tex.ts` (cat-harness-tools) still defaults `--preamble` to the
  deleted `cat-harness/latex/preamble.tex`. Pointing it at sci from the core would invert the
  layering, so the paper adapter must supply the template through the renderer contribution.
- **P5.** `publish.yml` passes the template the same way.

Platform-only. qou-side wiring (qou stories Q1–Q4, the notation fragment) is out of scope
here: qou is a math repo and changes there need the owner's OK first.

## Done when

- [x] `generate-main-tex` with no `--preamble` gets the template from the paper adapter.
- [x] No cat-harness or cat-harness-tools file names a sci path.
- [x] `publish.yml` builds a paper PDF without an explicit `--preamble`.
- [x] The sci README's "Not yet wired" section is removed.

## Implementation & PRs

- `litlfred/cat-harness-tools`: https://github.com/litlfred/cat-harness-tools/pull/868 (`resolveAdapterPreamble`, `ResolvedRenderTarget.preamblePath`, `resolvePaperPreamble`, and default preamble resolution in `generate-main-tex.ts`, `build.ts`, and `run-build.ts`).
- `litlfred/folio-assistant-sci`: https://github.com/litlfred/folio-assistant-sci/pull/115 (`PAPER_PREAMBLE_PATH` and `PaperContentAdapter.preamblePath` on `PaperContentAdapter`, `adapters/paper/latex/README.md` updated to `## How it is wired`, `--preamble` removed from `build-pdf.sh`, and unit + CLI tests in `declared-adapter.test.ts`).
- `litlfred/folio-assistant`: https://github.com/litlfred/folio-assistant/pull/2732 (`--preamble ../latex/preamble.tex` removed from `.github/workflows/publish.yml`).

_2026-10-30T17:15:00Z_ — Merged https://github.com/litlfred/folio-assistant-sci/pull/115 (0dbdb92) and https://github.com/litlfred/cat-harness-tools/pull/868 (de4e70e). #868 had a tsc error (its test fixture lacked the `root` field main added to `BuiltinAdapterDeclaration`), fixed on the branch. `run-build.ts` had moved to sci in saqd group 3 first, so its preamble change went to https://github.com/litlfred/folio-assistant-sci/pull/126 (f2a3982). Left: https://github.com/litlfred/folio-assistant/pull/2732 (publish.yml), which merges only once the folio-assistant pins include tools de4e70e and sci 0dbdb92 (asked the CI thread). Session https://claude.ai/code/session_01Qmmkt5WaLSwgbVA8urteie (thread "Land GOAL 1 placement moves").
