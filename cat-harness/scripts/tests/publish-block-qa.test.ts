/** Publishing a folio's block QA verdicts for the heat map (bean qbfi, option 2). */
import { describe, expect, test } from "bun:test";

import { summariseBlock } from "../publish-block-qa.js";

// `voice-status-leak` and `voice-ai-slop` are registered criteria that depend on `md`.
const entry = (result: "pass" | "fail" | "warn" | "n/a", md: string, severity?: "critical" | "major" | "minor") => ({
  field_hash: { md },
  result,
  ...(severity ? { severity } : {}),
  reviewer: { kind: "script", id: "qa-sweep" },
  reviewed_at: "2026-09-23T08:00:00Z",
});
const report = (criteria: Record<string, ReturnType<typeof entry>[]>) =>
  ({ $schema: "block-qa/v1", label: "p:x", kind: "prose", paths: { ts: "x.ts", md: "x.md" }, source_hashes: { md: "m1" }, criteria, updated_at: "2026-09-23T08:00:00Z" }) as never;

describe("summariseBlock", () => {
  test("no sidecar is unaudited", () => {
    expect(summariseBlock(undefined, { md: "m1" }).state).toBe("unaudited");
  });

  test("a fresh fail is failing, with its severity", () => {
    const s = summariseBlock(report({ "voice-status-leak": [entry("fail", "m1", "critical")], "voice-ai-slop": [entry("pass", "m1")] }), { md: "m1" });
    expect(s).toEqual({ state: "failing", fails: 1, warns: 0, worst: "critical", staleCriteria: 0 });
  });

  test("all fresh and none failing is passing", () => {
    expect(summariseBlock(report({ "voice-ai-slop": [entry("pass", "m1")] }), { md: "m1" }).state).toBe("passing");
  });

  test("a stale fail is NOT counted as failing, and a stale verdict is never a pass", () => {
    const s = summariseBlock(report({ "voice-status-leak": [entry("fail", "OLD", "critical")], "voice-ai-slop": [entry("pass", "m1")] }), { md: "m1" });
    expect(s).toEqual({ state: "stale", fails: 0, warns: 0, worst: null, staleCriteria: 1 });
  });
});
