/**
 * Lean LSP proxy — delegates to lean-lsp-mcp subprocess.
 *
 * Rather than re-implementing all Lean tools, this spawns the existing
 * lean-lsp-mcp server as a subprocess and provides a meta-tool for
 * checking its status.
 *
 * The actual Lean MCP tools are registered via .mcp.json's separate
 * lean-lsp entry. This module provides coordination tools:
 *
 *   lean_status   — Check if Lean toolchain and lean-lsp-mcp are available
 *   lean_build    — Trigger a Lean build (lake build)
 *   lean_check    — Quick type-check (lake check) — faster than full build
 *
 * @module scripts/mcp-server/tools/lean
 */

import { z } from "zod";
import { execSync, spawnSync, type SpawnSyncReturns } from "child_process";
import { existsSync, readFileSync } from "fs";
import { join, resolve } from "path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { LEAN_DIR, REPO_ROOT } from "../paths.js";

/** Check if a command is available. */
function hasCommand(cmd: string): boolean {
  try {
    execSync(`which ${cmd}`, { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve the Lean project (Lake) directory.
 *
 * Preference order:
 *   1. Explicit `dir` argument (relative to repo root).
 *   2. The repo-root Lake workspace (`/lakefile.toml`).
 *   3. Legacy per-paper path `content/quantum-observable-universe/lean/`.
 *   4. `LEAN_DIR` from paths.js as final fallback.
 *
 * The root workspace is preferred when present: `lake build` at the
 * root builds every registered paper package (qou, ugb, fred2005).
 */
function leanProjectDir(dir?: string): string {
  if (dir) return resolve(REPO_ROOT, dir);
  if (
    existsSync(join(REPO_ROOT, "lakefile.toml")) ||
    existsSync(join(REPO_ROOT, "lakefile.lean"))
  ) {
    return REPO_ROOT;
  }
  const leanArchive = join(REPO_ROOT, "content/quantum-observable-universe/lean");
  if (existsSync(join(leanArchive, "lakefile.toml")) || existsSync(join(leanArchive, "lakefile.lean"))) {
    return leanArchive;
  }
  return LEAN_DIR;
}

/** Extract stdout + stderr from a spawn result, truncated to the last 2000 chars. */
function processSpawnOutput(result: SpawnSyncReturns<Buffer>): { output: string; last2k: string } {
  const stdout = result.stdout?.toString() || "";
  const stderr = result.stderr?.toString() || "";
  const output = (stdout + "\n" + stderr).trim();
  const last2k = output.slice(-2000);
  return { output, last2k };
}

export function registerLeanTools(server: McpServer): void {

  // ── lean_status ──────────────────────────────────────────────

  server.tool(
    "lean_status",
    "Check availability of Lean toolchain, lake, lean-lsp-mcp, " +
    "and the remote MCP server. Reports what's available and what's missing.",
    {},
    async () => {
      const checks: Record<string, string> = {};

      // Local Lean
      checks.lean = hasCommand("lean") ? execSync("lean --version", { encoding: "utf-8" }).trim() : "not installed";
      checks.lake = hasCommand("lake") ? "available" : "not installed";
      checks.elan = hasCommand("elan") ? "available" : "not installed";

      // lean-lsp-mcp
      checks["lean-lsp-mcp"] = hasCommand("uvx")
        ? (() => {
          try {
            execSync("uvx lean-lsp-mcp --help", { stdio: "pipe", timeout: 10_000 });
            return "available (via uvx)";
          } catch {
            return "uvx available but lean-lsp-mcp failed";
          }
        })()
        : "uvx not installed";

      // Toolchain
      const tcFile = join(LEAN_DIR, "lean-toolchain");
      checks.toolchain = existsSync(tcFile)
        ? readFileSync(tcFile, "utf-8").trim()
        : "lean-toolchain not found";

      // Lake manifest
      checks.lake_manifest = existsSync(join(LEAN_DIR, "lake-manifest.json"))
        ? "present" : "missing (run lake update)";

      // Remote MCP
      try {
        const configFile = join(REPO_ROOT, "lean-mcp.config.json");
        if (existsSync(configFile)) {
          const config = JSON.parse(readFileSync(configFile, "utf-8"));
          const domain = config.domain;
          const result = spawnSync("curl", [
            "-sf", "--max-time", "5",
            `https://${domain}/health`,
          ], { stdio: "pipe" });
          checks.remote_mcp = result.status === 0 ? `available (${domain})` : `unreachable (${domain})`;
        } else {
          checks.remote_mcp = "no config file";
        }
      } catch {
        checks.remote_mcp = "check failed";
      }

      const status = Object.entries(checks)
        .map(([k, v]) => `  ${k.padEnd(20)} ${v}`)
        .join("\n");

      return {
        content: [{ type: "text" as const, text: `Lean status:\n${status}` }],
      };
    },
  );

  // ── lean_build ───────────────────────────────────────────────

  server.tool(
    "lean_build",
    "Run `lake build` in the Lean project directory. Returns build output. " +
    "Defaults to the repo-root Lake workspace (builds all paper packages: " +
    "QOU, UGB, Fred2005); falls back to per-paper Lake dirs if no root " +
    "lakefile is present.",
    {
      clean: z.boolean().default(false)
        .describe("Run `lake clean` first"),
      project: z.string().optional()
        .describe("Specific library to build (e.g. 'QOU', 'UGB', 'Fred2005'). Default: build all libraries in the current workspace."),
      dir: z.string().optional()
        .describe("Lean project directory relative to repo root (default: auto-detect repo-root workspace, then legacy per-paper lean/)"),
    },
    async ({ clean, project, dir }) => {
      if (!hasCommand("lake")) {
        return {
          content: [{
            type: "text" as const,
            text: "Error: lake not installed. Use MCP tool: lean_setup",
          }],
        };
      }

      const cwd = leanProjectDir(dir);

      try {
        if (clean) {
          spawnSync("lake", ["clean"], { cwd, stdio: "pipe", timeout: 30_000 });
        }

        const args = project ? ["build", project] : ["build"];
        const result = spawnSync("lake", args, {
          cwd,
          stdio: "pipe",
          timeout: 600_000, // 10 min
        });

        const { last2k } = processSpawnOutput(result);

        return {
          content: [{
            type: "text" as const,
            text: `lake build ${result.status === 0 ? "succeeded" : "failed"} (exit ${result.status}, cwd: ${cwd})\n\n${last2k}`,
          }],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Build error: ${e instanceof Error ? e.message : String(e)}` }],
        };
      }
    },
  );

  // ── lean_check ──────────────────────────────────────────────

  server.tool(
    "lean_check",
    "Run `lake check` to type-check Lean files without full compilation. " +
    "Faster than lean_build — useful for quick validation after edits. " +
    "Defaults to content/quantum-observable-universe/lean/ if it contains a lakefile.",
    {
      project: z.string().optional()
        .describe("Specific library to check (e.g. 'QOU'). Default: check all."),
      dir: z.string().optional()
        .describe("Lean project directory relative to repo root (default: auto-detect content/quantum-observable-universe/lean/ or lean/)"),
    },
    async ({ project, dir }) => {
      if (!hasCommand("lake")) {
        return {
          content: [{
            type: "text" as const,
            text: "Error: lake not installed. Use MCP tool: lean_setup",
          }],
        };
      }

      const cwd = leanProjectDir(dir);

      try {
        const args = project ? ["check", project] : ["check"];
        const result = spawnSync("lake", args, {
          cwd,
          stdio: "pipe",
          timeout: 180_000, // 3 min
        });

        const { output, last2k } = processSpawnOutput(result);

        // Count errors and warnings
        const errors = (output.match(/^error:/gm) || []).length;
        const warnings = (output.match(/^warning:/gm) || []).length;
        const summary = result.status === 0
          ? `lake check succeeded (${warnings} warnings)`
          : `lake check failed: ${errors} errors, ${warnings} warnings`;

        return {
          content: [{
            type: "text" as const,
            text: `${summary} (exit ${result.status}, cwd: ${cwd})\n\n${last2k}`,
          }],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Check error: ${e instanceof Error ? e.message : String(e)}` }],
        };
      }
    },
  );
}
