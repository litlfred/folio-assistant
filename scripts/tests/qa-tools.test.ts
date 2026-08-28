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
} from "../../adapters/document/tools/_pipeline.ts";
import { registerQaTools, registerPaperQaTools } from "../../adapters/document/tools/qa.ts";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * A stand-in for `McpServer` that records what a `register*Tools` call
 * registers. Only `tool` is exercised, so the cast to `McpServer` at each use
 * is narrowed through `unknown` rather than `any` — the recorder itself stays
 * typed, and a change to the `tool` signature still breaks here.
 */
interface ToolRecorder {
  tool(name: string, desc: string, schema: unknown, handler: ToolHandler): void;
}

/** An MCP tool handler, as the registration stubs below see it. */
type ToolHandler = (
  ...args: unknown[]
) => Promise<{ content: Array<{ type: string; text: string }> }>;


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

/** Register one half and report what it produced. */
function record(register: (s: McpServer) => void): Record<string, { desc: string; schema: unknown; handler: ToolHandler }> {
  const registered: Record<string, { desc: string; schema: unknown; handler: ToolHandler }> = {};
  const stub: ToolRecorder = {
    tool(name, desc, schema, handler) { registered[name] = { desc, schema, handler }; },
  };
  register(stub as unknown as McpServer);
  return registered;
}

describe("registerQaTools", () => {
  test("registers the expected mechanical tools with handlers", () => {
    // Both halves together must still cover the module's whole table — that is
    // a property of the table, not of either adapter, and splitting the
    // registration must not let an entry fall out of coverage.
    const registered = { ...record(registerQaTools), ...record(registerPaperQaTools) };

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

  test("the paper-only QA tools are NOT in the document half", () => {
    // `proof_status` counts sorries in Lean files and `latex_preflight` parses
    // .tex source. On a document folio both would report clean forever, and a
    // check that never looked is indistinguishable from one that passed.
    const doc = record(registerQaTools);
    expect(doc["proof_status"]).toBeUndefined();
    expect(doc["latex_preflight"]).toBeUndefined();
    // …and the document half keeps everything a prose folio can actually use.
    for (const name of ["qa_sweep", "bib_qa", "glossary_check", "content_export"]) {
      expect(doc[name]).toBeDefined();
    }
  });

  test("glossary_check returns a graceful message when no paper resolves", async () => {
    const registered: Record<string, ToolHandler> = {};
    const stub = { tool(name: string, _d: string, _s: unknown, h: ToolHandler) { registered[name] = h; } };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerQaTools(stub as any);
    // In this repo there is no content/<paper>, so auto-detect yields nothing.
    const res = await registered["glossary_check"]({});
    expect(res.content[0].type).toBe("text");
    expect(res.content[0].text.toLowerCase()).toContain("paper");
  });
});
