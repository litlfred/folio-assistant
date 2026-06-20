/**
 * Work-plan priming MCP tool — exposes the beans work-plan to any MCP-connected
 * agent, regardless of CLI (Claude Code, Gemini CLI, Antigravity, …).
 *
 * This is the agent-generic, platform layer of the session-start design
 * (docs/folio-assistant-migration.md §8, layer 3): a CLI that has no usable
 * session-start shell hook can still pull live priming by calling this tool.
 *
 * Tools:
 *   work_plan_prime — emit `beans prime` + `beans list`, or a .beans/ fallback.
 *
 * @module folio-assistant/tools/beans-prime
 */

import { execSync } from "child_process";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/** Run a command in the repo, returning trimmed stdout or "" on failure. */
function run(cmd: string, cwd: string): string {
  try {
    return execSync(cmd, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function hasBeans(cwd: string): boolean {
  return run("command -v beans", cwd) !== "";
}

/** CLI-independent fallback: read .beans/*.md and list titles + status. */
function primeFromDir(beansDir: string): string {
  if (!existsSync(beansDir)) {
    return "_(no .beans/ store and no beans CLI — nothing to prime; see AGENTS.md)_";
  }
  const files = readdirSync(beansDir).filter((f) => f.endsWith(".md"));
  if (files.length === 0) return "_(no beans found in .beans/)_";

  const lines: string[] = [
    "_(beans CLI not on PATH — reading .beans/ directly; run `scripts/install-beans.sh` for full priming)_",
  ];
  for (const f of files.sort()) {
    let title = f.replace(/\.md$/, "");
    let status = "";
    try {
      const body = readFileSync(join(beansDir, f), "utf8");
      const titleMatch = body.match(/^#\s+(.+)$/m);
      if (titleMatch) title = titleMatch[1].trim();
      const statusMatch = body.match(/^(?:status|state):\s*(.+)$/im);
      if (statusMatch) status = statusMatch[1].trim();
    } catch {
      /* keep filename-derived title */
    }
    lines.push(`- ${title}${status ? ` [${status}]` : ""}`);
  }
  return lines.join("\n");
}

export function registerBeansTools(server: McpServer, repoRoot: string): void {
  server.tool(
    "work_plan_prime",
    "Prime yourself with the current beans work-plan (session + cross-session/" +
      "cross-agent todos). Runs `beans prime` + `beans list`; if the beans CLI is " +
      "not installed, falls back to reading the committed .beans/ store directly. " +
      "Use at the start of a task to see open items and claim before working.",
    {},
    async () => {
      let text: string;
      if (hasBeans(repoRoot)) {
        const prime = run("beans prime", repoRoot);
        const list = run("beans list", repoRoot);
        text = [prime, list].filter(Boolean).join("\n\n") || "_(beans returned nothing)_";
      } else {
        text = primeFromDir(join(repoRoot, ".beans"));
      }
      return {
        content: [{ type: "text" as const, text: `# Work-plan (beans)\n\n${text}` }],
      };
    },
  );
}
