/**
 * Read-only audit tools for the paper adapter — the deterministic audit cores
 * from content/pipeline exposed as MCP tools returning structured findings.
 * None mutate content. Wraps the scripts via {@link runPipeline}.
 *
 * Tools (all read-only):
 *   latex_overfull          — overfull \hbox reporter (rendering QA)
 *   qa_staleness            — stale QA-sidecar findings vs current content
 *   tex_source_audit        — audit rendered .tex source for issues
 *   dangling_remarks        — remarks not attached to a definition/result
 *   conditional_class_audit — conditional-class banner discipline
 *   section_title_audit     — section-title conventions
 *   wall_violations         — base-ring / domain-boundary ("wall") violations
 *   defterm_validate        — defined-term consistency
 *   value_validate          — computed-value consistency
 *   glossary_candidates     — propose glossary candidates
 *   lean_compile_audit      — Lean compile/witness status (list | stale)
 *
 * @module adapters/paper/tools/audit
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runPipeline, asToolText, autoPaper } from "./_pipeline.js";

/** Uniform read-only audits: no required args (optionally `--json`). */
const AUDITS: { tool: string; script: string; json?: boolean; desc: string }[] = [
  { tool: "latex_overfull", script: "latex-overfull-report", json: true,
    desc: "Report overfull \\hbox (table/math/identifier spills) in the rendered LaTeX. Read-only." },
  { tool: "qa_staleness", script: "qa-staleness", json: true,
    desc: "List QA-sidecar findings that are stale relative to current content. Read-only." },
  { tool: "tex_source_audit", script: "audit-tex-source",
    desc: "Audit the rendered .tex source for known issues (seams, spacing, etc.). Read-only." },
  { tool: "dangling_remarks", script: "find-dangling-remarks",
    desc: "Find remark blocks not attached to a definition/result (dangling). Read-only." },
  { tool: "conditional_class_audit", script: "conditional-class-banner-audit",
    desc: "Check conditional-class banner discipline on theorem-like blocks. Read-only." },
  { tool: "section_title_audit", script: "qa-section-title-audit",
    desc: "Audit section titles against the project's title conventions. Read-only." },
  { tool: "wall_violations", script: "wall-violations-sweep",
    desc: "Sweep for base-ring / domain-boundary ('wall') violations in Lean/content. Read-only." },
  { tool: "defterm_validate", script: "validate-defterm",
    desc: "Validate defined-term (glossary) consistency across the corpus. Read-only." },
  { tool: "value_validate", script: "validate-value",
    desc: "Validate computed/derived-value consistency across the corpus. Read-only." },
  { tool: "glossary_candidates", script: "glossary-candidates",
    desc: "Propose glossary candidate terms from the corpus. Read-only." },
  { tool: "wiring_audit", script: "audit-wiring",
    desc: "Audit script/hook wiring (no dangling references). Read-only." },
  { tool: "conjectural_propagation", script: "conjectural-propagation-audit",
    desc: "Audit propagation of conjectural status through dependent results. Read-only." },
  { tool: "trivial_skeleton_audit", script: "trivial-skeleton-audit",
    desc: "Flag trivial/placeholder proof skeletons. Read-only (prints to stdout)." },
  { tool: "tex_validate", script: "validate-tex", json: true,
    desc: "Structural validation of rendered .tex (no compile). Read-only." },
];

export function registerAuditTools(server: McpServer): void {
  for (const a of AUDITS) {
    server.tool(a.tool, a.desc, {}, async () =>
      asToolText(a.tool, runPipeline(a.script, a.json ? ["--json"] : [])),
    );
  }

  // lean_compile_audit has read-only modes.
  server.tool(
    "lean_compile_audit",
    "Lean compile / witness status audit. mode=list (current status, read-only) " +
      "or mode=stale (witnesses stale vs source hash, read-only).",
    {
      mode: z.enum(["list", "stale"]).default("list").describe("list | stale (both read-only)"),
    },
    async ({ mode }) => asToolText("lean_compile_audit", runPipeline("lean-compile-audit", [`--${mode}`])),
  );

  // proof ↔ narrative equivalence sweep (read-only via --dry-run --json).
  server.tool(
    "proof_narrative_equiv",
    "Audit that each block's narrative proof matches its Lean counterpart " +
      "(read-only: runs as a dry-run, JSON findings).",
    {},
    async () => asToolText("proof_narrative_equiv", runPipeline("proof-narrative-lean-equiv-sweep", ["--dry-run", "--json"])),
  );

  // status-section audit (per paper).
  server.tool(
    "status_sections_audit",
    "Audit the per-block status sections for the paper (read-only).",
    {
      paper: z.string().optional().describe("Paper name (auto-detected if only one)"),
    },
    async ({ paper }) => {
      const p = autoPaper(paper);
      const args = p ? ["--paper", p] : [];
      return asToolText("status_sections_audit", runPipeline("audit-status-sections", args));
    },
  );
}
