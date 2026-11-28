#!/usr/bin/env bun
/**
 * `bun run cat lint:report` — how many findings each per-language linter has
 * in each layer, counted and never judged.
 *
 * ```sh
 * bun run cat lint:report                                   # every layer of this checkout
 * bun run cat lint:report -- --instance ./cat-harness       # one layer
 * bun run cat lint:report -- --out test/results/lint/x.lint.json --json
 * bun run cat lint:report -- --write-baseline cat-harness-tools/.github/lint-baseline.json
 * ```
 *
 * The lint baseline of 2026-11-28 found these linters running nowhere for the
 * Python, shell and workflow files of the platform layers. The rules each
 * language must meet are cat-harness `language-expectations`. This is their
 * REPORT: the first rollout step, in which nothing turns red.
 *
 * | measure | command |
 * |---|---|
 * | `ruff:must-pass` | `ruff check --config <this layer>/ruff.toml` (E9, F63, F7, F82, F401, F403) |
 * | `ruff:classic` | the same, `--select E4,E7,E9,F` (the ratchet's next set) |
 * | `shellcheck:error` | `shellcheck -S error` on every `.sh` file |
 * | `shellcheck:all` | `shellcheck` at its default severity |
 * | `actionlint` | `actionlint` (1.7.12 or later) on each `.github/workflows/`, its shellcheck at `-S error` |
 *
 * Every finding is counted against the layer whose directory holds it, and
 * against `.` when no layer does. A tool that is not installed reads `null`
 * (not measured), never 0. Rust and Lean are not here: clippy needs a cargo
 * build and runLinter a Lake build, which a report on every PR cannot pay
 * for. They are the folio's lint gates.
 *
 * ## A report, not a gate
 *
 * It ALWAYS exits 0, whatever it counted and even when a tool failed: the
 * failure is printed as "could not measure". It is declared in
 * `.github/scripts/layer-pr-checks/root-gates.json` as `root:lint:report`, so
 * every layer PR records its counts over the composed tree with the PR
 * swapped in. A gate that exits 0 is never a new failure there. It prints only
 * a count table, so `gate_diagnostics.py` reads no finding from it.
 *
 * With `--baseline <file>` (default: `.github/lint-baseline.json` beside this
 * script's layer, when present) it prints each count's change against the
 * committed baseline. A later ratchet fails only when a count rises, and
 * promotes a rule into `ruff.toml`'s `select` once its count is zero.
 *
 * Flags: `--root <checkout>` (default: cwd) · `--instance <dir>` (one layer) ·
 * `--out <file>` (write the JSON report) · `--json` (print it) ·
 * `--baseline <file>` · `--write-baseline <file>`.
 *
 * @module scripts/lint-report
 * @covers none — it counts linter findings in the files of every layer, not any one graph's content
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";

import { layerRootsIn } from "../schemas/kg/instance-roots.ts";
import { actionlintNewEnough, onPath } from "./precheck.ts";

export const LINT_REPORT_SCHEMA = "cat-lint-report/v1";
export const LINT_BASELINE_SCHEMA = "cat-lint-baseline/v1";
export const MEASURES = ["ruff:must-pass", "ruff:classic", "shellcheck:error", "shellcheck:all", "actionlint"] as const;
export type Measure = (typeof MEASURES)[number];

/** One measure in one layer: the total and the count per rule; `null` when the tool could not measure. */
export type Count = { total: number; rules: Record<string, number> } | null;
export interface LintReport {
  $schema: typeof LINT_REPORT_SCHEMA;
  measuredAt: string;
  tools: Record<"ruff" | "shellcheck" | "actionlint", string | null>;
  notes: string[];
  layers: Record<string, Partial<Record<Measure, Count>>>;
}

/** Directories no linter reads: dependencies, build output and caches. */
const SKIP_DIRS = new Set(["node_modules", ".git", "target", ".lake", "lake-packages", "build", "dist", "_site", ".venv", "venv", "__pycache__", ".cache"]);

/** Every `.sh` file under `dir`, skipping SKIP_DIRS and following each real directory once. */
export function shellFiles(dir: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const walk = (d: string) => {
    let real: string;
    try {
      real = realpathSync(d);
    } catch {
      return;
    }
    if (seen.has(real)) return;
    seen.add(real);
    let names: string[];
    try {
      names = readdirSync(d);
    } catch {
      return;
    }
    for (const n of names.sort()) {
      const p = join(d, n);
      let st;
      try {
        st = statSync(p);
      } catch {
        continue;
      }
      if (st.isDirectory()) {
        if (!SKIP_DIRS.has(n)) walk(p);
      } else if (n.endsWith(".sh")) out.push(p);
    }
  };
  walk(dir);
  return out;
}

/** The layer (path relative to the root, `.` for none) whose directory holds `file`: the longest root that contains it. */
export function layerOf(file: string, layers: readonly string[], root: string): string {
  let best: string | undefined;
  for (const l of layers) {
    if (l === root) continue;
    if ((file === l || file.startsWith(l + sep)) && (best === undefined || l.length > best.length)) best = l;
  }
  if (best !== undefined) return relative(root, best);
  // A checkout that is itself a layer (a layer cloned on its own) is named for its directory.
  return layers.includes(root) ? basename(root) : ".";
}

function add(into: Partial<Record<Measure, Count>>, m: Measure, rule: string) {
  const c = (into[m] ??= { total: 0, rules: {} })!;
  c.total += 1;
  c.rules[rule] = (c.rules[rule] ?? 0) + 1;
}

/** ruff's JSON output, as `[file, code]` pairs. */
export function parseRuff(json: string): Array<[string, string]> {
  const rows = JSON.parse(json || "[]") as Array<{ filename?: string; code?: string | null }>;
  return rows.map((r) => [r.filename ?? "", r.code ?? "syntax"]);
}

/** shellcheck's `json1` output, as `[file, level, code]` triples. */
export function parseShellcheck(json: string): Array<[string, string, string]> {
  const doc = JSON.parse(json || '{"comments":[]}') as { comments?: Array<{ file: string; level: string; code: number }> };
  return (doc.comments ?? []).map((c) => [c.file, c.level, `SC${c.code}`]);
}

const firstLine = (s: string | undefined) => (s ?? "").split("\n")[0]!.trim();

/** Count every measure over `targets` (absolute directories), bucketed by layer. Never throws for a tool's failure. */
export function measure(root: string, targets: readonly string[], layers: readonly string[], env: NodeJS.ProcessEnv, ruffConfig: string): LintReport {
  const report: LintReport = { $schema: LINT_REPORT_SCHEMA, measuredAt: new Date().toISOString(), tools: { ruff: null, shellcheck: null, actionlint: null }, notes: [], layers: {} };
  const bucket = (rel: string) => (report.layers[rel] ??= {});
  // The layers measured: every layer and `.` when the whole checkout is a target, else each target's own.
  const scope = [...new Set(targets.flatMap((t) => (t === root ? [layerOf(root, layers, root), ...layers.filter((l) => l !== root).map((l) => relative(root, l))] : [layerOf(t, layers, root)])))];
  // Every target layer is listed, so a clean one reads 0 rather than being absent.
  const zeroFor = (m: Measure) => {
    for (const s of scope) bucket(s)[m] ??= { total: 0, rules: {} };
  };
  const unmeasured = (m: Measure, why: string) => {
    for (const s of scope) bucket(s)[m] = null;
    report.notes.push(`${m}: not measured (${why})`);
  };

  const ruff = onPath("ruff", env);
  if (!ruff) {
    unmeasured("ruff:must-pass", "ruff is not installed");
    unmeasured("ruff:classic", "ruff is not installed");
  } else if (!existsSync(ruffConfig)) {
    unmeasured("ruff:must-pass", `no ${ruffConfig}`);
    unmeasured("ruff:classic", `no ${ruffConfig}`);
  } else {
    report.tools.ruff = firstLine(spawnSync(ruff, ["--version"], { encoding: "utf-8", env }).stdout).replace(/^ruff\s+/, "") || "unknown";
    for (const [m, extra] of [["ruff:must-pass", []], ["ruff:classic", ["--select", "E4,E7,E9,F"]]] as const) {
      const r = spawnSync(ruff, ["check", "--config", ruffConfig, ...extra, "--no-cache", "--no-respect-gitignore", "--exit-zero", "--output-format", "json", ...targets], { cwd: root, encoding: "utf-8", env, maxBuffer: 1 << 30 });
      try {
        if (r.status !== 0) throw new Error(firstLine(r.stderr) || `exit ${r.status}`);
        zeroFor(m);
        for (const [file, code] of parseRuff(r.stdout)) add(bucket(layerOf(resolve(root, file), layers, root)), m, code);
      } catch (e) {
        unmeasured(m, `ruff failed: ${(e as Error).message}`);
      }
    }
  }

  const sc = onPath("shellcheck", env);
  if (!sc) {
    unmeasured("shellcheck:error", "shellcheck is not installed");
    unmeasured("shellcheck:all", "shellcheck is not installed");
  } else {
    report.tools.shellcheck = (/version:\s*(\S+)/.exec(spawnSync(sc, ["--version"], { encoding: "utf-8", env }).stdout ?? "")?.[1]) ?? "unknown";
    zeroFor("shellcheck:error");
    zeroFor("shellcheck:all");
    const files = targets.flatMap(shellFiles);
    try {
      for (let i = 0; i < files.length; i += 200) {
        const r = spawnSync(sc, ["-f", "json1", ...files.slice(i, i + 200)], { cwd: root, encoding: "utf-8", env, maxBuffer: 1 << 30 });
        if (r.status !== 0 && r.status !== 1) throw new Error(firstLine(r.stderr) || `exit ${r.status}`);
        for (const [file, level, code] of parseShellcheck(r.stdout)) {
          const b = bucket(layerOf(resolve(root, file), layers, root));
          add(b, "shellcheck:all", code);
          if (level === "error") add(b, "shellcheck:error", code);
        }
      }
    } catch (e) {
      unmeasured("shellcheck:error", `shellcheck failed: ${(e as Error).message}`);
      unmeasured("shellcheck:all", `shellcheck failed: ${(e as Error).message}`);
    }
  }

  const al = onPath("actionlint", env);
  const alVersion = al ? firstLine(spawnSync(al, ["-version"], { encoding: "utf-8", env }).stdout) : "";
  if (!al) unmeasured("actionlint", "actionlint is not installed");
  else if (!actionlintNewEnough(alVersion)) unmeasured("actionlint", `actionlint ${alVersion || "(unknown version)"} is older than 1.7.12`);
  else {
    report.tools.actionlint = alVersion;
    zeroFor("actionlint");
    // Each layer's own workflows, and the root's when the whole checkout is measured.
    const homes = [...new Set(targets.flatMap((t) => (t === root ? [root, ...layers] : [t])))];
    for (const home of homes) {
      const dir = join(home, ".github", "workflows");
      let files: string[] = [];
      try {
        files = readdirSync(dir).filter((n) => /\.ya?ml$/.test(n)).sort().map((n) => join(".github", "workflows", n));
      } catch {
        continue;
      }
      if (files.length === 0) continue;
      const r = spawnSync(al, ["-no-color", "-format", '{{range $err := .}}{{$err.Kind}};{{end}}', ...files], { cwd: home, encoding: "utf-8", env: { ...env, SHELLCHECK_OPTS: "-S error" }, maxBuffer: 1 << 30 });
      const rel = layerOf(home, layers, root);
      if (r.status !== 0 && r.status !== 1) {
        bucket(rel).actionlint = null;
        report.notes.push(`actionlint: not measured in ${rel} (exit ${r.status}: ${firstLine(r.stderr)})`);
        continue;
      }
      const b = bucket(rel);
      b.actionlint ??= { total: 0, rules: {} };
      for (const kind of (r.stdout ?? "").split(";").map((l) => l.trim()).filter(Boolean)) add(b, "actionlint", kind);
    }
  }
  return report;
}

/** A baseline: each layer's totals, keyed by the layer's directory name. */
export interface LintBaseline {
  $schema: typeof LINT_BASELINE_SCHEMA;
  _comment?: string;
  measuredAt: string;
  tools: LintReport["tools"];
  layers: Record<string, Partial<Record<Measure, number | null>>>;
}

export const keyOf = (rel: string) => (rel === "." ? "." : basename(rel));

/** The totals of `report`, as a baseline. */
export function baselineOf(report: LintReport, comment?: string, keep: LintBaseline["layers"] = {}): LintBaseline {
  const layers: LintBaseline["layers"] = { ...keep };
  for (const [rel, ms] of Object.entries(report.layers)) {
    const row: Partial<Record<Measure, number | null>> = {};
    for (const m of MEASURES) if (m in ms) row[m] = ms[m] === null ? null : ms[m]!.total;
    layers[keyOf(rel)] = row;
  }
  return { $schema: LINT_BASELINE_SCHEMA, ...(comment ? { _comment: comment } : {}), measuredAt: report.measuredAt, tools: report.tools, layers };
}

/** The count table: one row per layer, each count with its change against the baseline when one is recorded. */
export function table(report: LintReport, baseline?: LintBaseline): string {
  const lines = [`| layer | ${MEASURES.join(" | ")} |`, `|---|${MEASURES.map(() => "---:").join("|")}|`];
  for (const rel of Object.keys(report.layers).sort()) {
    const ms = report.layers[rel]!;
    const was = baseline?.layers[keyOf(rel)];
    const cell = (m: Measure) => {
      if (!(m in ms)) return "";
      const c = ms[m];
      if (c === null) return "not measured";
      const b = was?.[m];
      if (typeof b !== "number" || b === c!.total) return String(c!.total);
      const d = c!.total - b;
      return `${c!.total} (${d > 0 ? "+" : ""}${d} vs baseline)`;
    };
    lines.push(`| ${rel} | ${MEASURES.map(cell).join(" | ")} |`);
  }
  return lines.join("\n");
}

function flag(argv: readonly string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
}

export function main(argv: readonly string[], env: NodeJS.ProcessEnv): number {
  const root = resolve(flag(argv, "--root") ?? process.cwd());
  const layer = resolve(import.meta.dir, "..");
  const ruffConfig = join(layer, "ruff.toml");
  const baselinePath = flag(argv, "--baseline") ?? join(layer, ".github", "lint-baseline.json");
  try {
    const layers = layerRootsIn(root).map((l) => resolve(l));
    const inst = flag(argv, "--instance");
    const targets = inst ? [resolve(root, inst)] : [root];
    const report = measure(root, targets, layers, env, ruffConfig);
    let baseline: LintBaseline | undefined;
    try {
      baseline = JSON.parse(readFileSync(baselinePath, "utf-8")) as LintBaseline;
    } catch {
      /* no baseline yet: counts only */
    }
    const tools = Object.entries(report.tools).map(([k, v]) => `${k} ${v ?? "not installed"}`).join(", ");
    process.stdout.write(`lint:report (a report, never a gate; ${tools})\n\n${table(report, baseline)}\n`);
    for (const n of report.notes) process.stdout.write(`note: ${n}\n`);
    const out = flag(argv, "--out");
    if (out) {
      mkdirSync(dirname(resolve(out)), { recursive: true });
      writeFileSync(resolve(out), JSON.stringify(report, null, 2) + "\n");
    }
    if (argv.includes("--json")) process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    const write = flag(argv, "--write-baseline");
    if (write) {
      let prior: LintBaseline | undefined;
      try {
        prior = JSON.parse(readFileSync(write, "utf-8")) as LintBaseline;
      } catch {
        /* a new file */
      }
      writeFileSync(write, JSON.stringify(baselineOf(report, prior?._comment, prior?.layers), null, 2) + "\n");
    }
  } catch (e) {
    process.stdout.write(`lint:report: could not measure (${(e as Error).message}); a report, so this is not a failure\n`);
  }
  return 0;
}

if (import.meta.main) process.exit(main(process.argv.slice(2), process.env));
