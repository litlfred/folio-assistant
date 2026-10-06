/**
 * What a check script reads and writes (bean `xpcu`). This layer's rows are
 * declared here; an instance above it declares its own under `taskIo` in its
 * `<instance>.json`, and {@link collectTaskIo} reads both (bean `0r7u`).
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
 *   green run, and `gates` skip the script itself when its inputs hash to its
 *   last pass (`input-hash.ts`, bean `f017`). `{tracked}` means the whole working tree as
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
import { dirname } from "node:path";
import { checkoutRootFor, readDeclaration } from "../schemas/cat-harness.ts";
import { instanceRootsIn } from "../schemas/instance-roots.ts";
import { TRACKED, type PairIO } from "./input-hash.ts";

export interface ScriptIO {
  /** Globs (or `{tracked}`) whose content can change the answer. Absent: never skipped. */
  inputs?: readonly string[];
  /** `[]`: writes nothing, may run in the pool. Absent: runs alone. */
  outputs?: readonly string[];
  /** The task that repairs this check, when `X` / `X:check` naming does not give it (`regen`'s `WRITER_OVERRIDES`). */
  writer?: string;
  /** A merge train runs this check, and its writer when red, even without `regen`. */
  afterMerge?: boolean;
}

/** Writes nothing — measured with `strace` (see the module comment). Not skippable. */
const READ_ONLY: ScriptIO = { outputs: [] };

/** Read-only, and safe to skip on an unchanged tree: read for writes, env, network and clock. */
const TREE_READER: ScriptIO = { inputs: [TRACKED], outputs: [] };

/**
 * This layer's own rows. A task owned by an instance ABOVE this one is not
 * listed here: that instance declares it in its own `<instance>.json` under
 * `taskIo`, and {@link collectTaskIo} reads it from whatever instances are
 * present (bean `0r7u`, owner ruling 2026-10-06 — "each instance declares its
 * own tasks"). Twenty rows moved out on that day; naming them here would be
 * the upward reference that breaks this layer when it stands alone.
 */
const OWN_TASK_IO: Readonly<Record<string, ScriptIO>> = {
  // ── regen's slowest pairs, by measured wall time (seconds, both passes) ──
  "translation:block-qa:check": TREE_READER, //   456 s — `--check` compares `substantive()`, which drops commit SHAs and timestamps
  "kg:audit:all:check": TREE_READER, //            335 s — spawns `kg-audit.ts --check` per instance; the spawned source is in the tree
  // 107 s (2026-10-05). Read-only since bean `bo44`: `writesReport` is false
  // under `--check`, so this said "writes its registration report" a week after
  // it stopped (bean `8qyc`). Re-measured under strace on a clean tree: no
  // write in the repository; what it writes is what its sub-checks write, all
  // declared read-only here (the qa-store fetch below `.git/` is
  // `kg:audit:check`'s). In regen its sub-checks are folded (`pair-cover.ts`).
  "skill:register:check": TREE_READER,
  "kg:audit:check": TREE_READER, //                 81 s — `--check` compares the manifest and every sidecar, writes neither
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
  "check:graph-typology-work": READ_ONLY,
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
  "check:state-on-main": READ_ONLY,
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
  "navbar:assets:check": READ_ONLY,
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
  // ── regen's barriers, re-measured 2026-10-05 (bean `8qyc`) ──
  // Each was a pair regen ran ALONE only for want of a declaration: added to
  // the gate set after the 2026-10-01 sweep. Each `--check` ran under `strace -f`
  // on this tree and opened nothing for writing, created, renamed, removed or
  // truncated nothing (`.git/**/index.lock`, git's optional stat refresh, aside:
  // two concurrent refreshes skip rather than fail). AND each `--check` branch
  // was READ for a write that only a red verdict reaches — every one returns or
  // exits before its writer path, most through the judge (`concludeJudgement`
  // / `judgeQaResult`), which writes nothing by contract.
  "bat:sync:check": READ_ONLY,
  "check:avatar-coverage:check": READ_ONLY,
  "check:l1-complete:check": READ_ONLY, //         `sidecarFor` only under `--write`
  "check:lane-documentation:check": READ_ONLY,
  "check:layout-norms:check": READ_ONLY,
  "check:library-qa:check": READ_ONLY, //          `writeQaResult` only in the else of `if (check)`
  "check:methodology-evidence:check": READ_ONLY,
  "check:nav-names:check": READ_ONLY, //           ditto
  "check:rendered-labels:check": READ_ONLY,
  "check:source-licence:check": READ_ONLY,
  "check:undeclared-files:check": READ_ONLY, //    its one ftruncate is Bun's spawn-stdin memfd
  "kg:locale:check": READ_ONLY, //                 writes nothing; reads KG_BASE_URL, so still no `inputs`
  "kind:register:check": READ_ONLY, //             `--check` skips the write loop; its five verifies are READ_ONLY here
  "check:wireframes:check": READ_ONLY,
  "document-kinds:viz:check": READ_ONLY, //        its one `rmSync` is in the not-`check` arm
  "node-kind:pages:check": READ_ONLY, //           its one `rmSync` is in the not-`check` arm
  "qa:attestations:migrate:check": READ_ONLY, //   `--check` passes `dryRun` to the kg trees and `check` to criteria
  "slice:sqlite:vendor:check": READ_ONLY,
  // NO `inputs` for these five, read rather than assumed (bean `8qyc`): four
  // build through `kg-export.ts`'s `buildExport`, which stamps the document
  // with `stagingFields(process.env)` (`staging-stamp.ts`), and `kg:export`
  // also reads `KG_BASE_URL`; `render:bpmn` renders through whatever Chromium
  // the machine has. An answer that depends on the environment may not be
  // skipped, so they are always asked — in the pool now, rather than alone.
  //
  // These five DO write, and only into a directory each makes for itself with
  // `mkdtemp` (strace `-y` resolved every write fd: nothing outside
  // `/tmp/<own prefix>-XXXXXX`, Chromium's per-launch profile included) and
  // removes before exiting. No other process can name that directory, so
  // nothing another pair reads moves — which is the property `outputs: []`
  // exists to assert. Two were RED when measured (a stale skill payload on
  // `main`), so the red `--check` path was traced as well as read.
  "check:published-instance-exports": READ_ONLY, // 49 s; exports into `published-instance-export-*`, `--qa-root` there too (bean `ymsu`)
  "kg:export:check": READ_ONLY, //                  13 s; `sidecarMode("check")` judges, `writeQaResult` is the write mode's
  "render:bpmn:check": READ_ONLY, //                5 s; `emit` returns before `writeFile` under `--check`
  "slice:sqlite:check": READ_ONLY, //               12 s; `checkSlice` builds in `slice-check-*` / `slice-sqlite-*`
  "subgraph:jsonld:check": READ_ONLY, //            15 s; `if (check)` returns before `rmSync` / `writeFileSync`
};

/**
 * {@link OWN_TASK_IO} plus every present instance's declared `taskIo`.
 *
 * A key declared twice — by two instances, or by an instance and this table —
 * THROWS rather than letting one win: two owners of one task is a placement
 * defect, and silently picking either would make `outputs: []` a claim nobody
 * owns. An instance whose `taskIo` is absent contributes nothing; standalone,
 * with no instance above this layer present, the result is the own rows alone.
 */
export function collectTaskIo(
  repoRoot: string,
  own: Readonly<Record<string, ScriptIO>> = OWN_TASK_IO,
): Readonly<Record<string, ScriptIO>> {
  const out: Record<string, ScriptIO> = { ...own };
  const ownerOf = new Map<string, string>(Object.keys(own).map((k) => [k, "cat-harness/scripts/task-io.ts"]));
  for (const instance of instanceRootsIn(repoRoot)) {
    const declared = readDeclaration(instance)?.taskIo;
    if (declared === undefined) continue;
    for (const [task, io] of Object.entries(declared)) {
      const prior = ownerOf.get(task);
      if (prior !== undefined) {
        throw new Error(`task "${task}" is declared by both ${prior} and ${instance} — one task, one owner`);
      }
      ownerOf.set(task, instance);
      out[task] = {
        ...(io.inputs === undefined ? {} : { inputs: io.inputs }),
        ...(io.outputs === undefined ? {} : { outputs: io.outputs }),
        ...(io.writer === undefined ? {} : { writer: io.writer }),
        ...(io.afterMerge === undefined ? {} : { afterMerge: io.afterMerge }),
      };
    }
  }
  return out;
}

export const TASK_IO: Readonly<Record<string, ScriptIO>> = collectTaskIo(
  checkoutRootFor(dirname(import.meta.dir)),
);

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
