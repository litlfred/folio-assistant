/**
 * Tests for the mechanical QA/publication MCP tools and their pipeline helper.
 *
 * These are hermetic: they exercise the wrapper's structural behaviour
 * (script-path resolution, JSON extraction, graceful errors) and verify the
 * tools register with the expected names/handlers — without spawning the real
 * pipeline (which needs a content/<paper> fixture).
 */
import { test, expect, describe } from "bun:test";
import {
  pipelineScriptPath,
  tryParseJson,
  runPipeline,
  asToolText,
} from "../../adapters/paper/tools/_pipeline.ts";
import { registerQaTools } from "../../adapters/paper/tools/qa.ts";

describe("_pipeline helper", () => {
  test("pipelineScriptPath resolves under content/pipeline with .ts", () => {
    const p = pipelineScriptPath("qa-sweep");
    expect(p.endsWith("/content/pipeline/qa-sweep.ts")).toBe(true);
    expect(pipelineScriptPath("x.ts").endsWith("/content/pipeline/x.ts")).toBe(true);
  });

  test("tryParseJson extracts JSON after a banner, else undefined", () => {
    expect(tryParseJson('banner\n{"a":1}')).toEqual({ a: 1 });
    expect(tryParseJson("[1,2,3]")).toEqual([1, 2, 3]);
    expect(tryParseJson("no json here")).toBeUndefined();
    expect(tryParseJson("")).toBeUndefined();
  });

  test("runPipeline returns a structured error for a missing script (never throws)", () => {
    const r = runPipeline("definitely-not-a-real-script-xyz", ["--json"]);
    expect(r.ok).toBe(false);
    expect(r.error).toContain("not found");
    expect(r.json).toBeUndefined();
  });

  test("asToolText renders error and JSON results as MCP text content", () => {
    const errRes = asToolText("t", {
      ok: false, script: "s", exitCode: null, stdout: "", stderr: "", error: "boom",
    });
    expect(errRes.content[0].type).toBe("text");
    expect(errRes.content[0].text).toContain("boom");

    const jsonRes = asToolText("t", {
      ok: true, script: "s", exitCode: 0, stdout: "", stderr: "", json: { findings: [] },
    });
    expect(jsonRes.content[0].text).toContain("```json");
    expect(jsonRes.content[0].text).toContain("findings");
  });
});

describe("registerQaTools", () => {
  test("registers the expected mechanical tools with handlers", () => {
    const registered: Record<string, { desc: string; schema: unknown; handler: Function }> = {};
    const stub = {
      tool(name: string, desc: string, schema: unknown, handler: Function) {
        registered[name] = { desc, schema, handler };
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerQaTools(stub as any);

    for (const name of [
      "qa_sweep",
      "proof_status",
      "latex_preflight",
      "bib_qa",
      "glossary_check",
      "content_export",
    ]) {
      expect(registered[name]).toBeDefined();
      expect(typeof registered[name].handler).toBe("function");
      expect(registered[name].desc.length).toBeGreaterThan(10);
    }
  });

  test("glossary_check returns a graceful message when no paper resolves", async () => {
    const registered: Record<string, Function> = {};
    const stub = { tool(name: string, _d: string, _s: unknown, h: Function) { registered[name] = h; } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerQaTools(stub as any);
    // In this repo there is no content/<paper>, so auto-detect yields nothing.
    const res = await registered["glossary_check"]({});
    expect(res.content[0].type).toBe("text");
    expect(res.content[0].text.toLowerCase()).toContain("paper");
  });
});
