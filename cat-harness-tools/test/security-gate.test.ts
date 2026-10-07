import { describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { actionPinning, blocks, runCheck, unpinnedActions, type GateResult } from "../scripts/security-gate.ts";

function repo(workflow?: string, scripts: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), "security-gate-"));
  writeFileSync(join(root, "package.json"), JSON.stringify({ scripts }));
  if (workflow !== undefined) {
    mkdirSync(join(root, ".github", "workflows"), { recursive: true });
    writeFileSync(join(root, ".github", "workflows", "ci.yml"), workflow);
  }
  return root;
}

describe("security:gate", () => {
  test("a check that cannot be run is UNKNOWN, and unknown blocks", () => {
    const r = runCheck("check:does-not-exist", true, repo());
    expect(r.state).toBe("unknown");
    expect(blocks([r])).toHaveLength(1);
  });

  test("an advisory failure never blocks", () => {
    const r: GateResult = { check: "x", blocking: false, state: "fail", detail: "" };
    expect(blocks([r])).toHaveLength(0);
  });

  test("a failing blocking check refuses", () => {
    const root = repo(undefined, { "check:always-fails": "exit 3" });
    const r = runCheck("check:always-fails", true, root);
    expect(r.state).toBe("fail");
    expect(blocks([r])).toHaveLength(1);
  });

  test("only a full 40-hex SHA counts as pinned; local and docker refs are not third-party", () => {
    const wf = [
      "    steps:",
      "      - uses: actions/checkout@v4",
      "      - uses: actions/setup-node@0123456789abcdef0123456789abcdef01234567 # v4",
      "      - uses: owner/short@0123456",
      "      - uses: ./.github/actions/local",
      "      - uses: docker://alpine:3",
    ].join("\n");
    const r = unpinnedActions(repo(wf))!;
    expect(r.total).toBe(3);
    expect(r.unpinned.map((u) => u.split(" ")[1])).toEqual(["actions/checkout@v4", "owner/short@0123456"]);
    expect(actionPinning(repo(wf))[0]!.state).toBe("fail");
  });

  test("no workflows directory is unknown, not pass", () => {
    expect(actionPinning(repo())[0]!.state).toBe("unknown");
  });
});

describe("action pinning follows the owner's staging ruling", () => {
  test("an unpinned action BLOCKS outside staging and is advisory in a staging-only workflow", () => {
    const root = repo("    steps:\n      - uses: actions/checkout@v4\n");
    writeFileSync(join(root, ".github", "workflows", "feature-staging.yml"), "    steps:\n      - uses: actions/checkout@v4\n");
    const [published, staging] = actionPinning(root);
    expect(published!.blocking).toBe(true);
    expect(published!.state).toBe("fail");
    expect(staging!.blocking).toBe(false);
    expect(staging!.state).toBe("fail");
    expect(blocks([published!, staging!])).toHaveLength(1);
  });

  test("first-party reusable workflows are not third-party", () => {
    const root = repo("    uses: litlfred/folio-assistant/.github/workflows/publish.yml@main\n");
    expect(unpinnedActions(root)!.total).toBe(0);
  });
});

describe("a staging workflow that holds a write token is NOT exempt (owner 2026-10-07, roast 1ygp L4.1)", () => {
  test("an unpinned action in it blocks", () => {
    const root = mkdtempSync(join(tmpdir(), "sg-write-"));
    mkdirSync(join(root, ".github", "workflows"), { recursive: true });
    writeFileSync(join(root, ".github", "workflows", "feature-staging.yml"), "permissions:\n  contents: write\njobs:\n  a:\n    steps:\n      - uses: actions/checkout@v4\n");
    const [published] = actionPinning(root);
    expect(published!.blocking).toBe(true);
    expect(published!.state).toBe("fail");
  });
});

describe("checks moved into a layer's checkoutScripts are still run (#2448)", () => {
  test("a layer script is found and run, not reported unknown", () => {
    // check:bun-pin lives in cat-harness-tools/package.json checkoutScripts since #2448.
    const r = runCheck("check:bun-pin", true);
    expect(r.state).not.toBe("unknown");
  });
});
