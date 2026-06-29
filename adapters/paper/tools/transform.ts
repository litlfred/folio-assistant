/**
 * Transform / maintenance tools for the paper adapter — codemods and dependency
 * rewrites that MUTATE content. All are **dry-run by default**; pass `apply=true`
 * to write. Wraps content/pipeline transform scripts via {@link runPipeline}.
 *
 * Tools:
 *   codemod            — run a content codemod (refterm / val / leanval) over a dir
 *   prune_deps         — prune transitive `uses:` edges that are implied
 *   migrate_lean_refs  — migrate legacy lean-ref syntax to the current form
 *
 * @module adapters/paper/tools/transform
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runPipeline, asToolText, autoPaper } from "./_pipeline.js";

/** codemod id → pipeline script. */
const CODEMODS = {
  refterm: "codemod-refterm",
  val: "codemod-val",
  leanval: "codemod-leanval",
} as const;

export function registerTransformTools(server: McpServer): void {
  // ── codemod ──────────────────────────────────────────────────
  server.tool(
    "codemod",
    "Run a content codemod over a paper/chapter directory. DRY-RUN by default " +
      "(prints a unified diff); set apply=true to write the changes (--write).",
    {
      name: z.enum(["refterm", "val", "leanval"]).describe(
        "refterm = reference-term rewrites; val = validated-builder migration; " +
          "leanval = lean-validation migration",
      ),
      target: z.string().optional().describe(
        "Paper or chapter dir under content/ (default: auto-detected single paper)",
      ),
      apply: z.boolean().default(false).describe("Write changes (default: dry-run)"),
    },
    async ({ name, target, apply }) => {
      const dir = target ?? (autoPaper() ? `content/${autoPaper()}` : undefined);
      if (!dir) {
        return asToolText("codemod", {
          ok: false, script: CODEMODS[name], exitCode: null, stdout: "", stderr: "",
          error: "specify target (no single paper auto-detected under content/)",
        });
      }
      const args = [dir];
      if (apply) args.push("--write");
      return asToolText(`codemod:${name}${apply ? " (apply)" : " (dry-run)"}`, runPipeline(CODEMODS[name], args));
    },
  );

  // ── prune_deps ───────────────────────────────────────────────
  server.tool(
    "prune_deps",
    "Prune transitive `uses:` dependency edges that are already implied. DRY-RUN " +
      "by default; set apply=true to rewrite the .ts manifests (--apply).",
    {
      apply: z.boolean().default(false).describe("Rewrite files (default: dry-run)"),
    },
    async ({ apply }) => {
      const args = apply ? ["--apply"] : [];
      return asToolText(`prune_deps${apply ? " (apply)" : " (dry-run)"}`, runPipeline("prune-transitive-deps", args));
    },
  );

  // ── migrate_lean_refs ────────────────────────────────────────
  server.tool(
    "migrate_lean_refs",
    "Migrate legacy lean-ref syntax to the current `<pkg>:<Decl>` form. DRY-RUN " +
      "by default; set apply=true to write (--write).",
    {
      apply: z.boolean().default(false).describe("Write changes (default: dry-run)"),
    },
    async ({ apply }) => {
      const args = apply ? ["--write"] : [];
      return asToolText(`migrate_lean_refs${apply ? " (apply)" : " (dry-run)"}`, runPipeline("migrate-lean-refs", args));
    },
  );
}
