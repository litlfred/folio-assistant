<!-- Generated from skills/memory/who-owns-which-file-the-split-agents-get-wrong.md by `bun run agent-memory`. -->
<!-- Not injected into MEMORY.md; read on demand. Edits here are lost. -->

Platform-side, in full: `validate.ts`, `render-latex.ts`,
`render-markdown.ts`, `build.ts`, `qa-sweep.ts`, `qa-staleness.ts`,
`profile-check.ts`, `export-bibtex.ts`, `citations.ts`, `build-glossary.ts`,
the `validate-*` family, and every schema under `schemas/` — `types.ts`,
`constraints.ts`, `builders.ts`, `block-kinds.ts`, `block-qa.ts`,
`lean-packages.ts`.

Folio-side: vacuity/axiom, clarity, orphan and trace-convention audits, under
the folio's own `content/pipeline/`.

The link is a clone-plus-symlink — in `qou`, `scripts/setup-folio-assistant.sh`
— which is why the platform paths are prefixed `folio-assistant/` from inside a
folio. `qou`'s own `AGENTS.md` carries the same warning.

Aliases dropped in that migration and never re-wired: `validate-refs`,
`export-bibtex`, `migrate-lean-refs`. Check `package.json` on the side you are
on.
