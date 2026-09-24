#!/usr/bin/env bun
/**
 * Which audits reach which KIND of node — measured, with denominators.
 *
 * Bean `folio-assistant-xutg`. On 2026-09-23 an agent reported that beans were
 * "effectively unaudited". Its evidence was a count of `kg-qa` sidecars over
 * them: zero. Its conclusion was wrong — five gates audit beans
 * (`check:bean-bodies`, `check:bean-front-matter`, `check:bean-issue-links`,
 * `check:bean-parents`, `check:bean-rollup`), plus `check:subgraphs` over the
 * links in their bodies.
 *
 * The defect was not the count. It is that **nothing answered "what audits this
 * kind of node"**, so the question got answered from whichever signal happened
 * to be in reach — the one family of sidecar that agent had just been reading. A
 * sidecar count is a fine measurement of sidecars and says nothing about gates.
 *
 * ## What this is NOT a second answer to
 *
 * `check:kind-validators` (bean `i31r`) asks whether every graph kind has a
 * **validator that loads** — can a node of this kind be *typed*. This asks who
 * **judges** it. The two come apart: a kind can be perfectly typed and audited
 * by nothing, which is exactly the state that got misread, and a validator
 * sweep would have reported it covered. Where they agree in shape they agree on
 * purpose too, and this deliberately copies two things from it — the open
 * registry as the denominator, and a gap REPORTED rather than failed.
 *
 * ## Coverage is DECLARED, not inferred
 *
 * A gate names the kinds it covers in its own module docblock:
 *
 *     @covers bean-defs, beans
 *     @covers none — a language-level check, not a graph audit
 *     @covers computed — it sweeps whichever kinds declare `nodeSchemas`
 *
 * The alternative was to infer it: grep each gate's source for a kind's name or
 * its declared directory. That is a heuristic, and a heuristic printed in a
 * coverage column is the `dh4f` defect — could-not-determine rendered as clean.
 * A gate that reads `beans/defs/` incidentally would score as auditing beans; a
 * gate that resolves its directory through `directoriesForGraph` names no path
 * at all and would score as auditing nothing. Both answers would be wrong and
 * neither would look it.
 *
 * So an undeclared gate is `undeclared` — counted, printed, never zero.
 * `--require-all` turns that into a failure, for the day the gap is meant to be
 * closed.
 *
 * Two further states exist because a static list cannot express what two real
 * gates do, and forcing them into it would have made the declaration a lie:
 *
 * - **`@covers none`** — a gate that has DECIDED it audits no declared graph.
 *   `check:workflows` reads `.github/workflows/`, which is not a graph kind.
 *   That is a different fact from a gate that has not said, and collapsing them
 *   would mean the one honest answer available to such a gate is silence.
 * - **`@covers computed`** — a gate whose covered set is DERIVED at run time.
 *   `check:kind-validators` walks whichever kinds declare `nodeSchemas`, so its
 *   coverage moves when the registry does. Writing today's answer as a literal
 *   would be a snapshot that goes stale silently, which is the failure
 *   `BASE_GRAPH_KINDS`'s own doc refuses for counts in prose. It counts as
 *   neither coverage nor a gap: the kinds it reaches are reported by that gate,
 *   not by this one.
 *
 * ## Three states per kind, and they must stay distinguishable
 *
 * The whole report is worthless if these collapse:
 *
 * 1. **no directory** — no instance declares a directory of this kind. A nested
 *    kind reached through its parent (`bean-defs` inside `beans/`), or a kind
 *    this instance simply does not have. NOT a gap.
 * 2. **a directory with no files** — a determined empty.
 * 3. **files, and no criterion and no gate reaching them** — the finding.
 *
 * A single "0" in one column cannot tell them apart, which is why every row
 * prints all four counts and the states are named rather than inferred from
 * zeroes.
 *
 * ## The committed record holds COVERAGE; the census is printed
 *
 * `files` and `sidecars` are printed and NOT written to the sidecar. They are a
 * census, and a census moves on any commit that adds a file to any graph — the
 * `docs` count changes when somebody writes a page. A gate keyed on that would
 * have been stale on nearly every pull request, and a gate that is stale by
 * default is a gate people learn to regenerate without reading. It went further
 * than churn: regenerating the L1 verdicts under `library/` made this report
 * stale, so a QA writer in one graph turned another graph's coverage gate red.
 *
 * What the sidecar records instead is the COVERAGE RELATION — which directories
 * are declared, which criteria reach the kind, which gates declare it, and the
 * resulting state. Those move when coverage moves, which is exactly when a
 * reviewer needs to see a diff. `hasFiles` carries the only thing the census
 * decides, since the states turn on whether a directory holds anything at all
 * rather than on how much.
 *
 * And that is this bean's own lesson applied to its own design: a sidecar count
 * is not a coverage measurement. Committing it here would have made the report
 * depend on the signal it exists to replace.
 *
 * ## Why `files` and not `nodes`
 *
 * Only a kind's own validator knows which of its files are nodes, and this
 * script is not going to mint a per-kind extension table to guess — that would
 * be a second source of truth about node shape, drifting from the one in
 * `nodeSchemas`. So the column counts FILES, excluding QA sidecars and
 * dot-prefixed paths, and is labelled as files. It is enough for the
 * distinction the report needs, which is whether the directory has content at
 * all.
 *
 * ## What `--check` fails on, and why it is NOT the findings
 *
 * `--check` fails on a **stale sidecar** — the committed record disagreeing with
 * what the corpus now says. The findings themselves are reported and do not
 * fail, which is `check:kind-validators`'s state 2 for the same reason: 4 kinds
 * hold files nothing audits today, and a gate that refused every push until
 * somebody wrote criteria for `interaction/` would be switched off within a
 * week. `--strict` is the flag for the day that gap is meant to be closed.
 *
 * Staleness is the half that CAN fail now, and it is the half that matters for
 * review: the whole argument for a committed sidecar over a printed verdict is
 * that a reader can tell "this kind has never been audited" from "this kind
 * lost its audit in the commit under review". A sidecar nobody regenerates
 * cannot do that.
 *
 * **And `--check` does NOT write.** The first version did, and the
 * falsification pass is what caught it: the gate repaired the staleness it was
 * reporting, so it could not fail twice, and in CI it would have left the
 * runner's tree modified with nothing committed — red once, green on the rerun,
 * the stale file still stale in the repository. A checker that mutates its own
 * subject cannot be falsified, which is the one property `generalise-the-fix`
 * Move 3 asks a guard to have.
 *
 * Usage:
 *   bun run audit:coverage                 # print the report, write the sidecar
 *   bun run audit:coverage --check         # ...and fail if the committed sidecar is stale
 *   bun run audit:coverage --strict        # ...and fail on a kind nothing audits
 *   bun run audit:coverage --require-all   # ...and on any gate that has not declared
 *
 * @module scripts/audit-coverage
 * @covers none — it measures coverage rather than auditing a graph; a row about
 *   itself would be a criterion that cannot fail.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import {
  declaredKinds,
  defaultGraphKinds,
  directoriesForGraph,
  instanceRootsIn,
  readDeclaration,
  repoRootFor,
} from "../schemas/cat-harness.js";
import { KG_CRITERIA, KG_SUBJECT_GRAPH_KINDS, KG_QA_RESULTS_DIR, type KgSubjectKind } from "../schemas/kg-qa.js";
import { loadGates } from "./gates.js";
import { QA_RESULTS_DIR, buildQaResult, writeQaResult, type QaResult } from "./qa-results.js";

/** The INSTANCE root — this file lives at `<instance>/scripts/`. */
const ROOT = resolve(import.meta.dir, "..");
const REPO = repoRootFor(ROOT);

/** Where a kind's files stand relative to the audits that reach them. */
export type KindState =
  /** No instance declares a directory of this kind. Not a gap. */
  | "no-directory"
  /** A directory exists and holds no files. A determined empty. */
  | "empty"
  /** Files, and at least one criterion or gate reaching them. */
  | "covered"
  /** Files, and nothing reaching them. The finding. */
  | "unaudited";

export interface KindCoverage {
  kind: string;
  state: KindState;
  /** Absolute directories, repo-relative for the report. */
  directories: string[];
  /** Printed, never committed — see the docblock. */
  files: number;
  /** `kg-audit` criteria ids reaching a subject kind that lives in this graph. */
  criteria: string[];
  /** Subject kinds of `KG_SUBJECT_GRAPH_KINDS` that live in this graph. */
  subjectKinds: KgSubjectKind[];
  /** Gate commands that DECLARE they cover this kind. */
  gates: string[];
  /** QA sidecars found under its directories. Printed, never committed. */
  sidecars: number;
}

/** A row without its census — what the sidecar records. See the docblock. */
export type KindCoverageRecord = Omit<KindCoverage, "files" | "sidecars"> & { hasFiles: boolean };

/** Strip the volatile half. */
export function asRecord(r: KindCoverage): KindCoverageRecord {
  const { files, sidecars: _s, ...rest } = r;
  return { ...rest, hasFiles: files > 0 };
}

/** What a gate declared, and how we got the declaration. */
export interface GateCoverage {
  command: string;
  /** Repo-relative script paths the command resolves to. */
  scripts: string[];
  /** Kinds it declares. Empty with `declared` set means `@covers none`. */
  covers: string[];
  /** `declared` · `none` · `computed` · `undeclared` · `no-script` */
  state: "declared" | "none" | "computed" | "undeclared" | "no-script";
  /** Why, when the state is not `declared`. */
  why?: string;
}

/** A file this report does not count as a node of anything. */
function countable(name: string): boolean {
  if (name.startsWith(".")) return false;
  // A verdict ABOUT a node is not a node. Counting sidecars would make a
  // directory look fuller the more of it had been audited.
  return !/\.(qa|kg-qa|qa-results|qa-witness)\.json$/.test(name);
}

function isSidecar(name: string): boolean {
  return /\.(qa|kg-qa|qa-results|qa-witness)\.json$/.test(name);
}

/**
 * This script's OWN sidecar, which the census must not count.
 *
 * It lives in the `qa-results` graph, so the `qa` row counts it — and writing it
 * changes the number the next run computes, which changes the sidecar, for ever.
 * The first version had no fixpoint: `audit:coverage` then `audit:coverage:check`
 * failed, and running the writer twice was the only way to satisfy a gate that
 * is supposed to be satisfied by running it once.
 *
 * **A measurement must not be a term in itself.** Not a special case to be
 * embarrassed about but the general reason this exclusion exists, and the path is
 * DERIVED from the same constants that write the file rather than spelled out, so
 * relocating the results directory cannot leave the exclusion pointing elsewhere.
 */
const SELF_SIDECAR = join(ROOT, QA_RESULTS_DIR, "audit-coverage.qa-results.json");

/** Files and sidecars under `dir`, recursively. Unreadable is zero, reported by the caller. */
export function census(dir: string, skip: ReadonlySet<string> = new Set([SELF_SIDECAR])): { files: number; sidecars: number; readable: boolean } {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return { files: 0, sidecars: 0, readable: false };
  }
  let files = 0;
  let sidecars = 0;
  for (const e of entries) {
    if (e.startsWith(".")) continue;
    const p = join(dir, e);
    if (skip.has(p)) continue;
    let dirent;
    try {
      dirent = statSync(p);
    } catch {
      continue;
    }
    if (dirent.isDirectory()) {
      const inner = census(p, skip);
      files += inner.files;
      sidecars += inner.sidecars;
    } else if (isSidecar(e)) sidecars++;
    else if (countable(e)) files++;
  }
  return { files, sidecars, readable: true };
}

/**
 * Resolve a gate command to the script files it runs.
 *
 * `bun run check:x` → `package.json.scripts["check:x"]` → the `.ts` paths in it.
 * One level of indirection is followed, because that is all the corpus has;
 * a deeper chain resolves to whatever the first hop names and is reported as
 * such rather than followed blindly.
 */
export function scriptsFor(command: string, scripts: Record<string, string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const walk = (cmd: string, depth: number): void => {
    for (const m of cmd.matchAll(/[\w./@-]+\.ts\b/g)) {
      const p = m[0].replace(/^\.\//, "");
      if (!seen.has(p)) {
        seen.add(p);
        out.push(p);
      }
    }
    if (depth > 2) return;
    for (const m of cmd.matchAll(/\bbun(?:x)? run ([\w:.-]+)/g)) {
      const name = m[1]!;
      const next = scripts[name];
      if (next !== undefined) walk(next, depth + 1);
    }
  };
  walk(command, 0);
  return out;
}

/**
 * Every `@covers` line in a module docblock, flattened. `["none"]` is a decision.
 *
 * ## The indentation is load-bearing
 *
 * `^ \* @covers ` — exactly one space, the star, exactly one space. The first
 * version accepted any leading whitespace, and the file it could not read
 * correctly was THIS ONE: the docblock above documents the syntax by showing
 * three `@covers` lines indented as a code sample, and a lenient pattern read
 * them as declarations. `audit-coverage` was credited with auditing
 * `bean-defs`, `beans` and nothing-in-particular, by its own examples.
 *
 * That is worth a rule rather than a patch: **a docblock that documents a tag
 * necessarily contains the tag**, so any parser over docblocks has to
 * distinguish a use from a mention, and indentation is the distinction JSDoc
 * already uses. A continuation line (` *   …`) is a mention too, which is why
 * the reason may wrap without leaking into the list.
 */
export function coversIn(text: string): string[] | undefined {
  const lines = [...text.matchAll(/^ \* @covers (.+)$/gm)].map((m) => m[1]!);
  if (lines.length === 0) return undefined;
  const out: string[] = [];
  for (const line of lines) {
    // Everything before an em-dash is the list; the rest is the reason.
    const list = line.split(/\s+[—–-]{1,2}\s+/)[0]!;
    for (const tok of list.split(/[,\s]+/)) {
      const t = tok.trim();
      if (t.length > 0 && !out.includes(t)) out.push(t);
    }
  }
  return out;
}

export function gateCoverage(root: string, repo: string): GateCoverage[] {
  let scripts: Record<string, string> = {};
  try {
    scripts = (JSON.parse(readFileSync(join(repo, "package.json"), "utf-8")) as { scripts?: Record<string, string> })
      .scripts ?? {};
  } catch {
    scripts = {};
  }
  // `--all`: the browser jobs gate the corpus too, and a coverage report that
  // silently dropped them would under-count for a reason invisible in its own
  // output.
  const gates = loadGates(repo, { all: true });
  const out: GateCoverage[] = [];
  const byCommand = new Map<string, GateCoverage>();
  for (const g of gates) {
    if (byCommand.has(g.command)) continue;
    const files = scriptsFor(g.command, scripts);
    if (files.length === 0) {
      const c: GateCoverage = {
        command: g.command,
        scripts: [],
        covers: [],
        state: "no-script",
        why: "resolves to no script in this repository — a language-level tool, not a graph audit",
      };
      byCommand.set(g.command, c);
      out.push(c);
      continue;
    }
    const declared: string[] = [];
    let anyRead = false;
    let anyDeclared = false;
    for (const f of files) {
      let text: string;
      try {
        text = readFileSync(join(repo, f), "utf-8");
      } catch {
        continue;
      }
      anyRead = true;
      const covers = coversIn(text);
      if (covers === undefined) continue;
      anyDeclared = true;
      for (const k of covers) if (!declared.includes(k)) declared.push(k);
    }
    const kinds = declared.filter((k) => k !== "none" && k !== "computed");
    const isComputed = declared.includes("computed");
    const c: GateCoverage = !anyRead
      ? {
          command: g.command,
          scripts: files,
          covers: [],
          state: "undeclared",
          why: `none of its ${files.length} script path(s) could be read`,
        }
      : !anyDeclared
        ? { command: g.command, scripts: files, covers: [], state: "undeclared", why: "no @covers line in its docblock" }
        : kinds.length === 0
          ? { command: g.command, scripts: files, covers: [], state: isComputed ? "computed" : "none" }
          : { command: g.command, scripts: files, covers: kinds, state: "declared" };
    byCommand.set(g.command, c);
    out.push(c);
  }
  // `relative` is applied by the caller for display; paths stay repo-relative.
  void root;
  return out;
}

/** The universe of kinds: the registry, plus anything an instance declares that it does not know. */
export function kindUniverse(repo: string): { registered: string[]; declaredOnly: string[] } {
  const registered = defaultGraphKinds.names().sort();
  const extra = new Set<string>();
  for (const inst of instanceRootsIn(repo)) {
    const decl = readDeclaration(inst);
    if (!decl) continue;
    for (const k of declaredKinds(inst, decl)) if (!registered.includes(k)) extra.add(k);
  }
  return { registered, declaredOnly: [...extra].sort() };
}

export function coverage(repo: string): { rows: KindCoverage[]; gates: GateCoverage[]; universe: { registered: string[]; declaredOnly: string[] } } {
  const universe = kindUniverse(repo);
  const kinds = [...universe.registered, ...universe.declaredOnly];
  const gates = gateCoverage(ROOT, repo);

  const criteriaByGraph = new Map<string, { ids: string[]; subjects: Set<KgSubjectKind> }>();
  for (const c of KG_CRITERIA) {
    for (const s of c.applies) {
      const graph = KG_SUBJECT_GRAPH_KINDS[s];
      const e = criteriaByGraph.get(graph) ?? { ids: [], subjects: new Set<KgSubjectKind>() };
      if (!e.ids.includes(c.id)) e.ids.push(c.id);
      e.subjects.add(s);
      criteriaByGraph.set(graph, e);
    }
  }

  const gatesByKind = new Map<string, string[]>();
  for (const g of gates) {
    for (const k of g.covers) {
      const list = gatesByKind.get(k) ?? [];
      if (!list.includes(g.command)) list.push(g.command);
      gatesByKind.set(k, list);
    }
  }

  const instances = instanceRootsIn(repo);
  const rows: KindCoverage[] = [];
  for (const kind of kinds) {
    const dirs = new Set<string>();
    for (const inst of instances) for (const d of directoriesForGraph(inst, kind)) dirs.add(d);
    let files = 0;
    let sidecars = 0;
    for (const d of dirs) {
      const c = census(d);
      files += c.files;
      sidecars += c.sidecars;
    }
    const crit = criteriaByGraph.get(kind);
    const gs = gatesByKind.get(kind) ?? [];
    const state: KindState =
      dirs.size === 0 ? "no-directory" : files === 0 ? "empty" : (crit?.ids.length ?? 0) > 0 || gs.length > 0 ? "covered" : "unaudited";
    rows.push({
      kind,
      state,
      directories: [...dirs].map((d) => relative(repo, d)).sort(),
      files,
      criteria: (crit?.ids ?? []).sort(),
      subjectKinds: [...(crit?.subjects ?? [])].sort(),
      gates: gs.sort(),
      sidecars,
    });
  }
  return { rows, gates, universe };
}

/** Everything about a result except when it was produced — the staleness key. */
function comparable(r: QaResult): string {
  const { updated_at: _when, ...rest } = r;
  return JSON.stringify(rest);
}

/**
 * Is the committed sidecar what this run computed?
 *
 * `absent` is deliberately its own answer. A missing sidecar under `--check` is
 * the `dh4f` case — no record at all reads identically to a clean one if both
 * are reported as "not stale".
 */
export function sidecarState(instanceRoot: string, fresh: QaResult): "absent" | "stale" | "current" {
  const p = join(instanceRoot, QA_RESULTS_DIR, "audit-coverage.qa-results.json");
  if (!existsSync(p)) return "absent";
  try {
    return comparable(JSON.parse(readFileSync(p, "utf-8")) as QaResult) === comparable(fresh) ? "current" : "stale";
  } catch {
    return "stale";
  }
}

function main(): number {
  const check = process.argv.includes("--check");
  const strict = process.argv.includes("--strict");
  const requireAll = process.argv.includes("--require-all");
  const { rows, gates, universe } = coverage(REPO);

  // §1.2a of `generalise-the-fix`: a sweep prints its own denominator. A
  // report over zero kinds, or over zero gates, passes every assertion below
  // and has measured nothing.
  const declaredKindCount = universe.registered.length + universe.declaredOnly.length;
  if (rows.length === 0 || gates.length === 0) {
    console.log(`⚠ EXAMINED NOTHING — ${rows.length} kind(s), ${gates.length} gate(s)`);
    return 1;
  }
  console.log(
    `Audit coverage  (${rows.length} of ${declaredKindCount} declared kind(s) examined, ` +
      `${gates.length} gate(s) in the CI set, ${KG_CRITERIA.length} kg-audit criteria)`,
  );
  if (universe.declaredOnly.length > 0) {
    console.log(`  · ${universe.declaredOnly.length} kind(s) declared by an instance and NOT in the registry: ${universe.declaredOnly.join(", ")}`);
  }
  console.log("");

  const byState = (s: KindState): KindCoverage[] => rows.filter((r) => r.state === s);
  const pad = (s: string, n: number): string => (s.length >= n ? s : s + " ".repeat(n - s.length));
  const num = (n: number, w: number): string => " ".repeat(Math.max(0, w - String(n).length)) + String(n);

  console.log(`    ${pad("kind", 20)} ${" ".repeat(1)}files  crit  gates  sidecars  state`);
  for (const r of rows) {
    const mark = r.state === "unaudited" ? "✗" : r.state === "no-directory" ? "·" : r.state === "empty" ? "·" : "✓";
    console.log(
      `  ${mark} ${pad(r.kind, 20)} ${num(r.files, 6)} ${num(r.criteria.length, 5)} ${num(r.gates.length, 6)} ${num(r.sidecars, 9)}  ${r.state}`,
    );
  }
  console.log("");

  const unaudited = byState("unaudited");
  if (unaudited.length > 0) {
    console.log(`✗ ${unaudited.length} kind(s) hold files that NO criterion and NO gate reach:`);
    for (const r of unaudited) console.log(`    · ${r.kind}: ${r.files} file(s) under ${r.directories.join(", ")}`);
  } else {
    console.log("✓ every kind with files is reached by a criterion or a declared gate");
  }

  const undeclared = gates.filter((g) => g.state === "undeclared");
  const noScript = gates.filter((g) => g.state === "no-script");
  const none = gates.filter((g) => g.state === "none");
  const computed = gates.filter((g) => g.state === "computed");
  const declared = gates.filter((g) => g.state === "declared");
  console.log(
    `\nGates: ${declared.length} declare a kind · ${none.length} declare @covers none · ` +
      `${computed.length} compute their set · ${noScript.length} run no script here · ` +
      `${undeclared.length} have NOT said`,
  );
  if (undeclared.length > 0) {
    const msg =
      `${undeclared.length} gate(s) declare no coverage. A kind they audit reads here as ` +
      `uncovered, so every "unaudited" above is an UPPER bound, not a verdict`;
    console.log(requireAll ? `✗ ${msg}:` : `⚠ ${msg}:`);
    for (const g of undeclared.slice(0, 12)) console.log(`    · ${g.command} — ${g.why}`);
    if (undeclared.length > 12) console.log(`    · …and ${undeclared.length - 12} more (see the sidecar)`);
  }

  const result = buildQaResult({
    script: relative(REPO, join(ROOT, "scripts", "audit-coverage.ts")),
    scriptAbsPath: join(ROOT, "scripts", "audit-coverage.ts"),
    subject: { kind: "audit-coverage", id: "graph-kinds" },
    families: {
      "kinds-unaudited": {
        summary:
          `A declared kind whose directories hold files that no kg-audit criterion and no gate ` +
          `declaring @covers reaches. An UPPER bound while gates remain undeclared: ` +
          `${undeclared.length} of ${gates.length} gate(s) have not said what they cover.`,
        entries: unaudited.map((r) => ({ kind: r.kind, directories: r.directories })),
      },
      "kinds-no-directory": {
        summary:
          `No instance declares a directory of this kind — a nested kind reached through its ` +
          `parent (\`bean-defs\` inside \`beans/\`), or one this repository does not have. Recorded ` +
          `so it cannot be read as a coverage gap, and so a kind that LOSES its directory shows up.`,
        entries: byState("no-directory").map((r) => ({ kind: r.kind, criteria: r.criteria.length, gates: r.gates })),
      },
      "kinds-empty": {
        summary:
          "A directory of this kind exists and holds no countable file. A determined empty, not an absent answer.",
        entries: byState("empty").map((r) => ({ kind: r.kind, directories: r.directories })),
      },
      "gates-undeclared": {
        summary:
          `A gate CI runs whose script carries no @covers line. Reported and never failed by ` +
          `default (--require-all fails it): the gap is real, and hiding it would render an ` +
          `unmeasured corpus as clean.`,
        entries: undeclared.map((g) => ({ command: g.command, scripts: g.scripts, why: g.why })),
      },
      // Not findings. The MEASUREMENT, committed, so a reader with only the file
      // can tell "audited clean" from "never audited" — which is the whole
      // reason this is a sidecar rather than console output.
      "coverage-measured": {
        summary:
          `Every declared kind with its four counts and its state. Not findings: the measurement ` +
          `itself, so the committed record answers "what audits this kind" without rerunning ` +
          `anything. The file COUNTS are printed rather than recorded — a census moves on any ` +
          `commit and a gate keyed on it is stale by default; \`hasFiles\` carries the only ` +
          `thing it decides. ${rows.length} of ${declaredKindCount} declared kind(s), ` +
          `${gates.length} gate(s), ${KG_CRITERIA.length} criteria.`,
        entries: rows.map(asRecord),
      },
    },
  });

  // Read the committed state BEFORE writing, and under `--check` do not write
  // at all — see the docblock. The writer is `audit:coverage`; this is the gate.
  // The INSTANCE root, not the repository root. `QA_RESULTS_DIR` is declared as
  // this instance's `qa-results` graph, and `check:undeclared-files` is what
  // caught the first version writing to `<repo>/test/results/` — a directory no
  // declaration names, so every consumer scanning the declared graphs would have
  // read a clean run over the one file this script exists to produce. The `dh4f`
  // defect, committed by the script whose whole subject is coverage.
  const state = sidecarState(ROOT, result);
  if (!check) writeQaResult(ROOT, "audit-coverage", result);
  if (state !== "current") {
    const where = relative(REPO, join(ROOT, QA_RESULTS_DIR, "audit-coverage.qa-results.json"));
    const msg = state === "absent" ? `no committed sidecar at ${where}` : `the committed sidecar at ${where} disagrees with this run`;
    console.log(check ? `\n✗ ${msg} — run \`bun run audit:coverage\` and commit it.` : `\n· ${msg} — written.`);
  }

  if (check && state !== "current") return 1;
  if (strict && unaudited.length > 0) return 1;
  if (requireAll && undeclared.length > 0) return 1;
  return 0;
}

if (import.meta.main) process.exit(main());
