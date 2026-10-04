/**
 * What a check script reads and writes — the ONE place it is declared (bean `xpcu`).
 *
 * @module scripts/task-io
 * @graphNode none — a declaration table read by `regen-after-merge.ts` and `gates.ts`
 *
 * ## What a declaration buys
 *
 * - `outputs: []` — the script WRITES NOTHING. That is what lets `gates` run
 *   it in the worker pool beside other read-only gates, and lets `regen` ask
 *   it beside other read-only checks. A script with no `outputs` here runs
 *   alone, in order, exactly as it always did. (Only the empty list is used: a
 *   check that writes is treated as undeclared, and the test says so.)
 * - `inputs` — what can change the script's answer. This is what lets `regen`
 *   SKIP a verify/write pair whose inputs hash to the value recorded at its last
 *   green run (`input-hash.ts`). `{tracked}` means the whole working tree as
 *   version control sees it; a narrower glob list hashes only what it names,
 *   plus the script's own source and every module it imports.
 *
 * ## The rule for adding one
 *
 * **Only declare what you have read in the script, or measured.** An `inputs`
 * list that misses a file the script reads makes `regen` skip a pair that would
 * have failed — the false clean this repository refuses everywhere else. And
 * an `outputs: []` claim that is wrong lets two writers race. So:
 *
 * - for a script that walks every instance, skill or bean, use `{tracked}` and
 *   not a hand-picked list;
 * - do NOT declare `inputs` for a script whose answer depends on anything else:
 *   an environment variable, the network, the clock, or an ignored file;
 * - an `outputs: []` claim is re-checked on every `gates` run by the tree
 *   guard: a parallel batch that changes the tree is reported, naming the batch.
 *
 * ## How these entries were chosen — measured, 2026-10-01
 *
 * - `inputs`: the slowest pairs of a timed `bun run regen` (4 shared CPUs, load
 *   average 6–11 from other sessions; 1634 s, 2 passes). Each one's `--check`
 *   path was READ for writes, and its import closure scanned for environment,
 *   network and clock reads. Left out on purpose despite their cost:
 *   `uml:overview:check` (network and environment, via the PlantUML renderer),
 *   `kg:locale:check` and `translated-links:check` (environment),
 *   `library:viz:check`, `schema:viz:check` and `auto:docs:check` (network).
 * - `outputs: []` without `inputs`: every gate script that, run under
 *   `strace` on a clean tree, opened NOTHING for writing, created, renamed,
 *   removed or truncated nothing, inside or outside the repository (Bun's own
 *   cache aside). 185 of 193 gate scripts, measured 2026-10-01 — not inferred
 *   from a name.
 *
 * ## What the measurement cannot see, and why that is tolerable
 *
 * `strace` sees the code path a CLEAN tree takes. A check that writes only
 * when its answer changes is invisible to it: `skill:register:check` measured
 * read-only and writes its report whenever the verdict moves, so it is
 * declared by reading instead (skippable, not read-only). Another such check
 * left in the list fails in one direction only: in `gates`, its write is caught
 * by the tree guard and the run reports NOT clean, naming the parallel batch;
 * in `regen`, the settling pass re-asks every pair. A wrong `outputs: []` can
 * produce a false red, not a false green.
 */
import { TRACKED, type PairIO } from "./input-hash.ts";

export interface ScriptIO {
  /** Globs (or `{tracked}`) whose content can change the answer. Absent: never skipped. */
  inputs?: readonly string[];
  /** `[]`: writes nothing, may run in the pool. Absent: runs alone. */
  outputs?: readonly string[];
}

/** Writes nothing — measured with `strace` (see the module comment). Not skippable. */
const READ_ONLY: ScriptIO = { outputs: [] };

/** Read-only, and safe to skip on an unchanged tree: read for writes, env, network and clock. */
const TREE_READER: ScriptIO = { inputs: [TRACKED], outputs: [] };

export const TASK_IO: Readonly<Record<string, ScriptIO>> = {
  // ── regen's slowest pairs, by measured wall time (seconds, both passes) ──
  "translation:block-qa:check": TREE_READER, //   456 s — `--check` compares `substantive()`, which drops commit SHAs and timestamps
  "kg:audit:all:check": TREE_READER, //            335 s — spawns `kg-audit.ts --check` per instance; the spawned source is in the tree
  // 230 s. NOT read-only: even `--check` writes its registration report, so it
  // runs alone; but its answer is the tree's, so an unchanged tree may skip it.
  "skill:register:check": { inputs: [TRACKED] },
  "kg:audit:check": TREE_READER, //                 81 s — `--check` compares the manifest and every sidecar, writes neither
  "check:glossary": TREE_READER, //                 45 s — `glossary-page.ts --check` exits before its write loop
  "glossary:pot:check": TREE_READER, //             39 s — exits before writing; compares without the POT timestamp
  "readme:subgraphs:check": TREE_READER, //         25 s — writes its QA result only without `--check`
  "skills:docs:check": TREE_READER, //              19 s — returns before `writeFileSync`
  "processes:viz:check": TREE_READER, //            19 s
  "external-schemas:viz:check": TREE_READER, //     17 s — reads `git ls-files`, which the tree digest covers
  "kg:detangle:check": TREE_READER, //              15 s — writes only when not checking
  "audit:coverage:require-all": TREE_READER, //     14 s — `writeQaResult` only without `--check`
  "audit:coverage:strict": TREE_READER, //          14 s
  "lsi:viz:check": TREE_READER, //                  12 s
  "check:prov-qaqc": TREE_READER, //                12 s — exits before its write loop
  // ── read-only by measurement: no write under `strace` on a clean tree ──
  // Not skippable (no `inputs`): each may still read the environment, the
  // clock or the network. Re-measure before adding one; never add by name.
  "agent-memory:check": READ_ONLY,
  "avatars:css:check": READ_ONLY,
  "boards:default:check": READ_ONLY,
  "bootstrap:schemas:check": READ_ONLY,
  "bootstrap:validate": READ_ONLY,
  "bootstrap:vocabulary:check": READ_ONLY,
  "check:actor-reach": READ_ONLY,
  "check:agent-entry-links": READ_ONLY,
  "check:agents-claims": READ_ONLY,
  "check:agents-xref": READ_ONLY,
  "check:agents-xref:strict": READ_ONLY,
  "check:anchor-names": READ_ONLY,
  "check:artefact-verification": READ_ONLY,
  "check:artifact-index": READ_ONLY,
  "check:asset-roles": READ_ONLY,
  "check:available-locales": READ_ONLY,
  "check:avatar-instances": READ_ONLY,
  "check:bean-archive": READ_ONLY,
  "check:bean-blocks": READ_ONLY,
  "check:bean-bodies": READ_ONLY,
  "check:bean-front-matter": READ_ONLY,
  "check:bean-issue-links": READ_ONLY,
  "check:bean-parent-prose:check": READ_ONLY,
  "check:bean-parents": READ_ONLY,
  "check:bean-restates-skill": READ_ONLY,
  "check:bean-rollup": READ_ONLY,
  "check:bootstrap-concepts": READ_ONLY,
  "check:bun-pin": READ_ONLY,
  "check:catalogue": READ_ONLY,
  "check:ci-invocations": READ_ONLY,
  "check:code-accounting": READ_ONLY,
  "check:command-paths": READ_ONLY,
  "check:concern-groups": READ_ONLY,
  "check:context-emission": READ_ONLY,
  "check:declaration-claims": READ_ONLY,
  "check:declaration-filename": READ_ONLY,
  "check:declared-assets": READ_ONLY,
  "check:declared-dirs": READ_ONLY,
  "check:declared-paths": READ_ONLY,
  "check:docs-populated": READ_ONLY,
  "check:docs-templates": READ_ONLY,
  "check:escaped-markup:source": READ_ONLY,
  "check:fallback-roles": READ_ONLY,
  "check:folio-mount": READ_ONLY,
  "check:graph-kind-work": READ_ONLY,
  "check:harness-dirs": READ_ONLY,
  "check:harness-state:check": READ_ONLY,
  "check:image-roles": READ_ONLY,
  "check:import-direction": READ_ONLY,
  "check:instance-config": READ_ONLY,
  "check:instance-graph": READ_ONLY,
  "check:instance-render": READ_ONLY,
  "check:instance-themes:check": READ_ONLY,
  "check:invocation-parity": READ_ONLY,
  "check:kind-validators:require-all": READ_ONLY,
  "check:l1-complete": READ_ONLY,
  "check:lane-documentation": READ_ONLY,
  "check:layout-norms": READ_ONLY,
  "check:lockfile-pinning": READ_ONLY,
  "check:materialized-fixity": READ_ONLY,
  "check:methodology-evidence": READ_ONLY,
  "check:model-languages": READ_ONLY,
  "check:module-scope-resolution": READ_ONLY,
  "check:navbar-consistency:check": READ_ONLY,
  "check:node-iris": READ_ONLY,
  "check:orphan-verdicts": READ_ONLY,
  "check:partition": READ_ONLY,
  "check:portable-paths": READ_ONLY,
  "check:process-documentation": READ_ONLY,
  "check:publishable": READ_ONLY,
  "check:published-refs": READ_ONLY,
  "check:python-deps": READ_ONLY,
  "check:qa-reviewer-permission": READ_ONLY,
  "check:raci": READ_ONLY,
  "check:read-only-graphs": READ_ONLY,
  "check:ready-to-close": READ_ONLY,
  "check:red-gate-is-last": READ_ONLY,
  "check:remote-skills": READ_ONLY,
  "check:rendered-labels": READ_ONLY,
  "check:requirements": READ_ONLY,
  "check:retired-front-matter": READ_ONLY,
  "check:schema-nodes": READ_ONLY,
  "check:secret-leaks": READ_ONLY,
  "check:skills": READ_ONLY,
  "check:soft-hyphens": READ_ONLY,
  "check:source-licence": READ_ONLY,
  "check:stale-field-advice": READ_ONLY,
  "check:stale-paths": READ_ONLY,
  "check:structure-accessor": READ_ONLY,
  "check:subgraph-coverage": READ_ONLY,
  "check:subgraphs": READ_ONLY,
  "check:tabular-stubs": READ_ONLY,
  "check:term-mapping": READ_ONLY,
  "check:theme-art:check": READ_ONLY,
  "check:tools": READ_ONLY,
  "check:tools-closure": READ_ONLY,
  "check:upload-names:check": READ_ONLY,
  "check:uploads-retired": READ_ONLY,
  "check:usage-paths": READ_ONLY,
  "check:viewer-backticks": READ_ONLY,
  "check:viewer-nav": READ_ONLY,
  "check:voice-skills": READ_ONLY,
  "check:voices": READ_ONLY,
  "check:waivers": READ_ONLY,
  "check:wireframes": READ_ONLY,
  "check:workflow-coverage": READ_ONLY,
  "check:workflow-injection": READ_ONLY,
  "check:workflow-paths": READ_ONLY,
  "check:workflow-policy": READ_ONLY,
  "check:workflow-refs": READ_ONLY,
  "check:workflow-script-paths": READ_ONLY,
  "check:workflows": READ_ONLY,
  "check:xml-comments": READ_ONLY,
  "code-lists:check": READ_ONLY,
  "vocab-mappings:check": READ_ONLY,
  "deps:python:check": READ_ONLY,
  "auto:docs:check": READ_ONLY,
  "docs:harness:check": READ_ONLY,
  "docs:pages:check": READ_ONLY,
  "external-schemas:check": READ_ONLY,
  "folio:viz:check": READ_ONLY,
  "fsh-guts:viz:check": READ_ONLY,
  "gen:jsonld:check": READ_ONLY,
  "glossary:check": READ_ONLY,
  "glossary:check:bootstrap": READ_ONLY,
  "handler:index:check": READ_ONLY,
  "harness:dirs:check": READ_ONLY,
  "id-lookup:check": READ_ONLY,
  "iri:sync:check": READ_ONLY,
  "iris:covers:check": READ_ONLY,
  "iris:pages:check": READ_ONLY,
  "kg:detangle:direction": READ_ONLY,
  "kg:schema:check": READ_ONLY,
  "kg:subscribe:check": READ_ONLY,
  "beans:notes:check": READ_ONLY, // read: `checkNotes` only reads; the writer is `beans:notes`
  "landing:data:check": READ_ONLY,
  "landing:sticky:check": READ_ONLY,
  "library:readmes:check": READ_ONLY,
  "lint": READ_ONLY,
  "lsi:skills:check": READ_ONLY,
  "methodologies:viz:check": READ_ONLY,
  "navbar:geometry:check": READ_ONLY,
  "navbar:include:check": READ_ONLY,
  "ns:check": READ_ONLY,
  "readme:audit": READ_ONLY,
  "readme:audit:root": READ_ONLY,
  "readme:sync:all:check": READ_ONLY,
  "readme:sync:check": READ_ONLY,
  "readme:sync:root:check": READ_ONLY,
  "root-scan-census:check": READ_ONLY,
  "skill:commands:check": READ_ONLY,
  "smart-base:pages:check": READ_ONLY,
  "smart-trust:pages:check": READ_ONLY,
  "state:visualizer:check": READ_ONLY,
  "subscriptions:viz:check": READ_ONLY,
  "theme:page:check": READ_ONLY,
  "themes:css:check": READ_ONLY,
  "tools:viz:check": READ_ONLY,
  "translate-bpmn:bootstrap:check": READ_ONLY,
  "translate-bpmn:check": READ_ONLY,
  "translate-kg-viewer:check": READ_ONLY,
  "translated-links:check": READ_ONLY,
  "translation:catalogue:check": READ_ONLY,
  "translation:drift:check": READ_ONLY,
  "translation:index:check": READ_ONLY,
  "translation:obsolete:check": READ_ONLY,
  "translation:pot:check": READ_ONLY,
  "translation:status:check": READ_ONLY,
  "uml:overview:check": READ_ONLY,
  "upload-step:docs:check": READ_ONLY,
  "voices:viz:check": READ_ONLY,
};

/**
 * A verify/write pair's declaration — its CHECK's. The writer needs none: in
 * `regen` every writer runs alone, whatever it declares. `undefined` when the
 * check is undeclared, which makes the pair run alone and never be skipped.
 */
export function pairIO(check: string): PairIO | undefined {
  const c = TASK_IO[check];
  return c === undefined ? undefined : { inputs: c.inputs, outputs: c.outputs };
}

/** Whether a gate command runs exactly one script that declares it writes nothing. */
export function gateReadsOnly(command: string): boolean {
  const m = /^bun run ([A-Za-z0-9:_-]+)\s*$/.exec(command.trim());
  if (m === null) return false;
  const io = TASK_IO[m[1]!];
  return io?.outputs !== undefined && io.outputs.length === 0;
}
