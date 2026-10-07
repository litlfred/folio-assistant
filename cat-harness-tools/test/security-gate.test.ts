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
    expect(actionPinning(repo(wf)).state).toBe("fail");
  });

  test("no workflows directory is unknown, not pass", () => {
    expect(actionPinning(repo()).state).toBe("unknown");
  });
});
