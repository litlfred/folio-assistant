#!/usr/bin/env bun
/**
 * What this instance's MCP server actually serves, read from the registrars.
 *
 * ## Why introspection rather than parsing the source
 *
 * The first attempt read `server.tool("name", "desc", {shape}, handler)` with a
 * regular expression and produced **wrong** input lists: words followed by a
 * colon inside the description string came back as parameter names, so
 * `skill_fetch` appeared to take `Examples`, `Local` and `Reference`, and
 * `paper_preferences` an `Action`. Authoring a Tool node's `io` from that would
 * have shipped a contract that agrees with nothing — worse than no contract,
 * because a contract is what the next check trusts.
 *
 * Mounting each registrar against a capture object gives the **real** Zod
 * shapes, including which keys are optional, because it asks the same objects
 * the server asks.
 *
 * ## What it is for
 *
 * Two things. It is the source data for migrating `src/tools/` into Tool nodes
 * (bean `ce65`, and the owner's instruction to move the current MCP surface
 * into `tools/`). And it is the comparison side `mcp-contract` needs: that
 * skill's schema-equivalence check compares a Tool node's `io` against what is
 * served, and this is what "what is served" means before a projector exists.
 *
 * @module scripts/capture-mcp-tools
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export interface CapturedTool {
  name: string;
  description: string;
  /** Repo-relative module that registered it. */
  module: string;
  /** The registrar export, when the module has more than one. */
  register?: string;
  required: string[];
  optional: string[];
}

/** Modules holding `register*` exports that call `server.tool(...)`. */
const TOOL_MODULES = [
  "src/tools/beans-prime.ts",
  "src/tools/check-deps.ts",
  "src/tools/folio-init.ts",
  "src/tools/preferences.ts",
  "src/tools/preview.ts",
  "src/tools/readme-audit.ts",
  "src/tools/readme-sync.ts",
  "src/tools/skill-fetch.ts",
  "src/tools/stakeholder-map.ts",
  "src/tools/translation.ts",
  "src/tools/workflow.ts",
] as const;

export async function captureTools(): Promise<{ tools: CapturedTool[]; problems: string[] }> {
  const tools: CapturedTool[] = [];
  const problems: string[] = [];

  for (const rel of TOOL_MODULES) {
    let mod: Record<string, unknown>;
    try {
      mod = (await import(join(ROOT, rel))) as Record<string, unknown>;
    } catch (e) {
      problems.push(`${rel}: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    const registrars = Object.entries(mod).filter(
      ([k, v]) => typeof v === "function" && k.startsWith("register"),
    );
    if (registrars.length === 0) {
      // Reported, not skipped: a module in the list with no registrar means the
      // list is stale, which is the corpus-path defect this repo keeps hitting.
      problems.push(`${rel}: no register* export — is TOOL_MODULES stale?`);
      continue;
    }

    for (const [name, fn] of registrars) {
      const capture = {
        tool(toolName: string, description: string, shape: Record<string, unknown>) {
          const keys = Object.keys(shape ?? {});
          const required: string[] = [];
          const optional: string[] = [];
          for (const k of keys) {
            const z = (shape as Record<string, { isOptional?: () => boolean }>)[k];
            let isOpt = false;
            try {
              isOpt = z?.isOptional?.() === true;
            } catch {
              isOpt = false;
            }
            (isOpt ? optional : required).push(k);
          }
          tools.push({
            name: toolName,
            description: String(description),
            module: rel,
            ...(registrars.length > 1 ? { register: name } : {}),
            required,
            optional,
          });
        },
      };
      try {
        (fn as (s: unknown, root: string) => void)(capture, ROOT);
      } catch (e) {
        problems.push(`${rel}#${name}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return { tools: tools.sort((a, b) => a.name.localeCompare(b.name)), problems };
}

if (import.meta.main) {
  const { tools, problems } = await captureTools();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ tools, problems }, null, 2));
  } else {
    console.log(`MCP tools served: ${tools.length}\n`);
    for (const t of tools) {
      const req = t.required.length > 0 ? `req=[${t.required.join(",")}]` : "";
      const opt = t.optional.length > 0 ? `opt=[${t.optional.join(",")}]` : "";
      console.log(`  ${t.name.padEnd(22)} ${t.module.replace("src/tools/", "").padEnd(20)} ${req} ${opt}`);
    }
  }
  if (problems.length > 0) {
    console.error(`\n${problems.length} module(s) could not be read:`);
    for (const p of problems) console.error(`  ✗ ${p}`);
    // EXIT 2, not 1 — this is could-not-determine, and here it is load-bearing
    // rather than pedantic. The list above is what `mcp-contract` compares Tool
    // nodes AGAINST, so an incomplete capture makes every unread module look
    // like a tool the server does not serve. A short list passing for a complete
    // one is the failure this repository names everywhere else, and exit 1 would
    // have put it in the same bucket as a real disagreement.
    console.error("\n  The captured surface is INCOMPLETE, so no equivalence verdict may");
    console.error("  be drawn from it. That is exit 2, not a failure and not a pass.");
    process.exit(2);
  }
}
