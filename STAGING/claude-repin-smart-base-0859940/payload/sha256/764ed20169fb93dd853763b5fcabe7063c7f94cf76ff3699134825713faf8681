---
# folio-assistant-tdir
$schema: bean/1.0.0
title: 'TOOL FOLDERS: one Tool per `tools/<id>/<id>.ts`, its own published JSON-LD and IRI, its I/O types as their own JSON Schema files, and a QA report per Tool — migrate every litlfred instance'
status: in-progress
type: feature
priority: high
created_at: 2026-10-15T18:05:00Z
updated_at: 2026-10-15T18:05:00Z
parent: folio-assistant-zzmr
---

## The ask, owner 2026-10-15 — verbatim

Quoted rather than paraphrased; it arrived in four messages in session
`session_01XZ5H7vswrTg7r3Kv2k2EhZ` (folio-assistant#2559, Uganda adaptation):

| smart-base/tools/index.ts has lots of defined tools. why are they not each
| in their own folder like smart-base/tools/extract-dak (should be bean about
| Tools getting their own folders and having a QA report). please audit other
| repos for same issue. i want a seperate jsonld for each Tool w/ its own IRI.
|
| ...and input ouput schemas should be their own files/json schema when
| published w/ IRIs so can be referernced easy.
|
| smart-base/tools/index.ts ← reads every */<tool>.json. (need to make sure
| the Tool schema is used and conteventions of dirname and declarion like
| <tool>/<tools>.ts are followed) . dont externalize the json on main, only
| when rendered in gh-pages. migrate all impacted litlred repos/ with
| <repo>/tools or <repo>/<repo>/tools index.ts to sub-folders as is stronly
| recommended behaviour.
|
| do full migration (bean up first)

## Measured 2026-10-15, before anything was written

| instance | Tools | where they are declared |
|---|---|---|
| cat-harness | 144 | `tools/index.ts` (113), `mcp.ts` (28), `sessions.ts`, `viewers.ts`, `vocab-map.ts` (1 each) |
| fhir-harness | 32 | `tools/index.ts` |
| folio-assistant-core | 12 | `tools/index.ts` |
| smart-base | 11 | `smart-base/tools/index.ts` |
| folio-assistant-sci | 7 | `tools/index.ts` |
| who-iris | 1 | `tools/index.ts` |
| cat-harness-tools | 1 | `tools/index.ts` (beside `discover.ts`) |

No instance has a per-Tool folder. Discovery forces the barrel:
`cat-harness-tools/tools/discover.ts` loads exactly `<tools dir>/index.ts`
and calls its `tools()`.

Three further defects found by the same audit, each in scope here:

1. **Non-harness Tools are never published.** `kg-export --instance
   ./smart-base` and `--instance ./fhir-harness` emit **0** Tool nodes:
   `collectTools` reads `toolsOf(ROOT)` with `ROOT` = cat-harness, and the
   per-instance path (`collectInstanceNodes`) collects no Tools at all. So the
   11 smart-base and 32 fhir-harness Tools have no published node — the `dh4f`
   shape for a whole kind.
2. **A Tool's IRI is a fragment**, `<instance>.jsonld#tool/<id>`
   (`makeIri`, `kg-export.ts`), so a Tool cannot be dereferenced alone.
3. **I/O types are fragments of one file**:
   `tool-types.schema.json#/$defs/<Name>` (`toolTypeIri`,
   `cat-harness/schemas/tool-types.ts`). Not separately referenceable.

QA: `tool` has been a QA subject kind since `sj6m` (2 criteria). Its verdicts
are on `qa-reports` keyed by commit; nothing links a Tool to its report.

## The design

**Source stays TypeScript on main.** The owner: *"dont externalize the json on
main, only when rendered in gh-pages."* `defineTool` keeps its `tsc` check.

| | on main (source) | on gh-pages (rendered) |
|---|---|---|
| a Tool | `<tools dir>/<id>/<id>.ts`, default-exporting one `defineTool({...})` (or a function of `baseUrl` returning one) | `<base>/tools/<id>.jsonld`, `@id` `<base>/tools/<id>` |
| its scripts, tests | beside it in `<tools dir>/<id>/` when they belong to that Tool alone | — |
| its I/O types | `cat-harness/schemas/tool-types.ts` (unchanged) | `<harness base>/schemas/tool-types/<Name>.schema.json`, `$id` that IRI |
| its QA | the `tool` subject kind (`sj6m`) | the Tool's page links its latest `qa-reports` verdict |
| `<tools dir>/index.ts` | one call: load every `<id>/<id>.ts` (the shared loader), so discovery is unchanged | — |

Conventions held by a check, not prose: the folder name, the file stem and the
Tool's `id` are the same string; one Tool per folder; the default export
parses against `ToolDefinitionSchema`. A barrel declaring Tools inline is
reported by `check:tools` (strongly recommended, so a finding, not yet a
gate — promoted once every litlfred instance is migrated).

## Plan, in order

1. **cat-harness** — the shared loader (`loadToolFolders`) beside
   `defineTool`; the Tool-folder rule in `skills/folio-core/skills-and-tools.md`
   and `tool-authoring.md`; migrate its 144 Tools.
2. **cat-harness-tools** — `check:tools` reports inline barrels and checks the
   folder/stem/id convention; `kg-export` emits each instance's own Tools
   (defect 1), one `tools/<id>.jsonld` per Tool with its own `@id`
   (defect 2), and one `schemas/tool-types/<Name>.schema.json` per type with
   tool ports pointing at it (defect 3); migrate its 1 Tool.
3. **fhir-harness** (32), **folio-assistant-core** (12), **smart-base** (11),
   **folio-assistant-sci** (7), **who-iris** (1) — migrate.
4. **folio-assistant** — re-pin each, stage, and look at a Tool page and a
   type schema on the staging site.

## Done when

- [ ] Every litlfred instance with a `tools` graph declares each Tool in
      `<tools dir>/<id>/<id>.ts`, and `check:tools` reports no inline barrel.
- [ ] `kg-export` of smart-base and of fhir-harness emits their Tools.
- [ ] A published Tool dereferences at its own IRI (`…/tools/<id>.jsonld`).
- [ ] A published I/O type dereferences at its own IRI
      (`…/schemas/tool-types/<Name>.schema.json`), and Tool ports name it.
- [ ] A Tool's page links its QA verdict.
- [ ] The skills say the rule, and the end-to-end check holds it.

## Related

`sj6m` (Tool QA subject kind), `fq5u` (run record per downstream Tool),
`3sbm` (tool releases), `p0za` (auto-discovery), `1nu0` (Tools viewer).
