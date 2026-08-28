/**
 * Content validation and build tools.
 *
 * Tools:
 *   content_validate      — Validate content objects (schema + constraints + AST)
 *   content_profile_check — Check every block against the folio's declared profile
 *   content_build         — Build content objects → LaTeX chapters
 *   content_list          — List all content objects with status
 *
 * @module folio-assistant/adapters/document/tools/validate
 */

import { z } from "zod";
import { spawnSync } from "child_process";
import { existsSync, readdirSync } from "fs";
import { join, basename } from "path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { REPO_ROOT, CONTENT_DIR } from "../paths.js";
import { checkFolioProfile, formatProfileCheck } from "../../../content/pipeline/profile-check.js";
import {
  readBlockManifest,
  readUnlabelledBlockManifest,
} from "../../../content/pipeline/qa-utils.js";
// Note: paths are resolved from the document adapter's paths module.

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

        // Profile conformance runs on every validate rather than as an
        // opt-in tool. It is the one check that knows what *kind* of folio
        // this is, and a document folio that has quietly acquired a theorem
        // fails at publication — long after the block was written, and in a
        // renderer whose error message says nothing about profiles.
        const profileResult = checkFolioProfile(REPO_ROOT, paperDir);
        totalErrors += profileResult.violations.length;

        return {
          content: [{
            type: "text" as const,
            text: `Validation: ${totalErrors} error(s), ${totalWarnings} warning(s)\n\n` +
              results.join("\n\n") +
              `\n\n## Profile conformance\n\n${formatProfileCheck(profileResult)}`,
          }],
        };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Validation error: ${e instanceof Error ? e.message : String(e)}` }],
        };
      }
    },
  );

  // ── content_profile_check ────────────────────────────────────

  server.tool(
    "content_profile_check",
    "Check every block against the content profile the folio declares in " +
    "folio.config.json. A `document` folio must hold no block whose assertion " +
    "is a formal mathematical claim, and no `lean` field or `.lean` sibling " +
    "anywhere. Run standalone to check the whole folio; content_validate runs " +
    "it per document.",
    {
      document: z.string().optional()
        .describe("Restrict to one document under content/ (default: the whole folio)"),
    },
    async ({ document }) => {
      try {
        const scope = document ? join(CONTENT_DIR, document) : CONTENT_DIR;
        if (document && !existsSync(scope)) {
          return { content: [{ type: "text" as const, text: `Document not found: ${scope}` }] };
        }
        const result = checkFolioProfile(REPO_ROOT, scope);
        return { content: [{ type: "text" as const, text: formatProfileCheck(result) }] };
      } catch (e) {
        return {
          content: [{ type: "text" as const, text: `Profile check error: ${e instanceof Error ? e.message : String(e)}` }],
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
            // Header count comes from what is actually listed, not from how
            // many `.ts` files the directory holds — those differ by the
            // chapter manifest and any helper module, and a count that
            // disagrees with the rows beneath it is worse than no count.
            const rows: string[] = [];

            for (const name of manifests) {
              const tsPath = join(chPath, `${name}.ts`);

              // A block's kind comes from the BUILDER it calls, not from a
              // literal `kind:` field — `prose({...})` yields `kind: "prose"`
              // at runtime and the source never spells it out. This used to
              // match a `kind:` string literal, which no builder-authored
              // manifest contains, so every block in every folio listed as
              // `unknown`. `readBlockManifest` is the canonical reader — masked
              // against strings and comments, and mapping DAK's kebab-case
              // kinds back from their camelCase builders — and is what the QA
              // sweep, the content graph and the propagation sweeps all use.
              //
              // It also returns `undefined` for a `.ts` that is not a block, so
              // the chapter manifest sitting in the same directory stops being
              // listed as a content object of that chapter.
              const block =
                readBlockManifest(tsPath) ?? readUnlabelledBlockManifest(tsPath);
              if (!block) continue;

              const companions = [
                existsSync(join(chPath, `${name}.md`)) ? "md" : "",
                existsSync(join(chPath, `${name}.lean`)) ? "lean" : "",
              ].filter(Boolean).join(", ");

              rows.push(`  ${block.kind.padEnd(12)} ${block.label.padEnd(35)} [${companions}]`);
            }

            lines.push(`\n## ${chDir} (${rows.length} block${rows.length === 1 ? "" : "s"})`);
            lines.push(...rows);
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

/**
 * The build step that emits LaTeX. Paper adapter only.
 *
 * A document folio's build is `document_render_md` — Markdown assembly, no
 * `.tex` anywhere. Registering `content_build` on one would offer a build that
 * produces chapter files nothing in that folio can compile.
 */
export function registerPaperBuildTools(server: McpServer): void {
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
}
