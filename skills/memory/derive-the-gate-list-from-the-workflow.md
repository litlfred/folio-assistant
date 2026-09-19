---
$schema: folio-memory/v1
id: derive-the-gate-list-from-the-workflow
label: trap
summary: "derive the gate list from the WORKFLOW, not from package.json"
createdAt: 2026-09-19
roles:
  - build-pipeline
  - validation-pipeline
agents:
  - ci-health-watcher
---
Three CI checks are invoked **by path**, not by npm-script name, so a sweep
over `bun run <script-name>` structurally cannot see them: `gen-docs-pages.ts`,
`gen-schema-docs.ts`, `gen-skill-docs.ts`, each `--check`. Get the list from the
workflow itself, not from `package.json`.

**Editing a script that WRITES a witness restales every published projection of
it** — regenerate both sides and verify by parsing, not by grep.

<!-- detail -->

The command:

    grep -oE "bun run (scripts/[a-z-]+\.ts[^ ]*|[a-z:.-]+)" \
      .github/workflows/code-quality-gates.yml | sort -u

`gen-docs-pages` has no `package.json` alias at all.

`kg-audit.ts` records its own `scriptHash` in 220 `kg-qa` sidecars AND in 20
`test/results/witnesses/**/*.kg.json`. Regenerate both. Verify by parsing each
side and blanking the hash keys — these are single-line JSON, so
`grep -v scriptHash` filters nothing.

`MEMORY.md` is generated from `skills/memory/` by `bun run agent-memory`; a TRAP
written into it directly is deleted by the next run. The harness injects the
FIRST 200 lines, so an entry past that line is dropped silently — put evidence
in an entry's `detail`, which is written beside the file rather than into it.
