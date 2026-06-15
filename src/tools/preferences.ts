/**
 * Preference storage — remembers user's rendering preferences.
 *
 * Tools:
 *   paper_preferences  — Get or set rendering preferences
 *
 * Stored in .qou-prefs.json at repo root (gitignored).
 *
 * @module scripts/mcp-server/tools/preferences
 */

import { z } from "zod";
import { existsSync, readFileSync, writeFileSync } from "fs";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolve } from "path";

// Resolve prefs file from repo root (folio-assistant/src/tools/ → ../../..)
const REPO_ROOT = resolve(import.meta.dir, "../../..");
const PREFS_FILE = resolve(REPO_ROOT, ".folio-prefs.json");

/** Default preferences. */
const DEFAULTS = {
  render_format: "pdf" as "pdf" | "html",
  render_scope: "full" as "full" | "chapter" | "section",
  latex_engine: "pdflatex" as "pdflatex" | "lualatex" | "xelatex",
  math_renderer: "katex" as "katex" | "mathjax",
  auto_preview: true,
  formula_dpi: 300,
  default_chapter: null as string | null,
  print_mode: "compact" as "formal" | "compact",
  compact_inline_refs: true,
};

type Prefs = typeof DEFAULTS;

function loadPrefs(): Prefs {
  if (!existsSync(PREFS_FILE)) return { ...DEFAULTS };
  try {
    const raw = JSON.parse(readFileSync(PREFS_FILE, "utf-8"));
    return { ...DEFAULTS, ...raw };
  } catch {
    return { ...DEFAULTS };
  }
}

function savePrefs(prefs: Prefs): void {
  writeFileSync(PREFS_FILE, JSON.stringify(prefs, null, 2) + "\n");
}

export function registerPreferenceTools(server: McpServer): void {

  server.tool(
    "paper_preferences",
    "Get or set user rendering preferences. Preferences persist across " +
    "sessions in .qou-prefs.json. Set action='get' to view current, " +
    "'set' to update, 'reset' to restore defaults.",
    {
      action: z.enum(["get", "set", "reset"]).default("get")
        .describe("Action: get current, set values, or reset to defaults"),
      render_format: z.enum(["pdf", "html"]).optional()
        .describe("Preferred output format"),
      render_scope: z.enum(["full", "chapter", "section"]).optional()
        .describe("Default render scope"),
      latex_engine: z.enum(["pdflatex", "lualatex", "xelatex"]).optional()
        .describe("LaTeX engine"),
      math_renderer: z.enum(["katex", "mathjax"]).optional()
        .describe("Math renderer for HTML output"),
      auto_preview: z.boolean().optional()
        .describe("Automatically open in browser after render"),
      formula_dpi: z.number().optional()
        .describe("DPI for formula preview PNG"),
      default_chapter: z.string().optional()
        .describe("Default chapter to render when scope=chapter"),
      print_mode: z.enum(["formal", "compact"]).optional()
        .describe("Print mode: formal (affiliations, expanded) or compact (dense, no affiliations)"),
      compact_inline_refs: z.boolean().optional()
        .describe("In compact mode, include examples/remarks directly referenced by blocks in the view"),
    },
    async ({ action, ...updates }) => {
      if (action === "reset") {
        savePrefs({ ...DEFAULTS });
        return {
          content: [{
            type: "text" as const,
            text: "Preferences reset to defaults:\n" + JSON.stringify(DEFAULTS, null, 2),
          }],
        };
      }

      const prefs = loadPrefs();

      if (action === "get") {
        return {
          content: [{
            type: "text" as const,
            text: "Current preferences:\n" + JSON.stringify(prefs, null, 2),
          }],
        };
      }

      // action === "set"
      const changed: string[] = [];
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && key in prefs) {
          (prefs as any)[key] = value;
          changed.push(`${key} = ${JSON.stringify(value)}`);
        }
      }

      if (changed.length === 0) {
        return {
          content: [{ type: "text" as const, text: "No changes specified. Current:\n" + JSON.stringify(prefs, null, 2) }],
        };
      }

      savePrefs(prefs);
      return {
        content: [{
          type: "text" as const,
          text: `Updated ${changed.length} preference(s):\n${changed.join("\n")}\n\nFull preferences:\n${JSON.stringify(prefs, null, 2)}`,
        }],
      };
    },
  );
}
