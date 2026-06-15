/**
 * Preview tools — open rendered output in the browser.
 *
 * Tools:
 *   paper_preview  — Open a rendered PDF/HTML in the system browser
 *
 * @module scripts/mcp-server/tools/preview
 */

import { z } from "zod";
import { execSync, spawnSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { join } from "path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BUILD_DIR, REPO_ROOT } from "../paths.js";

/** Detect the system's "open" command. */
function getOpenCommand(): string | null {
  // ChromeOS/Linux
  for (const cmd of ["xdg-open", "sensible-browser", "x-www-browser"]) {
    try {
      execSync(`which ${cmd}`, { stdio: "pipe" });
      return cmd;
    } catch {}
  }
  // macOS
  try {
    execSync("which open", { stdio: "pipe" });
    return "open";
  } catch {}
  return null;
}

export function registerPreviewTools(server: McpServer): void {

  server.tool(
    "paper_preview",
    "Open a rendered PDF or HTML file in the system browser. " +
    "Lists available renders if no specific file is given.",
    {
      file: z.string().optional()
        .describe("Specific file to open (path relative to build/ or absolute)"),
      format: z.enum(["pdf", "html", "png"]).optional()
        .describe("Filter by format when listing available renders"),
      list: z.boolean().default(false)
        .describe("Just list available renders without opening"),
    },
    async ({ file, format, list }) => {
      if (!existsSync(BUILD_DIR)) {
        return {
          content: [{
            type: "text" as const,
            text: "No build output found. Run paper_render_pdf or paper_render_html first.",
          }],
        };
      }

      // List available renders
      const files = readdirSync(BUILD_DIR)
        .filter(f => {
          if (format === "pdf") return f.endsWith(".pdf");
          if (format === "html") return f.endsWith(".html");
          if (format === "png") return f.endsWith(".png");
          return f.endsWith(".pdf") || f.endsWith(".html") || f.endsWith(".png");
        })
        .sort();

      if (list || !file) {
        if (files.length === 0) {
          return {
            content: [{
              type: "text" as const,
              text: "No rendered files found. Run paper_render_pdf or paper_render_html first.",
            }],
          };
        }

        const listing = files.map(f => {
          const path = join(BUILD_DIR, f);
          const stat = Bun.file(path);
          return `  ${f}`;
        }).join("\n");

        if (list) {
          return {
            content: [{ type: "text" as const, text: `Available renders:\n${listing}` }],
          };
        }

        // Auto-select: prefer PDF, then HTML
        file = files.find(f => f.endsWith(".pdf")) || files[0];
      }

      // Resolve path
      const fullPath = file!.startsWith("/") ? file! : join(BUILD_DIR, file!);

      if (!existsSync(fullPath)) {
        return {
          content: [{
            type: "text" as const,
            text: `File not found: ${fullPath}\nAvailable: ${files.join(", ")}`,
          }],
        };
      }

      // Open in browser
      const openCmd = getOpenCommand();
      if (!openCmd) {
        return {
          content: [{
            type: "text" as const,
            text: `No browser opener found. File is at: ${fullPath}\n` +
              `On ChromeOS, try: xdg-open ${fullPath}`,
          }],
        };
      }

      spawnSync(openCmd, [fullPath], { stdio: "pipe", detached: true });

      return {
        content: [{
          type: "text" as const,
          text: `Opened: ${fullPath} (via ${openCmd})`,
        }],
      };
    },
  );
}
