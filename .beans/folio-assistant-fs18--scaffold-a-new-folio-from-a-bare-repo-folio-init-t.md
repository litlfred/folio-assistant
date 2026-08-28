---
# folio-assistant-fs18
title: 'Scaffold a new folio from a bare repo: folio_init tool, templates, README quickstart'
status: completed
type: task
priority: normal
created_at: 2026-08-28T14:15:45Z
updated_at: 2026-08-28T15:04:11Z
---


## Landed

`scripts/init-folio.ts` + the `folio_init` MCP tool + README quickstart.

Six conventions were only ever written down implicitly, and getting any one
wrong produces a repo that looks right and renders nothing: the document
manifest is named after its own directory; block manifests import builders
through a `content/schema/` shim rather than reaching into the platform;
`folio.config.json` selects the adapter; `AGENTS.md` is the agent-generic entry
with `CLAUDE.md`/`GEMINI.md` as stubs; `.beans/` is the work plan; and the
platform checkout has to be reachable from the shim's relative path.

Two decisions worth keeping:

**`folio_init` is a generic tool, not an adapter tool.** It runs *before* the
folio has a content type. A bare repo has no `folio.config.json`, so adapter
selection falls back to `paper` — an adapter-scoped tool would be unreachable in
exactly the case it exists for.

**The builder shim exists so the platform path is written down once.** Blocks
live at `content/<slug>/<chapter>/` and would otherwise each spell out
`../../../folio-assistant/schemas/builders` — a path that changes for any block
nested differently and for every folio that links the platform differently.
Re-linking is now a two-file edit rather than a corpus sweep.

Submodule linking is the default (a clone gets the revision the content was
authored against); `sibling` for one platform copy serving several folios. A
failed `git submodule add` is a **note, not an error** — every file written is
already correct and the remedy is one command, so dying on a network failure
would leave a half-initialized repo and no record of what remained.

### Two bugs the end-to-end test caught

The load-bearing test scaffolds into a temp dir, symlinks the platform, and
actually renders — a layout mistake is invisible file-by-file, because every
individual file is syntactically fine.

1. `buildDocumentMarkdown` resolved a relative manifest path against its own
   module rather than the caller's cwd, so it looked for the folio *inside the
   platform*.
2. A titled `prose` block lost its title in the Markdown render. `KIND_HEADING`
   omits `prose` on purpose — stamping "**Prose.**" over every paragraph would
   be noise on the commonest kind — but a *titled* prose block is exactly the
   `normative-statements` pattern, where the title is the headline a reader
   cites. That dropped the most load-bearing line of a policy document.

Also asserts a second run leaves an author's edited `AGENTS.md` alone.
