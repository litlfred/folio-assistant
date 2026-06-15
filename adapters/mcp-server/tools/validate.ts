/**
 * Content validation and build tools.
 *
 * Tools:
 *   content_validate  — Validate content objects (schema + constraints + AST)
 *   content_build     — Build content objects → LaTeX chapters
 *   content_list      — List all content objects with status
 *
 * @module scripts/mcp-server/tools/validate
 */

import { z } from "zod";
import { execSync, spawnSync } from "child_process";
import { existsSync, readdirSync, readFileSync } from "fs";
import { join, basename } from "path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { REPO_ROOT, CONTENT_DIR, BUILD_DIR } from "../paths.js";

/** Find all paper directories under content/. */
function discoverPapers(): string[] {
  if (!existsSync(CONTENT_DIR)) return [];
  return readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !d.name.startsWith(".") &&
      d.name !== "schema" && d.name !== "pipeline" && d.name !== "node_modules")
    .map(d => d.name);
}

/** Find all .ts manifest files in a directory (non-recursive). */
function findManifests(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith(".ts") && !f.startsWith("_") && !f.startsWith("index"))
    .map(f => basename(f, ".ts"));
}

/** Find all chapter dirs under a paper dir. */
function findChapterDirs(paperDir: string): string[] {
  if (!existsSync(paperDir)) return [];
  return readdirSync(paperDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

export function registerValidateTools(server: McpServer): void {

  // ── content_validate ─────────────────────────────────────────

  server.tool(
    "content_validate",
    "Validate content objects: Zod schema checks, constraint rules " +
    "(file existence, cross-refs, lean requirements), and LaTeX AST " +
    "validation of rendered output.",
    {
      paper: z.string().optional()
        .describe("Paper name (auto-detected if only one paper exists)"),
      chapter: z.string().optional()
        .describe("Specific chapter dir to validate (default: all)"),
    },
    async ({ paper, chapter }) => {
      try {
        const papers = discoverPapers();
        if (papers.length === 0) {
          return {
            content: [{ type: "text" as const, text: "No papers found in content/" }],
          };
        }

        const paperName = paper || papers[0];
        const paperDir = join(CONTENT_DIR, paperName);

        if (!existsSync(paperDir)) {
          return {
            content: [{ type: "text" as const, text: `Paper not found: ${paperDir}` }],
          };
        }

        // Run validation pipeline via bun
        const results: string[] = [];
        let totalErrors = 0;
        let totalWarnings = 0;

        if (chapter) {
          // Validate a single chapter dir
          const chapterPath = join(paperDir, chapter);
          if (!existsSync(chapterPath)) {
            return {
              content: [{ type: "text" as const, text: `Chapter not found: ${chapterPath}` }],
            };
          }
          const result = spawnSync("bun", [
            "run", join(CONTENT_DIR, "pipeline/validate.ts"),
            chapterPath,
          ], {
            cwd: CONTENT_DIR,
            stdio: "pipe",
            timeout: 60_000,
          });
          const output = result.stdout?.toString() || "";
          const stderr = result.stderr?.toString() || "";
          results.push(`## ${chapter}\n${output}${stderr ? `\nStderr: ${stderr}` : ""}`);
          totalErrors += (output.match(/✗/g) || []).length;
          totalWarnings += (output.match(/⚠/g) || []).length;
        } else {
          // Validate whole paper (paper manifest + all chapters)
          const result = spawnSync("bun", [
            "run", join(CONTENT_DIR, "pipeline/validate.ts"),
            paperDir,
          ], {
            cwd: CONTENT_DIR,
            stdio: "pipe",
            timeout: 120_000,
          });
          const output = result.stdout?.toString() || "";
          const stderr = result.stderr?.toString() || "";
          results.push(output + (stderr ? `\nStderr: ${stderr}` : ""));
          totalErrors += (output.match(/✗/g) || []).length;
          totalWarnings += (output.match(/⚠/g) || []).length;
        }

        return {
          content: [{
            type: "text" as const,
            text: `Validation: ${totalErrors} error(s), ${totalWarnings} warning(s)\n\n` +
              results.join("\n\n"),
          }],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Validation error: ${e instanceof Error ? e.message : String(e)}` }],
        };
      }
    },
  );

  // ── content_build ────────────────────────────────────────────

  server.tool(
    "content_build",
    "Build content objects into LaTeX chapter files. Runs validation " +
    "first, then renders .ts + .md → .tex output.",
    {
      paper: z.string().optional()
        .describe("Paper name (auto-detected if only one)"),
      output_dir: z.string().optional()
        .describe("Output directory for .tex files (default: chapters/)"),
    },
    async ({ paper, output_dir }) => {
      try {
        const papers = discoverPapers();
        const paperName = paper || papers[0];
        if (!paperName) {
          return {
            content: [{ type: "text" as const, text: "No papers found in content/" }],
          };
        }

        const paperDir = join(CONTENT_DIR, paperName);
        const docTs = join(paperDir, `${paperName}.ts`);
        const outDir = output_dir || join(REPO_ROOT, "chapters");

        if (!existsSync(docTs)) {
          return {
            content: [{ type: "text" as const, text: `Paper manifest not found: ${docTs}` }],
          };
        }

        const result = spawnSync("bun", [
          "run", join(CONTENT_DIR, "pipeline/build.ts"),
          docTs,
          "--out-dir", outDir,
        ], {
          cwd: CONTENT_DIR,
          stdio: "pipe",
          timeout: 120_000,
        });

        const output = result.stdout?.toString() || "";
        const stderr = result.stderr?.toString() || "";

        return {
          content: [{
            type: "text" as const,
            text: `Build ${result.status === 0 ? "succeeded" : "failed"} (exit ${result.status})\n\n` +
              output + (stderr ? `\nStderr: ${stderr}` : ""),
          }],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Build error: ${e instanceof Error ? e.message : String(e)}` }],
        };
      }
    },
  );

  // ── content_list ─────────────────────────────────────────────

  server.tool(
    "content_list",
    "List all content objects across all papers with their kind, " +
    "label, lean status, and companion files.",
    {
      paper: z.string().optional()
        .describe("Paper name (default: all papers)"),
    },
    async ({ paper }) => {
      try {
        const papers = paper ? [paper] : discoverPapers();
        const lines: string[] = [];

        for (const p of papers) {
          const paperDir = join(CONTENT_DIR, p);
          lines.push(`# ${p}`);

          for (const chDir of findChapterDirs(paperDir)) {
            const chPath = join(paperDir, chDir);
            const manifests = findManifests(chPath);
            lines.push(`\n## ${chDir} (${manifests.length} objects)`);

            for (const name of manifests) {
              const hasMd = existsSync(join(chPath, `${name}.md`));
              const hasLean = existsSync(join(chPath, `${name}.lean`));
              const companions = [
                hasMd ? "md" : "",
                hasLean ? "lean" : "",
              ].filter(Boolean).join(", ");

              // Try to read the .ts to get kind/label
              try {
                const tsContent = readFileSync(join(chPath, `${name}.ts`), "utf-8");
                const kindMatch = tsContent.match(/kind:\s*["'](\w+)["']/);
                const labelMatch = tsContent.match(/label:\s*["']([^"']+)["']/);

                const kind = kindMatch?.[1] || "unknown";
                const label = labelMatch?.[1] || name;

                lines.push(`  ${kind.padEnd(12)} ${label.padEnd(35)} [${companions}]`);
              } catch {
                lines.push(`  ${"?".padEnd(12)} ${name.padEnd(35)} ${"".padEnd(19)} [${companions}]`);
              }
            }
          }
        }

        return {
          content: [{ type: "text" as const, text: lines.join("\n") }],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `List error: ${e instanceof Error ? e.message : String(e)}` }],
        };
      }
    },
  );
}
