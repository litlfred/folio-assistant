#!/usr/bin/env bun
/**
 * check-workflows-security.ts — run the security gate over `folio-assistant-sci`'s
 * own `.github/workflows/`, source tree and lockfile (beans `folio-assistant-6zcw`,
 * `folio-assistant-vbhb`, `folio-assistant-wox6`).
 *
 * `cat-harness-tools/scripts/security-gate.ts` and `check-workflow-injection.ts`
 * default to the composed index root, so `folio-assistant-sci`'s own workflows
 * (`.github/workflows/*.yml`, which hold `contents: write`, `issues: write` and
 * `actions: write` tokens) were never checked in `sci`'s own CI (`layer-pr-checks.yml`
 * swaps `sci` into `fa/folio-assistant-sci/` and runs `check:*` scripts from `fa/`).
 *
 * This gate is rooted at `folio-assistant-sci/` itself (`SCI_ROOT`), whether run
 * standalone (`bun run security:gate`) or from the composed index (`bun run cat
 * check:workflows:security` in `layer-pr-checks.yml`), and verifies:
 *
 * 1. `action-sha-pinning` — every `uses:` in `.github/workflows/*.yml` (both
 *    third-party actions and reusable workflow calls) is pinned to a 40-hex
 *    commit SHA with a trailing `# <ref>` comment.
 * 2. `workflow-permissions` — every workflow in `.github/workflows/*.yml`
 *    declares an explicit top-level `permissions:` block (`scz-least-privilege`).
 * 3. `workflow-injection` — `scanWorkflows` from `check-workflow-injection.ts`
 *    finds no `free-text` or unbaselined `constrained` `${{ }}` expression in
 *    any `run:` or `script:` block of `.github/workflows/*.yml`.
 * 4. `secret-leaks` — `scanTree` from `check-secret-leaks.ts` over `SCI_ROOT`'s
 *    present roots finds no leaked credential and no unreadable root.
 * 5. `dependency-advisory-floors` — `bun.lock` resolves `happy-dom >= 20.14.7`,
 *    `zod >= 4.6.6`, `undici >= 6.29.1` and `body-parser >= 2.4.0`.
 *
 * @module folio-assistant-sci/scripts/check-workflows-security
 * @covers none — checks .github/workflows/, secret leaks and lockfile floors; .github/workflows/ is not a declared graph typology
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { scanRoots, scanTree } from "@litlfred/cat-harness-tools/scripts/check-secret-leaks.ts";
import { baselineKey, scanWorkflows } from "@litlfred/cat-harness-tools/scripts/check-workflow-injection.ts";
import { parseDockerUses, parseUses } from "@litlfred/cat-harness-tools/scripts/pin-actions.ts";

export const SCI_ROOT = resolve(import.meta.dir, "..");

export interface SciSecurityCheckResult {
  check: string;
  state: "pass" | "fail" | "unknown";
  detail: string;
}

/** Check that every `uses:` (including reusable workflows) in `.github/workflows/` is SHA-pinned with `# <ref>`. */
export function checkWorkflowActionPinning(root = SCI_ROOT): SciSecurityCheckResult {
  const dir = join(root, ".github", "workflows");
  if (!existsSync(dir)) {
    return { check: "action-sha-pinning", state: "unknown", detail: "no .github/workflows directory" };
  }
  const unpinned: string[] = [];
  let total = 0;
  for (const f of readdirSync(dir).filter((n) => /\.ya?ml$/.test(n)).sort()) {
    const text = readFileSync(join(dir, f), "utf-8");
    text.split("\n").forEach((line, i) => {
      const d = parseDockerUses(line);
      if (d) {
        total++;
        if (!d.digest) unpinned.push(`${f}:${i + 1} docker://${d.image} (no @sha256: digest)`);
        return;
      }
      const u = parseUses(line);
      if (!u) return;
      total++;
      if (!u.pinned) {
        const why = u.status === "unpinned-unlabelled" ? " (unpinned-unlabelled: no # <ref>)" : "";
        unpinned.push(`${f}:${i + 1} ${u.action}@${u.ref}${why}`);
      }
    });
  }
  if (unpinned.length > 0) {
    return {
      check: "action-sha-pinning",
      state: "fail",
      detail: `${unpinned.length} unpinned uses: line(s): ${unpinned.join("; ")}`,
    };
  }
  return {
    check: "action-sha-pinning",
    state: "pass",
    detail: `every uses: line across .github/workflows/ is SHA-pinned with # <ref> (${total} in all)`,
  };
}

/** Check that every workflow in `.github/workflows/` declares a top-level `permissions:` block. */
export function checkWorkflowPermissions(root = SCI_ROOT): SciSecurityCheckResult {
  const dir = join(root, ".github", "workflows");
  if (!existsSync(dir)) {
    return { check: "workflow-permissions", state: "unknown", detail: "no .github/workflows directory" };
  }
  const missing: string[] = [];
  const files = readdirSync(dir).filter((n) => /\.ya?ml$/.test(n)).sort();
  for (const f of files) {
    const doc = Bun.YAML.parse(readFileSync(join(dir, f), "utf-8")) as { permissions?: unknown } | null;
    if (!doc || doc.permissions === undefined) {
      missing.push(f);
    }
  }
  if (missing.length > 0) {
    return {
      check: "workflow-permissions",
      state: "fail",
      detail: `workflow(s) missing top-level permissions: ${missing.join(", ")}`,
    };
  }
  return {
    check: "workflow-permissions",
    state: "pass",
    detail: `all ${files.length} workflow(s) declare top-level permissions`,
  };
}

/** Check `.github/workflows/` for `${{ }}` expression injection in `run:` / `script:` blocks. */
export function checkWorkflowInjection(root = SCI_ROOT, allowedConstrained: ReadonlySet<string> = new Set()): SciSecurityCheckResult {
  const dir = join(root, ".github", "workflows");
  if (!existsSync(dir)) {
    return { check: "check:workflow-injection", state: "unknown", detail: "no .github/workflows directory" };
  }
  const findings = scanWorkflows(dir);
  const freeText = findings.filter((f) => f.severity === "free-text");
  const unbaselined = findings.filter((f) => f.severity === "constrained" && !allowedConstrained.has(baselineKey(f)));
  if (freeText.length > 0 || unbaselined.length > 0) {
    const bad = [...freeText, ...unbaselined].map((f) => `${f.file}:${f.line} \${{ ${f.expression} }} (${f.severity})`);
    return {
      check: "check:workflow-injection",
      state: "fail",
      detail: `${bad.length} workflow injection finding(s): ${bad.join("; ")}`,
    };
  }
  return {
    check: "check:workflow-injection",
    state: "pass",
    detail: `0 free-text and 0 unbaselined constrained expressions in .github/workflows/`,
  };
}

/** Scan `SCI_ROOT`'s present roots for leaked credentials. */
export function checkSecretLeaks(root = SCI_ROOT): SciSecurityCheckResult {
  const roots = scanRoots(root).filter((r) => existsSync(join(root, r)));
  if (roots.length === 0) {
    return { check: "check:secret-leaks", state: "unknown", detail: "no scannable roots found" };
  }
  const { leaks, filesScanned, unreadable } = scanTree(root, roots);
  if (unreadable.length > 0) {
    return {
      check: "check:secret-leaks",
      state: "unknown",
      detail: `could not scan root(s): ${unreadable.join(", ")}`,
    };
  }
  if (leaks.length > 0) {
    return {
      check: "check:secret-leaks",
      state: "fail",
      detail: leaks.map((l) => `${l.file}:${l.line} (${l.pattern})`).join("; "),
    };
  }
  return {
    check: "check:secret-leaks",
    state: "pass",
    detail: `no credential in a recognised format (${filesScanned} file(s) across ${roots.length} root(s))`,
  };
}

const ADVISORY_FLOORS: ReadonlyArray<readonly [string, string]> = [
  ["happy-dom", "20.14.7"],
  ["zod", "4.6.6"],
  ["undici", "6.29.1"],
  ["body-parser", "2.4.0"],
  ["@fastify/busboy", "3.2.1"],
];

/** Verify `bun.lock` resolves packages at or above their security advisory floors. */
export function checkDependencyFloors(root = SCI_ROOT): SciSecurityCheckResult {
  const lockPath = join(root, "bun.lock");
  if (!existsSync(lockPath)) {
    return { check: "check:dependency-advisories", state: "unknown", detail: "no bun.lock found" };
  }
  const lock = readFileSync(lockPath, "utf-8");
  const violations: string[] = [];
  for (const [name, floor] of ADVISORY_FLOORS) {
    const re = new RegExp(`"${name.replace(/[/@.]/g, "\\$&")}@(\\d+\\.\\d+\\.\\d+[^"]*)"`, "g");
    const versions = [...new Set([...lock.matchAll(re)].map((m) => m[1]!))];
    for (const v of versions) {
      if (Bun.semver.order(v, floor) < 0) {
        violations.push(`${name}@${v} < ${floor}`);
      }
    }
  }
  if (violations.length > 0) {
    return {
      check: "check:dependency-advisories",
      state: "fail",
      detail: `lockfile resolves below advisory floor: ${violations.join(", ")}`,
    };
  }
  return {
    check: "check:dependency-advisories",
    state: "pass",
    detail: `all checked lockfile packages meet or exceed their advisory floors (${ADVISORY_FLOORS.map(([n, f]) => `${n}>=${f}`).join(", ")})`,
  };
}

export function runSciSecurityGate(root = SCI_ROOT): SciSecurityCheckResult[] {
  return [
    checkWorkflowActionPinning(root),
    checkWorkflowPermissions(root),
    checkWorkflowInjection(root),
    checkSecretLeaks(root),
    checkDependencyFloors(root),
  ];
}

if (import.meta.main) {
  const results = runSciSecurityGate();
  const failed = results.filter((r) => r.state !== "pass");
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ results, blocked: failed.length > 0 }, null, 2));
  } else {
    for (const r of results) {
      const mark = r.state === "pass" ? "✓" : r.state === "fail" ? "✗" : "?";
      console.log(`${mark} ${r.check} — ${r.state}: ${r.detail}`);
    }
  }
  process.exit(failed.length === 0 ? 0 : 1);
}
