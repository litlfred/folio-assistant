#!/usr/bin/env bun
/**
 * `bun run cat precheck` — the fast checks a push's own changes can break, run
 * before the push leaves the machine (owner, card 2026-11-18: every session
 * pushes as the owner's account, so every red CI run emails them).
 *
 * @module scripts/precheck
 * @covers none — a pre-push runner over checks that are gates elsewhere
 *
 * Only the checks whose inputs the push changed run, so a push that touches
 * none of them does nothing and goes at once. Target: 15–60 s.
 *
 * | the push changes | runs |
 * |---|---|
 * | `index.lock.json` or `index.config.json` | `lock:coherence:check` (agreement and freshness) and `mount:remote:check` |
 * | anything under `.github/workflows/` | `check:workflow-pins` |
 * | a `.ts` / `.tsx` / `.mts` / `.cts` file | `tsc --noEmit -p tsconfig.json`, with the checkout's own `tsc` |
 * | a `.py` file | `ruff check --config <this layer>/ruff.toml` on the changed `.py` files (the must-pass set) — ADVISORY |
 * | a `.sh` file | `shellcheck -S error` on the changed `.sh` files — ADVISORY |
 * | a workflow (`.github/workflows/*.yml`) | `actionlint` (1.7.12 or later) on the changed workflows, its embedded shellcheck at `-S error` — ADVISORY |
 * | a `.rs` file | `cargo fmt --check` for each crate a changed `.rs` file is in — ADVISORY |
 *
 * ## The lint checks are advisory
 *
 * The last four rows are the per-language linters of the lint baseline
 * (2026-11-28; cat-harness `language-expectations`). They run on the files the
 * push changed and on nothing else, and they are ADVISORY: a finding is
 * printed with the tool's own output and never refuses the push, because the
 * rollout is report-first and nothing that is green today may turn red. A
 * check is promoted to a refusal by setting `advisory: false` in `lintPlanFor`
 * once its rule is at zero and gated in CI. Each tool is looked up on `PATH`;
 * one that is not installed (or an `actionlint` older than 1.7.12) is skipped
 * with a one-line note, never fetched.
 *
 * `mount:remote:check` asks whether the mounts follow the lock, which only a
 * change to the lock or the config can move, so it runs with the lock checks.
 * The full tier never runs here: CI runs it on a `release` / `ready-to-merge`
 * PR.
 *
 * ## Never in the way of a push it cannot judge
 *
 * Every one of these prints ONE line and lets the push through (exit 0); it
 * never installs anything:
 *   - no `cat` runner in the checkout's `package.json`, or no `node_modules`
 *     (a layer cloned on its own, or a checkout not set up);
 *   - no `tsc` in `node_modules/.bin` (the typecheck is skipped, not fetched);
 *   - the pushed commit is not `HEAD`, or tracked files differ from `HEAD`
 *     (the checks would judge a tree that is not being pushed);
 *   - a check exits 2 (could not determine, or the runner has no such script)
 *     or runs past its time (`CAT_PRECHECK_TIMEOUT` seconds, default 90).
 * Without bun, the hook itself (`scripts/git-hooks/pre-push`) says so and
 * lets the push through.
 *
 * A check that exits 1 is red: the push is refused, with the check's output.
 * `git push --no-verify` skips the hook; `CAT_PRECHECK=0` turns it off.
 *
 * ## Entry points
 *
 *   bun run cat precheck                 # what HEAD would push: against @{upstream}, else origin/main
 *   bun run cat precheck --dry-run       # print the plan, run nothing
 *   bun run cat precheck --git-hook <remote>   # git's pre-push hook; the pushed refs come on stdin
 *
 * The hook is installed by `scripts/git-hooks/install.sh` (layer init) and by
 * the session-start primer (`scripts/session-start-coord-sweep.sh`), which
 * agent containers run and which never ran `install.sh`.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

/** One check the push owes. */
export interface Check {
  /** What it is called in the output. */
  name: string;
  /** The command, run from the checkout root. */
  argv: string[];
  /** Why this push owes it. */
  why: string;
  /** A finding is printed and never refuses the push (the report-first lint checks). */
  advisory?: boolean;
  /** Extra environment for the command. */
  env?: Record<string, string>;
}

const ZERO = /^0+$/;
const TS = /\.(?:ts|tsx|mts|cts)$/;
const LOCK = /(?:^|\/)index\.(?:lock|config)\.json$/;
const WORKFLOWS = /^\.github\/workflows\//;

/** The checks a push changing `paths` owes, in order; none when it owes none. */
export function planFor(paths: readonly string[], opts: { tsc?: string } = {}): Check[] {
  const plan: Check[] = [];
  const lock = paths.filter((p) => LOCK.test(p));
  if (lock.length) {
    const why = `changes ${lock.slice(0, 3).join(", ")}${lock.length > 3 ? ", …" : ""}`;
    plan.push({ name: "lock:coherence:check", argv: ["bun", "run", "cat", "lock:coherence:check"], why });
    plan.push({ name: "mount:remote:check", argv: ["bun", "run", "cat", "mount:remote:check"], why });
  }
  const wf = paths.filter((p) => WORKFLOWS.test(p));
  if (wf.length) plan.push({ name: "check:workflow-pins", argv: ["bun", "run", "cat", "check:workflow-pins"], why: `changes ${wf.length} file(s) under .github/workflows` });
  const ts = paths.filter((p) => TS.test(p));
  if (ts.length && opts.tsc !== undefined) plan.push({ name: "typecheck", argv: [opts.tsc, "--noEmit", "-p", "tsconfig.json"], why: `changes ${ts.length} TypeScript file(s)` });
  return plan;
}

/** Whether `paths` holds a TypeScript change (the plan leaves the typecheck out without a `tsc`). */
export const touchesTs = (paths: readonly string[]): boolean => paths.some((p) => TS.test(p));

const PY = /\.py$/;
const SH = /\.sh$/;
const RS = /\.rs$/;
const WORKFLOW_FILE = /^\.github\/workflows\/[^/]+\.ya?ml$/;
/** The oldest actionlint whose findings the baseline was measured with. */
export const ACTIONLINT_MIN = [1, 7, 12] as const;

/** The linters found for the lint checks; a missing one is skipped with a note. */
export interface LintTools {
  ruff?: string;
  /** This layer's shared `ruff.toml` (the must-pass rule set). */
  ruffConfig?: string;
  shellcheck?: string;
  actionlint?: string;
  /** Why `actionlint` is unusable when it is on PATH but too old. */
  actionlintTooOld?: string;
  /** `cargo` with a working `cargo fmt`. */
  cargo?: string;
}

/**
 * The advisory lint checks a push changing `paths` owes, and a note for each
 * language it touched whose tool is missing. `paths` are the changed files
 * that still exist; `crateOf` maps a `.rs` file to its crate's `Cargo.toml`.
 */
export function lintPlanFor(paths: readonly string[], tools: LintTools, crateOf: (p: string) => string | undefined = () => undefined): { checks: Check[]; notes: string[] } {
  const checks: Check[] = [];
  const notes: string[] = [];
  const files = (n: number, what: string) => `changes ${n} ${what} file(s)`;
  const py = paths.filter((p) => PY.test(p));
  if (py.length) {
    if (tools.ruff && tools.ruffConfig) checks.push({ name: "ruff", argv: [tools.ruff, "check", "--config", tools.ruffConfig, "--no-cache", "--force-exclude", ...py], why: files(py.length, "Python"), advisory: true });
    else notes.push(`Python changed, but ${tools.ruff ? "this layer has no ruff.toml" : "ruff is not installed"}: the ruff check is skipped`);
  }
  const sh = paths.filter((p) => SH.test(p));
  if (sh.length) {
    if (tools.shellcheck) checks.push({ name: "shellcheck", argv: [tools.shellcheck, "-S", "error", ...sh], why: files(sh.length, "shell"), advisory: true });
    else notes.push("shell scripts changed, but shellcheck is not installed: the shellcheck check is skipped");
  }
  const wf = paths.filter((p) => WORKFLOW_FILE.test(p));
  if (wf.length) {
    if (tools.actionlint) checks.push({ name: "actionlint", argv: [tools.actionlint, "-no-color", ...wf], why: files(wf.length, "workflow"), advisory: true, env: { SHELLCHECK_OPTS: "-S error" } });
    else notes.push(`workflows changed, but ${tools.actionlintTooOld ?? "actionlint is not installed"}: the actionlint check is skipped`);
  }
  const rs = paths.filter((p) => RS.test(p));
  if (rs.length) {
    const crates = [...new Set(rs.map(crateOf).filter((c): c is string => c !== undefined))].sort();
    if (!tools.cargo) notes.push("Rust changed, but cargo with rustfmt is not installed: the rustfmt check is skipped");
    else for (const manifest of crates) checks.push({ name: `rustfmt ${manifest}`, argv: [tools.cargo, "fmt", "--check", "--manifest-path", manifest], why: `changes .rs file(s) of ${manifest}`, advisory: true });
  }
  return { checks, notes };
}

/** `actionlint -version`'s first line, read as a version at least `ACTIONLINT_MIN`. */
export function actionlintNewEnough(versionLine: string): boolean {
  const m = /(\d+)\.(\d+)\.(\d+)/.exec(versionLine);
  if (!m) return false;
  const v = [Number(m[1]), Number(m[2]), Number(m[3])];
  for (let i = 0; i < 3; i++) if (v[i] !== ACTIONLINT_MIN[i]) return v[i]! > ACTIONLINT_MIN[i]!;
  return true;
}

/** `bin` on `env.PATH`, as an absolute path; undefined when it is not there. */
export function onPath(bin: string, env: NodeJS.ProcessEnv): string | undefined {
  for (const dir of (env.PATH ?? "").split(":")) {
    if (!dir) continue;
    const p = join(dir, bin);
    try {
      if (statSync(p).isFile()) return p;
    } catch {
      /* not here */
    }
  }
  return undefined;
}

/** The linters this machine has, probed once; nothing is installed. */
export function findLintTools(env: NodeJS.ProcessEnv, ruffConfig: string): LintTools {
  const tools: LintTools = {};
  tools.ruff = onPath("ruff", env);
  if (existsSync(ruffConfig)) tools.ruffConfig = ruffConfig;
  tools.shellcheck = onPath("shellcheck", env);
  const al = onPath("actionlint", env);
  if (al) {
    const v = spawnSync(al, ["-version"], { encoding: "utf-8", env });
    const line = (v.stdout ?? "").split("\n")[0] ?? "";
    if (actionlintNewEnough(line)) tools.actionlint = al;
    else tools.actionlintTooOld = `actionlint ${line.trim() || "(unknown version)"} is older than ${ACTIONLINT_MIN.join(".")}`;
  }
  const cargo = onPath("cargo", env);
  if (cargo && spawnSync(cargo, ["fmt", "--version"], { encoding: "utf-8", env }).status === 0) tools.cargo = cargo;
  return tools;
}

/** The nearest `Cargo.toml` above `file` (repo-relative), without leaving `root`. */
export function crateManifest(root: string, file: string): string | undefined {
  let dir = dirname(file);
  for (;;) {
    const m = dir === "." ? "Cargo.toml" : `${dir}/Cargo.toml`;
    if (existsSync(join(root, m))) return m;
    if (dir === "." || dir === "" || dir === "/") return undefined;
    dir = dirname(dir);
  }
}

/** One line of git's pre-push stdin: `<local ref> <local sha> <remote ref> <remote sha>`. */
export interface PushedRef {
  localRef: string;
  localSha: string;
  remoteRef: string;
  remoteSha: string;
}

export function parsePushStdin(text: string): PushedRef[] {
  return text
    .split("\n")
    .map((l) => l.trim().split(/\s+/))
    .filter((f) => f.length === 4)
    .map(([localRef, localSha, remoteRef, remoteSha]) => ({ localRef: localRef!, localSha: localSha!, remoteRef: remoteRef!, remoteSha: remoteSha! }));
}

function git(root: string, args: string[]): string | undefined {
  const r = spawnSync("git", args, { cwd: root, encoding: "utf-8" });
  return r.status === 0 ? r.stdout.trim() : undefined;
}

/** What `commit` is compared against: the remote's tip when it has one here, else @{upstream}, else the merge base with origin. */
export function baseFor(root: string, commit: string, remoteSha?: string): string | undefined {
  const known = (c: string | undefined) => (c && !ZERO.test(c) && git(root, ["cat-file", "-e", `${c}^{commit}`]) !== undefined ? c : undefined);
  return (
    known(remoteSha) ??
    known(git(root, ["rev-parse", "--verify", "--quiet", "@{upstream}"])) ??
    known(git(root, ["merge-base", commit, "refs/remotes/origin/HEAD"])) ??
    known(git(root, ["merge-base", commit, "refs/remotes/origin/main"]))
  );
}

export type Outcome = { check: Check; status: "pass" | "red" | "advisory" | "undetermined"; detail: string; seconds: number };

/** Map a check's exit to its outcome: 0 passes, 2 or a timeout is undetermined, any other is red. */
export function outcomeOf(check: Check, r: { status: number | null; error?: Error; signal?: string | null }, out: string, seconds: number, timeoutS: number): Outcome {
  if (r.error && (r.error as NodeJS.ErrnoException).code === "ETIMEDOUT") return { check, status: "undetermined", detail: `ran past ${timeoutS}s`, seconds };
  if (r.error) return { check, status: "undetermined", detail: `could not start: ${r.error.message}`, seconds };
  if (r.status === 0) return { check, status: "pass", detail: "", seconds };
  if (r.status === 2 || r.status === null) return { check, status: "undetermined", detail: `exit ${r.status ?? r.signal} (could not determine)`, seconds };
  return { check, status: check.advisory ? "advisory" : "red", detail: out.trim().split("\n").slice(-25).join("\n"), seconds };
}

const say = (line: string) => process.stderr.write(`precheck: ${line}\n`);

/** Run the precheck from `root`; the exit code for the hook. */
export function run(root: string, argv: readonly string[], stdin: string, env: NodeJS.ProcessEnv): number {
  if (env.CAT_PRECHECK === "0") return say("off (CAT_PRECHECK=0)"), 0;
  const timeoutS = Number(env.CAT_PRECHECK_TIMEOUT) > 0 ? Number(env.CAT_PRECHECK_TIMEOUT) : 90;
  const hook = argv.includes("--git-hook");
  const dry = argv.includes("--dry-run");

  let pkg: { scripts?: Record<string, string> } = {};
  try {
    pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
  } catch {
    /* none */
  }
  if (typeof pkg.scripts?.cat !== "string" || !existsSync(join(root, "node_modules"))) {
    return say("this checkout is not set up (no `cat` runner or no node_modules), so no check ran; CI runs them"), 0;
  }

  const head = git(root, ["rev-parse", "HEAD"]);
  const refs = hook ? parsePushStdin(stdin).filter((r) => !ZERO.test(r.localSha)) : head ? [{ localRef: "HEAD", localSha: head, remoteRef: "", remoteSha: "" }] : [];
  if (refs.length === 0) return 0; // a delete, or nothing to push
  if (refs.some((r) => r.localSha !== head)) return say("the pushed commit is not HEAD, so the checks would judge another tree; none ran"), 0;
  if (git(root, ["diff", "--quiet", "HEAD", "--"]) === undefined) return say("tracked files differ from HEAD, so the checks would judge a tree that is not being pushed; none ran"), 0;

  const paths = new Set<string>();
  let unknownBase = false;
  for (const r of refs) {
    const base = baseFor(root, r.localSha, r.remoteSha);
    if (base === undefined) {
      unknownBase = true;
      continue;
    }
    for (const p of (git(root, ["diff", "--name-only", base, r.localSha]) ?? "").split("\n")) if (p) paths.add(p);
  }
  if (unknownBase) return say("no base to diff the push against (no upstream, no origin/main here), so no check ran; CI runs them"), 0;

  const tscPath = join(root, "node_modules", ".bin", "tsc");
  const tsc = existsSync(join(root, "tsconfig.json")) && existsSync(tscPath) ? tscPath : undefined;
  const plan = planFor([...paths], { tsc });
  if (touchesTs([...paths]) && tsc === undefined) say("TypeScript changed, but there is no tsconfig.json or node_modules/.bin/tsc here: the typecheck is left to CI");
  // The advisory lint checks, on the changed files that still exist (a deleted file has nothing to lint).
  const present = [...paths].filter((p) => existsSync(join(root, p))).sort();
  if (present.some((p) => /\.(?:py|sh|rs)$/.test(p) || WORKFLOWS.test(p))) {
    const lint = lintPlanFor(present, findLintTools(env, join(import.meta.dir, "..", "ruff.toml")), (p) => crateManifest(root, p));
    for (const n of lint.notes) say(n);
    plan.push(...lint.checks);
  }
  if (plan.length === 0) return 0; // nothing this push changed is checked here: silent, at once
  if (dry) {
    for (const c of plan) process.stdout.write(`${c.name}\t${c.why}\t${c.argv.join(" ")}\n`);
    return 0;
  }

  const outcomes: Outcome[] = [];
  for (const c of plan) {
    const t0 = Date.now();
    const r = spawnSync(c.argv[0]!, c.argv.slice(1), { cwd: root, encoding: "utf-8", timeout: timeoutS * 1000, env: { ...env, ...c.env, CAT_PRECHECK: "0" } });
    const o = outcomeOf(c, r, `${r.stdout ?? ""}${r.stderr ?? ""}`, Math.round((Date.now() - t0) / 1000), timeoutS);
    outcomes.push(o);
    say(`${o.status === "pass" ? "✓" : o.status === "red" ? "✗" : o.status === "advisory" ? "!" : "?"} ${c.name} (${o.seconds}s; ${c.why})${o.status === "undetermined" ? ` — ${o.detail}; not a refusal` : o.status === "advisory" ? " — findings below; advisory, not a refusal" : ""}`);
  }
  for (const o of outcomes.filter((x) => x.status === "advisory")) process.stderr.write(`\n── ${o.check.name} (advisory) ──\n${o.detail}\n`);
  const red = outcomes.filter((o) => o.status === "red");
  if (red.length === 0) return 0;
  for (const o of red) process.stderr.write(`\n── ${o.check.name} ──\n${o.detail}\n`);
  say(`refused: ${red.map((o) => o.check.name).join(", ")} red on what this push changes. Fix it, or push anyway with \`git push --no-verify\`.`);
  return 1;
}

if (import.meta.main) {
  const root = git(process.cwd(), ["rev-parse", "--show-toplevel"]) ?? process.cwd();
  const stdin = process.argv.includes("--git-hook") ? readFileSync(0, "utf-8") : "";
  process.exit(run(root, process.argv.slice(2), stdin, process.env));
}
