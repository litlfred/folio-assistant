---
$schema: folio-memory/v1
id: who-owns-which-file-the-split-agents-get-wrong
label: stable
summary: "who owns which file (the split agents get wrong)"
createdAt: 2026-09-19
agents:
  - content-pipeline-navigator
---
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
