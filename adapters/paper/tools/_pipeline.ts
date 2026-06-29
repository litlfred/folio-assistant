/**
 * Shared helper for the mechanical "QA / publication / transform" MCP tools.
 *
 * These tools expose the deterministic cores that live as scripts under
 * `content/pipeline/*` — the LLM calls them to get structured findings, then
 * applies judgment (the skill bodies) on top. Each tool wraps one pipeline
 * script through {@link runPipeline}, which spawns `bun run` on the script from
 * the repo root and captures structured output, degrading gracefully when the
 * script or a toolchain is missing.
 *
 * @module adapters/paper/tools/_pipeline
 */

import { spawnSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import { get } from "../paths.js";

export interface PipelineResult {
  ok: boolean;
  /** Script id (without `.ts`). */
  script: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  /** Parsed JSON when `--json` was requested and stdout parsed cleanly. */
  json?: unknown;
  /** Wrapper-level error (missing script / `bun` not found / spawn failure). */
  error?: string;
}

/** Absolute path to a `content/pipeline/<script>.ts` file. */
export function pipelineScriptPath(script: string): string {
  const name = script.endsWith(".ts") ? script : `${script}.ts`;
  return join(get.REPO_ROOT(), "content", "pipeline", name);
}

/**
 * Best-effort JSON extraction: many scripts print a human banner before the
 * JSON, so parse from the first `{`/`[`. Returns undefined if nothing parses.
 */
export function tryParseJson(s: string): unknown | undefined {
  const t = s.trim();
  if (!t) return undefined;
  const candidates = ["{", "["]
    .map((c) => t.indexOf(c))
    .filter((i) => i >= 0);
  if (candidates.length === 0) return undefined;
  const start = Math.min(...candidates);
  try {
    return JSON.parse(t.slice(start));
  } catch {
    return undefined;
  }
}

/** Run a pipeline script and capture a structured result. Never throws. */
export function runPipeline(
  script: string,
  args: string[] = [],
  opts: { timeoutMs?: number } = {},
): PipelineResult {
  const path = pipelineScriptPath(script);
  if (!existsSync(path)) {
    return {
      ok: false,
      script,
      exitCode: null,
      stdout: "",
      stderr: "",
      error: `pipeline script not found: content/pipeline/${script}.ts`,
    };
  }
  const res = spawnSync("bun", ["run", path, ...args], {
    cwd: get.REPO_ROOT(),
    encoding: "utf-8",
    timeout: opts.timeoutMs ?? 120_000,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (res.error) {
    return {
      ok: false,
      script,
      exitCode: res.status ?? null,
      stdout: res.stdout ?? "",
      stderr: res.stderr ?? "",
      error: res.error.message,
    };
  }
  const stdout = res.stdout ?? "";
  return {
    ok: res.status === 0,
    script,
    exitCode: res.status,
    stdout,
    stderr: res.stderr ?? "",
    json: args.includes("--json") ? tryParseJson(stdout) : undefined,
  };
}

const MAX = 12_000;

/** Format a PipelineResult as an MCP text tool result. */
export function asToolText(title: string, r: PipelineResult) {
  let text: string;
  if (r.error) {
    text = `# ${title}\n\n⚠️ ${r.error}`;
  } else {
    const body =
      r.json !== undefined
        ? "```json\n" + JSON.stringify(r.json, null, 2).slice(0, MAX) + "\n```"
        : (r.stdout || r.stderr || "(no output)").slice(0, MAX);
    text = `# ${title} (${r.ok ? "ok" : `exit ${r.exitCode}`})\n\n${body}`;
  }
  return { content: [{ type: "text" as const, text }] };
}

/** Resolve the single paper under content/ if not given (else undefined). */
export function autoPaper(paper?: string): string | undefined {
  if (paper) return paper;
  const dir = join(get.REPO_ROOT(), "content");
  if (!existsSync(dir)) return undefined;
  const papers = readdirSync(dir, { withFileTypes: true })
    .filter(
      (d) =>
        d.isDirectory() &&
        !d.name.startsWith(".") &&
        !["pipeline", "schema", "node_modules"].includes(d.name),
    )
    .map((d) => d.name);
  return papers.length === 1 ? papers[0] : undefined;
}
