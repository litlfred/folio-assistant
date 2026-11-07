/**
 * Tests for `scripts/check-workflows-security.ts` — the security gate over
 * `folio-assistant-sci`'s own `.github/workflows/`, source tree and lockfile
 * (beans `folio-assistant-6zcw`, `folio-assistant-vbhb`, `folio-assistant-wox6`).
 *
 * @module folio-assistant-sci/scripts/check-workflows-security.test
 */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  checkDependencyFloors,
  checkSecretLeaks,
  checkWorkflowActionPinning,
  checkWorkflowInjection,
  checkWorkflowPermissions,
  runSciSecurityGate,
  SCI_ROOT,
} from "./check-workflows-security.ts";

describe("folio-assistant-sci security gate on the live repository (beans 6zcw, vbhb, wox6)", () => {
  test("every security check passes on folio-assistant-sci", () => {
    const results = runSciSecurityGate(SCI_ROOT);
    expect(results.map((r) => ({ check: r.check, state: r.state }))).toEqual([
      { check: "action-sha-pinning", state: "pass" },
      { check: "workflow-permissions", state: "pass" },
      { check: "check:workflow-injection", state: "pass" },
      { check: "check:secret-leaks", state: "pass" },
      { check: "check:dependency-advisories", state: "pass" },
    ]);
  });
});

describe("folio-assistant-sci security gate falsifiers", () => {
  test("refuses an unpinned uses: line, including a reusable workflow @main", () => {
    const tmp = mkdtempSync(join(tmpdir(), "sci-sec-pin-"));
    try {
      const wf = join(tmp, ".github", "workflows");
      mkdirSync(wf, { recursive: true });
      writeFileSync(
        join(wf, "ci.yml"),
        "name: CI\non: [push]\npermissions:\n  contents: read\njobs:\n  a:\n    uses: litlfred/cat-harness-tools/.github/workflows/layer-pr-checks.yml@main\n",
      );
      const res = checkWorkflowActionPinning(tmp);
      expect(res.state).toBe("fail");
      expect(res.detail).toContain("layer-pr-checks.yml@main");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("refuses a workflow without a top-level permissions block", () => {
    const tmp = mkdtempSync(join(tmpdir(), "sci-sec-perm-"));
    try {
      const wf = join(tmp, ".github", "workflows");
      mkdirSync(wf, { recursive: true });
      writeFileSync(join(wf, "ci.yml"), "name: CI\non: [push]\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps: []\n");
      const res = checkWorkflowPermissions(tmp);
      expect(res.state).toBe("fail");
      expect(res.detail).toContain("ci.yml");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("refuses a free-text expression in a workflow run: block", () => {
    const tmp = mkdtempSync(join(tmpdir(), "sci-sec-inj-"));
    try {
      const wf = join(tmp, ".github", "workflows");
      mkdirSync(wf, { recursive: true });
      writeFileSync(
        join(wf, "ci.yml"),
        "name: CI\non: [pull_request]\npermissions:\n  contents: read\njobs:\n  a:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo \"${{ github.event.pull_request.title }}\"\n",
      );
      const res = checkWorkflowInjection(tmp);
      expect(res.state).toBe("fail");
      expect(res.detail).toContain("github.event.pull_request.title");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("refuses a lockfile resolving happy-dom or undici below the advisory floor", () => {
    const tmp = mkdtempSync(join(tmpdir(), "sci-sec-deps-"));
    try {
      writeFileSync(
        join(tmp, "bun.lock"),
        JSON.stringify({
          lockfileVersion: 1,
          packages: {
            "happy-dom": ["happy-dom@15.11.7", "", {}, "sha512-x"],
            "undici": ["undici@5.29.0", "", {}, "sha512-y"],
          },
        }),
      );
      const res = checkDependencyFloors(tmp);
      expect(res.state).toBe("fail");
      expect(res.detail).toContain("happy-dom@15.11.7 < 20.14.7");
      expect(res.detail).toContain("undici@5.29.0 < 6.29.1");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  test("checkSecretLeaks passes on a clean tree", () => {
    const tmp = mkdtempSync(join(tmpdir(), "sci-sec-leaks-"));
    try {
      mkdirSync(join(tmp, ".github"), { recursive: true });
      writeFileSync(join(tmp, "package.json"), "{\"name\":\"x\"}\n");
      const res = checkSecretLeaks(tmp);
      expect(res.state).toBe("pass");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
  });
});
