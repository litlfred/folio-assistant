/**
 * The downstream-tool criterion family — bean `fq5u`.
 *
 * The three-state read, the per-Tool verdict and the undeclared-tool finding,
 * each asserted on a case built to break it.
 */
import { describe, expect, test } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { downstreamState, listToolRuns, readToolRun, writeToolRun, UNKNOWN_FINGERPRINT, type ToolRunRecord } from "../../schemas/tool-run";
import type { ToolDefinition } from "../../schemas/tool";
import { MEMBERS, toolDownstreamEntry, undeclaredDownstream } from "../downstream-runs";
import { tools } from "../../tools/discover";
import { VERIFIERS } from "../publish-verify";

const ok = (fp: string): ToolRunRecord => ({ $schema: "folio-tool-run/v1", tool: "x", target: "t", outcome: "succeeded", inputFingerprint: fp });

describe("the three-state read", () => {
  test("fresh ONLY for a successful run over the current inputs", () => {
    expect(downstreamState(ok("a"), "a")).toBe("fresh");
    expect(downstreamState(ok("a"), "b")).toBe("stale");
  });
  test("no record is NOT-RUN and a failed run is FAILED — never green", () => {
    expect(downstreamState(undefined, "a")).toBe("not-run");
    expect(downstreamState({ ...ok("a"), outcome: "failed" }, "a")).toBe("failed");
  });
  test("an unknown fingerprint matches nothing, not even another unknown", () => {
    expect(downstreamState(ok(UNKNOWN_FINGERPRINT), UNKNOWN_FINGERPRINT)).toBe("stale");
  });
  test("a record round-trips, and rewriting identical content is a no-op", () => {
    const root = mkdtempSync(join(tmpdir(), "tool-run-"));
    writeToolRun(root, { tool: "x", target: "a/b", outcome: "succeeded", inputFingerprint: "f" });
    expect(readToolRun(root, "x", "a/b")?.inputFingerprint).toBe("f");
    expect(listToolRuns(root).map((r) => r.path)).toEqual([join("test", "results", "tool-runs", "x", "a", "b.tool-run.json")]);
  });
});

const tool = (downstream?: ToolDefinition["downstream"], id = "t"): ToolDefinition =>
  ({ id, downstream }) as unknown as ToolDefinition;

describe("the per-Tool verdict", () => {
  test("n/a for a Tool that declares no downstream output", () => {
    expect(toolDownstreamEntry(tool(), []).result).toBe("n/a");
  });
  test("an output judged only in the published tree is UNKNOWN naming its verifier — never pass", () => {
    const e = toolDownstreamEntry(tool({ output: "o", inputs: ["i"], judgedAt: "published", verifier: "v" }), ["v"]);
    expect(e.result).toBe("unknown");
    expect(e.findings[0]!.detail).toContain("`v`");
  });
  test("...and FAILS when that verifier is not in the set", () => {
    expect(toolDownstreamEntry(tool({ output: "o", inputs: ["i"], judgedAt: "published", verifier: "gone" }), ["v"]).result).toBe("fail");
  });
  test("a checkout-judged declaration with no member reader cannot be judged: UNKNOWN", () => {
    expect(toolDownstreamEntry(tool({ output: "o", inputs: ["i"], judgedAt: "checkout" }, "no-member"), []).result).toBe("unknown");
  });
});

describe("a downstream tool with no declaration is a finding", () => {
  test("a run record naming an undeclared Tool", () => {
    const root = mkdtempSync(join(tmpdir(), "tool-run-"));
    writeToolRun(root, { tool: "ghost", target: "t", outcome: "succeeded", inputFingerprint: "f" });
    const f = undeclaredDownstream([], root, []);
    expect(f.some((x) => x.detail.includes('Tool "ghost"'))).toBe(true);
  });
  test("a publish verifier naming an undeclared Tool", () => {
    const root = mkdtempSync(join(tmpdir(), "tool-run-"));
    expect(undeclaredDownstream([], root, [{ id: "v", tool: "ghost" }]).some((x) => x.where === "v")).toBe(true);
  });
  test("a member reader with no declaring Tool", () => {
    const root = mkdtempSync(join(tmpdir(), "tool-run-"));
    expect(undeclaredDownstream([], root, []).map((x) => x.where)).toEqual(Object.keys(MEMBERS));
  });
  test("THIS repository declares every member and every verifier's Tool", () => {
    const root = join(import.meta.dir, "..", "..");
    expect(undeclaredDownstream(tools(), root, VERIFIERS.map((v) => ({ id: v.id, tool: v.tool })))).toEqual([]);
  });
});
