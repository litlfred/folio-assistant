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
 * Action SHA pinning BLOCKS for every workflow except a staging-only one that
 * holds no write token and has no `pull_request_target` trigger, which is
 * reported as advisory (owner, 2026-10-07, twice: *"unpinned on staging"*,
 * then *"pin write-token workflows"* once the roast found a staging workflow
 * that could rewrite the live site; bean `1ygp` L4.1). `stagingExempt` in
 * `pin-actions.ts` decides that from what the workflow can do, never from its
 * name. An `advisory` check (dependency advisories, exempt staging pinning)
 * is reported in the same three states and never blocks.
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
 * @covers none — it re-runs other gates by name and reads .github/workflows/, which is not a declared graph typology; the kinds belong to the gates it calls
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { parseUses, stagingExempt } from "./pin-actions.ts";

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

/**
 * Third-party `uses:` lines not pinned to a full commit SHA, split by
 * {@link stagingExempt}: every workflow must pin unless it is a staging-only
 * workflow with no write token and no `pull_request_target` trigger. Local
 * (`./`) and `docker://` references are not third-party actions, and this
 * repository's own reusable workflows are first-party. Parsing and the
 * exemption come from `pin-actions.ts`, so the tool that pins and the gate
 * that checks cannot disagree about a line.
 */
export function unpinnedActions(root = ROOT): { total: number; unpinned: string[]; stagingUnpinned: string[] } | undefined {
  const dir = join(root, ".github", "workflows");
  if (!existsSync(dir)) return undefined;
  const unpinned: string[] = [];
  const stagingUnpinned: string[] = [];
  let total = 0;
  for (const f of readdirSync(dir).filter((n) => /\.ya?ml$/.test(n)).sort()) {
    const text = readFileSync(join(dir, f), "utf-8");
    const exempt = stagingExempt(f, text);
    text.split("\n").forEach((line, i) => {
      const u = parseUses(line);
      if (!u || u.firstParty) return;
      total++;
      if (u.pinned) return;
      (exempt ? stagingUnpinned : unpinned).push(`${f}:${i + 1} ${u.action}@${u.ref}`);
    });
  }
  return { total, unpinned, stagingUnpinned };
}

/** Blocking for published workflows; staging-only workflows are reported, never blocking. */
export function actionPinning(root = ROOT): GateResult[] {
  const r = unpinnedActions(root);
  if (r === undefined) return [{ check: "action-sha-pinning", blocking: true, state: "unknown", detail: "no .github/workflows directory" }];
  const published: GateResult =
    r.unpinned.length === 0
      ? { check: "action-sha-pinning", blocking: true, state: "pass", detail: `every third-party uses: outside staging-only workflows is SHA-pinned (${r.total} in all)` }
      : { check: "action-sha-pinning", blocking: true, state: "fail", detail: `${r.unpinned.length} unpinned outside staging — run \`bun run actions:pin\`: ${r.unpinned.slice(0, 3).join("; ")}` };
  const staging: GateResult = {
    check: "action-sha-pinning (staging-only)",
    blocking: false,
    state: r.stagingUnpinned.length === 0 ? "pass" : "fail",
    detail: r.stagingUnpinned.length === 0 ? "staging-only workflows are pinned too" : `${r.stagingUnpinned.length} unpinned in staging-only workflows, allowed by the owner's ruling`,
  };
  return [published, staging];
}

export function securityGate(root = ROOT): GateResult[] {
  return [...SECURITY_CHECKS.map((c) => runCheck(c.script, c.blocking, root)), ...actionPinning(root)];
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
