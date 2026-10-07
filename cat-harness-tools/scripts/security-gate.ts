/**
 * The release security gate: run every security check this repository
 * already has, as ONE named step a release process can call (bean `ieum`,
 * issue #2389).
 *
 * ## Why a gate over checks that already run in CI
 *
 * Measured 2026-10-07: the checks below run in `code-quality-gates.yml`, but
 * **no merge, publish or release process step names any of them**. A
 * `docs-site-publish` or a `merge-train` run is covered only indirectly, if
 * the CI run that preceded it happened to be the right one. The owner put it
 * this way: *"tools may be in place but not utilized fully"*. This script does
 * not add a check. It makes the existing ones callable by name at the point
 * of release, and says which state each one is in.
 *
 * ## Three states, never two
 *
 * | state     | means                                     | blocks |
 * |-----------|-------------------------------------------|--------|
 * | `pass`    | the check ran and found nothing it fails on | no   |
 * | `fail`    | the check ran and refused                 | yes (blocking checks) |
 * | `unknown` | the check could not be run                | yes: could-not-check is never clean |
 *
 * An `advisory` check (dependency advisories, action pinning) is reported in
 * the same three states and never blocks, because each is a known backlog
 * whose blocking threshold is the owner's decision (0 of 240 `uses:` lines
 * are SHA-pinned today; turning that into a blocker on day one would block
 * every release).
 *
 * ## Every subprocess is argv, never a shell string
 *
 * The check names are constants, and they reach `Bun.spawnSync` as an
 * array, so nothing here builds a shell command from a value. That is
 * the `secure-code-authoring` voice's `scz-value-never-becomes-program-text`.
 *
 * Usage:
 *   bun run security:gate            # exit 1 on a blocking fail or unknown
 *   bun run security:gate --json     # machine-readable result on stdout
 *
 * @graphNode tool
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dir, "..", "..");

export type GateState = "pass" | "fail" | "unknown";
export interface GateResult {
  check: string;
  blocking: boolean;
  state: GateState;
  detail: string;
}

/** The security checks, each a `package.json` script, in the order a reader meets them. */
export const SECURITY_CHECKS: ReadonlyArray<{ script: string; blocking: boolean; guards: string }> = [
  { script: "check:workflow-injection", blocking: true, guards: "`${{ }}` reaching a run:/script: block" },
  { script: "check:secret-leaks", blocking: true, guards: "secrets committed or echoed" },
  { script: "check:lockfile-pinning", blocking: true, guards: "an install that falls back from its pin" },
  { script: "check:bun-pin", blocking: true, guards: "the toolchain version" },
  { script: "check:qa-reviewer-permission", blocking: true, guards: "a QA verdict written by an actor not permitted to write it" },
  { script: "check:materialized-fixity", blocking: true, guards: "materialised remote assets against their recorded hashes" },
  { script: "check:dependency-advisories", blocking: false, guards: "known-vulnerable dependencies (warn-only by design)" },
];

/** Run one package script by NAME, as argv. */
export function runCheck(script: string, blocking: boolean, root = ROOT): GateResult {
  const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8")) as { scripts?: Record<string, string> };
  if (!pkg.scripts?.[script]) {
    return { check: script, blocking, state: "unknown", detail: "no such package.json script: the check could not be run" };
  }
  const p = Bun.spawnSync(["bun", "run", script], { cwd: root, stdout: "pipe", stderr: "pipe" });
  // Bun echoes "$ bun run …" on stderr, so prefer the check's own last stdout line.
  const lastLine = (t: string) => t.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("$ ")).pop();
  const tail = (lastLine(p.stdout.toString()) ?? lastLine(p.stderr.toString()) ?? "").slice(0, 300);
  if (p.exitCode === 0) return { check: script, blocking, state: "pass", detail: tail };
  if (p.exitCode === null) return { check: script, blocking, state: "unknown", detail: "the check did not exit (signal)" };
  return { check: script, blocking, state: "fail", detail: tail };
}

const SHA = /@[0-9a-f]{40}(\s|$)/;
/**
 * Third-party `uses:` lines not pinned to a full commit SHA. Local
 * (`./`) and `docker://` references are not third-party actions.
 */
export function unpinnedActions(root = ROOT): { total: number; unpinned: string[] } | undefined {
  const dir = join(root, ".github", "workflows");
  if (!existsSync(dir)) return undefined;
  const unpinned: string[] = [];
  let total = 0;
  for (const f of readdirSync(dir).filter((n) => /\.ya?ml$/.test(n)).sort()) {
    readFileSync(join(dir, f), "utf-8").split("\n").forEach((line, i) => {
      const m = /^\s*-?\s*uses:\s*["']?([^\s"'#]+)/.exec(line);
      if (!m || m[1]!.startsWith("./") || m[1]!.startsWith("docker://")) return;
      total++;
      if (!SHA.test(line.replace(/["']/g, " "))) unpinned.push(`${f}:${i + 1} ${m[1]}`);
    });
  }
  return { total, unpinned };
}

export function actionPinning(root = ROOT): GateResult {
  const r = unpinnedActions(root);
  if (r === undefined) return { check: "action-sha-pinning", blocking: false, state: "unknown", detail: "no .github/workflows directory" };
  return r.unpinned.length === 0
    ? { check: "action-sha-pinning", blocking: false, state: "pass", detail: `${r.total} third-party uses:, all SHA-pinned` }
    : { check: "action-sha-pinning", blocking: false, state: "fail", detail: `${r.unpinned.length} of ${r.total} third-party uses: are not pinned to a full commit SHA` };
}

export function securityGate(root = ROOT): GateResult[] {
  return [...SECURITY_CHECKS.map((c) => runCheck(c.script, c.blocking, root)), actionPinning(root)];
}

/** A release proceeds only when no BLOCKING check failed or could not be run. */
export function blocks(results: GateResult[]): GateResult[] {
  return results.filter((r) => r.blocking && r.state !== "pass");
}

if (import.meta.main) {
  const results = securityGate();
  const stop = blocks(results);
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ $schema: "folio-security-gate/v1", results, blocked: stop.length > 0 }, null, 2));
  } else {
    for (const r of results) {
      const mark = r.state === "pass" ? "✓" : r.state === "fail" ? "✗" : "?";
      console.log(`${mark} ${r.check}${r.blocking ? "" : " (advisory)"} — ${r.state}${r.detail ? `: ${r.detail}` : ""}`);
    }
    console.log(
      stop.length === 0
        ? "\nsecurity:gate: no blocking finding. Advisory findings above are reported, not cleared."
        : `\nsecurity:gate: REFUSED — ${stop.length} blocking check(s) failed or could not be run.`,
    );
  }
  process.exit(stop.length === 0 ? 0 : 1);
}
