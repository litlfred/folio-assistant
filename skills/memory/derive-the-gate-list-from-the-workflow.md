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
Three CI checks are invoked **by path**, not by npm-script name, so a sweep over
`bun run <script-name>` structurally cannot see them:
`gen-docs-pages.ts`, `gen-schema-docs.ts`, `gen-skill-docs.ts`, each `--check`.
`gen-docs-pages` has no `package.json` alias at all.

> Measured `bun run scripts/gen-docs-pages.ts --check` on 2026-09-19 (bean
> `nup0`): 18 named gates, `tsc`, `eslint`, `bun test` and 60 Playwright tests
> all green, and `TypeScript — tests, lint, types (hard)` still red on 20 stale
> `test/results/witnesses/**/*.kg.json` projections.

Get the list from the workflow:
`grep -oE "bun run (scripts/[a-z-]+\.ts[^ ]*|[a-z:.-]+)" .github/workflows/code-quality-gates.yml | sort -u`

**Editing a script that WRITES a witness restales every published projection of
it.** `kg-audit.ts` records its own `scriptHash` in 220 `kg-qa` sidecars *and*
20 `test/results/witnesses/**/*.kg.json`. Regenerate both. Verify by parsing each side and
blanking the hash keys — these are single-line JSON, so `grep -v scriptHash`
filters nothing.

**`MEMORY.md` is generated** from `skills/memory/` by `bun run agent-memory`; a
TRAP written into it directly is deleted by the next run. Keep the total under
200 lines — past that the harness does not inject the entry at all.
