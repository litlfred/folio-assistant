#!/usr/bin/env bun
/**
 * Does a computation still reproduce its committed witness?
 *
 * @module cat-harness-tools/scripts/witness-parity
 *
 * Story T4 of the qou tools migration (bean `qou-a3l1` depends on it), and the
 * owner's ruling of 2026-10-04: *"all witnesses tools will need to go into the
 * KG"*. Before a producer is declared as a Tool whose output is a witness node,
 * this is how anyone checks that running the Tool actually yields that node.
 *
 * Given a witness, it:
 *
 * 1. reads how to re-run its producer (`invocation.reproduce`, else
 *    `python3 <scriptFile>`) and the package versions it recorded
 *    (`environment`);
 * 2. compares those versions with what is installed, and stops at **unknown**
 *    when they differ. A witness computed under other versions is not a
 *    reproduction test, and running it anyway would report version drift as a
 *    defect in the producer;
 * 3. checks the COMMITTED tree out into a scratch `git worktree`, sparse to the
 *    directories the run needs, and runs the producer there. Whatever the
 *    producer writes lands in the scratch tree, so the folio's own checkout is
 *    untouched by construction rather than by cleaning up afterwards;
 * 4. stops at **unknown** if the re-run's OWN `environment` differs from the
 *    committed one. A build fingerprint or an interpreter patch level is
 *    recorded by the producer, not discoverable beforehand, and calibration
 *    found a run under the same package versions but another native build
 *    whose values moved at the 60th digit;
 * 5. compares the rewritten witness with the committed one, both with
 *    {@link WITNESS_EPHEMERAL_FIELDS} masked at every depth.
 *
 * | verdict | means |
 * |---|---|
 * | `pass` | the producer ran cleanly and wrote the same witness |
 * | `fail` | it ran cleanly and wrote a DIFFERENT witness; the differing paths are listed |
 * | `unknown` | it could not be decided: environment mismatch before or after the run, no reproduce command, a non-zero exit, a timeout, or no witness written |
 *
 * A non-zero exit is `unknown`, never `fail`, because folio producers refuse
 * by design (a precision floor not met, a guard raised) and explain it on
 * stdout; the reason is reported for a person to read.
 *
 * It tests the COMMITTED producer and witness at `HEAD`, so commit first.
 *
 *   bun run witness:parity <witness.json> [...]   # from the folio root
 *   bun run witness:parity --json <witness.json>
 *   options: --timeout <s> (300) · --dirs a,b (sparse dirs; default the
 *            producer's and witness's top-level dirs, plus `tools` and
 *            `scripts` where they exist) · --ignore f1,f2 (extra masked keys)
 *            · --force (run even on an environment mismatch; the verdict is
 *            then advisory and says so)
 *
 * Exit 1 when any verdict is `fail`; `unknown` alone exits 0.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, resolve } from "node:path";
import { stripEphemeral } from "../../cat-harness/schemas/computation-witness.ts";
import { findContentRepoRoot } from "../../cat-harness/content/pipeline/repo-root";

export type Verdict = "pass" | "fail" | "unknown";
export interface ParityResult {
  witness: string;
  verdict: Verdict;
  reason: string;
  /** Environment keys whose installed value differs from the recorded one. */
  envMismatch?: { key: string; recorded: string; installed: string | null }[];
  /** First differing JSON paths, on `fail`. */
  diff?: string[];
  forced?: true;
}

/** Keys of an `environment` block that are build fingerprints, not package versions. */
const NOT_A_PACKAGE = /_build$|^platform$|^os$|^machine$|^hostname$/;

/** Installed versions for `names`, via one python process; `python` is the interpreter's own version. */
export function installedVersions(names: string[], python = "python3"): Record<string, string | null> {
  const code = [
    "import json, sys, importlib.metadata as m",
    "out = {}",
    "for n in json.loads(sys.argv[1]):",
    "    if n == 'python': out[n] = '.'.join(map(str, sys.version_info[:3])); continue",
    "    v = None",
    "    for cand in (n, n.replace('_', '-'), n.replace('-', '_')):",
    "        try: v = m.version(cand); break",
    "        except Exception: pass",
    "    out[n] = v",
    "print(json.dumps(out))",
  ].join("\n");
  const r = spawnSync(python, ["-c", code, JSON.stringify(names)], { encoding: "utf8" });
  if (r.status !== 0) return Object.fromEntries(names.map((n) => [n, null]));
  return JSON.parse(r.stdout) as Record<string, string | null>;
}

/** Recorded-vs-installed mismatches for a witness's `environment` block. */
export function environmentMismatch(
  env: unknown,
  installed: (names: string[]) => Record<string, string | null> = installedVersions,
): { key: string; recorded: string; installed: string | null }[] {
  if (!env || typeof env !== "object") return [];
  const rec = Object.entries(env as Record<string, unknown>).filter(
    ([k, v]) => typeof v === "string" && !NOT_A_PACKAGE.test(k),
  ) as [string, string][];
  const have = installed(rec.map(([k]) => k));
  return rec.filter(([k, v]) => have[k] !== v).map(([k, v]) => ({ key: k, recorded: v, installed: have[k] ?? null }));
}

/** Up to `limit` JSON paths at which `a` and `b` differ (key order ignored). */
export function diffPaths(a: unknown, b: unknown, path = "$", out: string[] = [], limit = 20): string[] {
  if (out.length >= limit) return out;
  if (a === b) return out;
  const ta = Array.isArray(a) ? "array" : typeof a;
  const tb = Array.isArray(b) ? "array" : typeof b;
  if (ta !== tb || a === null || b === null || ta !== "object" && ta !== "array") {
    out.push(path);
    return out;
  }
  if (ta === "array") {
    const x = a as unknown[], y = b as unknown[];
    if (x.length !== y.length) out.push(`${path} (length ${x.length} → ${y.length})`);
    for (let i = 0; i < Math.min(x.length, y.length); i++) diffPaths(x[i], y[i], `${path}[${i}]`, out, limit);
    return out;
  }
  const x = a as Record<string, unknown>, y = b as Record<string, unknown>;
  for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) {
    if (!(k in x) || !(k in y)) out.push(`${path}.${k} (${k in x ? "removed" : "added"})`);
    else diffPaths(x[k], y[k], `${path}.${k}`, out, limit);
    if (out.length >= limit) break;
  }
  return out;
}

function git(cwd: string, ...args: string[]) {
  return spawnSync("git", args, { cwd, encoding: "utf8" });
}

/** Run one witness's producer in a scratch worktree and compare. */
export function checkParity(
  root: string,
  witnessPath: string,
  opts: { timeoutS?: number; dirs?: string[]; ignore?: Set<string>; force?: boolean } = {},
): ParityResult {
  const rel = relative(root, resolve(root, witnessPath));
  const committed = git(root, "show", `HEAD:${rel}`);
  if (committed.status !== 0) return { witness: rel, verdict: "unknown", reason: "witness is not committed at HEAD" };
  let w: Record<string, unknown>;
  try {
    w = JSON.parse(committed.stdout) as Record<string, unknown>;
  } catch {
    return { witness: rel, verdict: "unknown", reason: "committed witness is not strict JSON" };
  }
  const inv = w.invocation as { reproduce?: unknown } | undefined;
  const scriptFile = typeof w.scriptFile === "string" ? w.scriptFile : undefined;
  const reproduce =
    typeof inv?.reproduce === "string" ? inv.reproduce : scriptFile ? `python3 ${scriptFile.includes("/") ? scriptFile : join(rel.split("/")[0]!, scriptFile)}` : undefined;
  if (!reproduce) return { witness: rel, verdict: "unknown", reason: "no invocation.reproduce and no scriptFile" };

  const mismatch = environmentMismatch(w.environment);
  if (mismatch.length && !opts.force) {
    return {
      witness: rel,
      verdict: "unknown",
      reason: `environment differs from the recorded one in ${mismatch.length} package(s); re-run with --force for an advisory result`,
      envMismatch: mismatch,
    };
  }

  const top = (p: string) => p.split("/")[0]!;
  const dirs = new Set(opts.dirs ?? [top(rel), ...(scriptFile?.includes("/") ? [top(scriptFile)] : []), "tools", "scripts"]);
  const scratch = mkdtempSync(join(tmpdir(), "witness-parity-"));
  const wt = join(scratch, "tree");
  try {
    if (git(root, "worktree", "add", "--detach", "--no-checkout", wt, "HEAD").status !== 0) {
      return { witness: rel, verdict: "unknown", reason: "could not create a scratch worktree" };
    }
    const present = [...dirs].filter((d) => git(root, "cat-file", "-e", `HEAD:${d}`).status === 0);
    git(wt, "sparse-checkout", "set", "--cone", ...present);
    if (git(wt, "checkout", "-q").status !== 0) return { witness: rel, verdict: "unknown", reason: "scratch checkout failed" };

    const run = spawnSync("bash", ["-c", reproduce], {
      cwd: wt,
      encoding: "utf8",
      timeout: (opts.timeoutS ?? 300) * 1000,
      env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
    });
    if (run.error && (run.error as NodeJS.ErrnoException).code === "ETIMEDOUT") {
      return { witness: rel, verdict: "unknown", reason: `producer did not finish within ${opts.timeoutS ?? 300}s` };
    }
    if (run.status !== 0) {
      const tail = `${run.stdout ?? ""}${run.stderr ?? ""}`.trim().split("\n").slice(-3).join(" | ");
      return { witness: rel, verdict: "unknown", reason: `producer exited ${run.status}: ${tail}` };
    }
    const outPath = join(wt, rel);
    if (!existsSync(outPath)) return { witness: rel, verdict: "unknown", reason: "producer exited 0 but wrote no witness at this path" };
    let fresh: unknown;
    try {
      fresh = JSON.parse(readFileSync(outPath, "utf8"));
    } catch {
      return { witness: rel, verdict: "unknown", reason: "rewritten witness is not strict JSON" };
    }
    // The run's OWN record of its environment is the authority, not the
    // pre-run check: that check can only ask Python for package versions,
    // and a build fingerprint (`pyhecke_native_build`) or an interpreter
    // patch level is recorded by the producer itself. Calibration on
    // litlfred/qou found exactly this: same package versions, a different
    // native build, and values differing at the 60th digit. Different
    // environment, so not a reproduction test: unknown, with the keys.
    const envAfter = diffPaths(w.environment ?? {}, (fresh as Record<string, unknown>).environment ?? {}, "environment");
    if (envAfter.length && !opts.force) {
      return {
        witness: rel,
        verdict: "unknown",
        reason: `the re-run recorded a different environment (${envAfter.join(", ")}); re-run with --force for an advisory comparison`,
      };
    }
    const d = diffPaths(stripEphemeral(w, opts.ignore), stripEphemeral(fresh, opts.ignore));
    const forced = mismatch.length || envAfter.length ? ({ forced: true } as const) : {};
    if (git(wt, "diff", "--quiet", "--", rel).status === 0 || d.length === 0) {
      return { witness: rel, verdict: "pass", reason: "reproduced (run-specific fields masked)", ...forced };
    }
    return { witness: rel, verdict: "fail", reason: `differs at ${d.length}${d.length >= 20 ? "+" : ""} path(s)`, diff: d, ...forced };
  } finally {
    git(root, "worktree", "remove", "--force", wt);
    rmSync(scratch, { recursive: true, force: true });
  }
}

function main(): number {
  const argv = process.argv.slice(2);
  const val = (f: string) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : undefined);
  const flagsWithValue = new Set(["--timeout", "--dirs", "--ignore"]);
  const files = argv.filter((a, i) => !a.startsWith("--") && !flagsWithValue.has(argv[i - 1] ?? ""));
  if (!files.length) {
    console.error("usage: witness:parity [--json] [--timeout s] [--dirs a,b] [--ignore f,g] [--force] <witness.json> ...");
    return 2;
  }
  const root = findContentRepoRoot();
  const opts = {
    timeoutS: val("--timeout") ? Number(val("--timeout")) : undefined,
    dirs: val("--dirs")?.split(",").filter(Boolean),
    ignore: new Set(val("--ignore")?.split(",").filter(Boolean) ?? []),
    force: argv.includes("--force"),
  };
  const results = files.map((f) => checkParity(root, isAbsolute(f) ? relative(root, f) : f, opts));
  if (argv.includes("--json")) console.log(JSON.stringify(results, null, 2));
  else
    for (const r of results) {
      console.log(`${r.verdict.padEnd(7)} ${r.witness} — ${r.reason}${r.forced ? " [advisory: --force over an environment mismatch]" : ""}`);
      for (const m of r.envMismatch ?? []) console.log(`          ${m.key}: recorded ${m.recorded}, installed ${m.installed ?? "absent"}`);
      for (const p of r.diff ?? []) console.log(`          ${p}`);
    }
  return results.some((r) => r.verdict === "fail") ? 1 : 0;
}

if (import.meta.main) process.exit(main());
