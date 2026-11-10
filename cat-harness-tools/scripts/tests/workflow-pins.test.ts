/**
 * Shared-workflow calls follow index.lock.json (security audit S1, owner
 * 2026-11-01, card Q-SEC-4 "B").
 */
import { describe, expect, test } from "bun:test";

import { judgeFile } from "../workflow-pins.ts";

const TOOLS = "a".repeat(40);
const refs = new Map([["cat-harness-tools", TOOLS]]);
const judge = (text: string, own = "smart-x") => judgeFile("/r", "/r/.github/workflows/ci.yml", text, own, refs);

describe("workflow-pins", () => {
  test("a branch call to a mounted layer moves to the lock's commit", () => {
    const { findings, text } = judge("jobs:\n  checks:\n    uses: litlfred/cat-harness-tools/.github/workflows/layer-pr-checks.yml@main\n");
    expect(findings).toHaveLength(1);
    expect(text).toContain(`layer-pr-checks.yml@${TOOLS} # index.lock.json`);
  });

  test("a call already at the lock's commit is current", () => {
    expect(judge(`jobs:\n  c:\n    uses: litlfred/cat-harness-tools/.github/workflows/x.yml@${TOOLS} # index.lock.json\n`).findings).toHaveLength(0);
  });

  test("this repository's own workflow becomes a same-commit local call", () => {
    const { text } = judge("jobs:\n  b:\n    uses: litlfred/smart-x/.github/workflows/build.yml@main\n");
    expect(text).toContain("uses: ./.github/workflows/build.yml\n");
  });

  test("tools-ref: main under a layer-pr-checks call is dropped, other inputs stay", () => {
    const { text, findings } = judge("jobs:\n  c:\n    uses: litlfred/cat-harness-tools/.github/workflows/layer-pr-checks.yml@main\n    with:\n      mode: index\n      tools-ref: main\n");
    expect(findings.map((f) => f.why)).toEqual([expect.stringContaining("index.lock.json"), expect.stringContaining("tools-ref")]);
    expect(text).not.toContain("tools-ref");
    expect(text).toContain("mode: index");
  });

  test("an unmounted layer at a branch is reported and left for a hand pin", () => {
    const { findings, text } = judge("jobs:\n  c:\n    uses: litlfred/other/.github/workflows/x.yml@main\n");
    expect(findings[0].want).toBeNull();
    expect(text).toContain("@main");
  });

  test("an unmounted layer pinned by hand to a commit is accepted; comments are ignored", () => {
    expect(judge(`# uses: litlfred/other/.github/workflows/x.yml@main\njobs:\n  c:\n    uses: litlfred/other/.github/workflows/x.yml@${"b".repeat(40)}\n`).findings).toHaveLength(0);
  });
});

describe("workflow-pins: a commit pin behind the lock", () => {
  test("is a trailing finding (warn), and --write still moves it", () => {
    const old = "c".repeat(40);
    const { findings, text } = judge(`jobs:\n  c:\n    uses: litlfred/cat-harness-tools/.github/workflows/x.yml@${old}\n`);
    expect(findings).toHaveLength(1);
    expect(findings[0].trailing).toBe(true);
    expect(text).toContain(`x.yml@${TOOLS} # index.lock.json`);
  });

  test("a branch is never trailing", () => {
    expect(judge("jobs:\n  c:\n    uses: litlfred/cat-harness-tools/.github/workflows/x.yml@main\n").findings[0].trailing).toBeUndefined();
  });
});
