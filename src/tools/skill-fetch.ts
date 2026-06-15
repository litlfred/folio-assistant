import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

// Session-level cache (lives for the lifetime of the MCP server process)
const skillCache = new Map<string, { content: string; fetchedAt: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Registry of known external skill packages (reference-only, not synced)
const REFERENCE_PACKAGES: Record<string, { repo: string; ref: string; skills: Record<string, string> }> = {
  "academic-research-skills": {
    repo: "Imbad0202/academic-research-skills",
    ref: "main",
    skills: {
      "academic-paper-reviewer": "academic-paper-reviewer/SKILL.md",
      "academic-paper-reviewer/quality-rubrics": "academic-paper-reviewer/references/quality_rubrics.md",
      "academic-paper-reviewer/review-criteria": "academic-paper-reviewer/references/review_criteria_framework.md",
      "academic-paper-reviewer/editorial-standards": "academic-paper-reviewer/references/editorial_decision_standards.md",
      "academic-paper-reviewer/devils-advocate": "academic-paper-reviewer/agents/devils_advocate_reviewer_agent.md",
      "academic-paper-reviewer/methodology-reviewer": "academic-paper-reviewer/agents/methodology_reviewer_agent.md",
      "academic-paper-reviewer/domain-reviewer": "academic-paper-reviewer/agents/domain_reviewer_agent.md",
      "academic-paper-reviewer/eic": "academic-paper-reviewer/agents/eic_agent.md",
      "academic-paper-reviewer/editorial-synthesizer": "academic-paper-reviewer/agents/editorial_synthesizer_agent.md",
      "deep-research": "deep-research/SKILL.md",
      "deep-research/source-verification": "deep-research/agents/source_verification_agent.md",
      "deep-research/devils-advocate": "deep-research/agents/devils_advocate_agent.md",
      "deep-research/evidence-hierarchy": "deep-research/references/source_quality_hierarchy.md",
      "deep-research/logical-fallacies": "deep-research/references/logical_fallacies.md",
      "academic-pipeline": "academic-pipeline/SKILL.md",
      "academic-pipeline/integrity-verification": "academic-pipeline/agents/integrity_verification_agent.md",
      "academic-pipeline/claim-verification": "academic-pipeline/references/claim_verification_protocol.md",
    },
  },
};

const LOCAL_SKILLS = [
  "corpus-grep",
  "deployment-auth",
  "editor",
  "todo-review",
  "readability-editing",
  "symbiotic-interaction"
];
export function registerSkillFetchTools(server: McpServer): void {
  server.tool(
    "skill_fetch",
    "Fetch an external skill definition from a reference package (not synced locally). " +
    "Returns the skill's markdown content for the agent to follow. " +
    "Use for Tier 2 escalation: academic-paper-reviewer (multi-perspective review), " +
    "deep-research (evidence grading, fact-check), academic-pipeline (integrity verification).",
    {
      skill: z.string().describe(
        "Skill identifier. Examples: 'academic-paper-reviewer', 'deep-research', " +
        "'academic-pipeline/integrity-verification', 'academic-paper-reviewer/quality-rubrics'"
      ),
      package_name: z.string().default("academic-research-skills").describe(
        "Package name from the reference registry. Default: 'academic-research-skills'"
      ),
    },
    async ({ skill, package_name }) => {
      if (package_name === "folio-assistant") {
        if (!LOCAL_SKILLS.includes(skill)) {
          return {
            content: [{
              type: "text" as const,
              text: `Error: Unknown local skill '${skill}'. Available: ${LOCAL_SKILLS.join(", ")}`,
            }],
          };
        }
        
        // Since skill-fetch.ts is in src/tools/, skills are in src/skills/
        const srcDir = resolve(__dirname, "..");
        const skillPath = join(srcDir, "skills", `${skill}.md`);
        
        if (!existsSync(skillPath)) {
          return {
            content: [{
              type: "text" as const,
              text: `Error: Skill file not found at ${skillPath}`,
            }],
          };
        }
        
        const content = readFileSync(skillPath, "utf-8");
        return {
          content: [{
            type: "text" as const,
            text: `# ${skill} (served locally from folio-assistant)\n\n${content}`,
          }],
        };
      }

      const pkg = REFERENCE_PACKAGES[package_name];
      if (!pkg) {
        return {
          content: [{
            type: "text" as const,
            text: `Error: Unknown package '${package_name}'. Available: ${Object.keys(REFERENCE_PACKAGES).join(", ")}, folio-assistant`,
          }],
        };
      }

      const skillPath = pkg.skills[skill];
      if (!skillPath) {
        return {
          content: [{
            type: "text" as const,
            text: `Error: Unknown skill '${skill}' in package '${package_name}'. Available skills:\n${Object.keys(pkg.skills).map(s => `  - ${s}`).join("\n")}`,
          }],
        };
      }

      // Check cache
      const cacheKey = `${package_name}/${skill}`;
      const cached = skillCache.get(cacheKey);
      if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return {
          content: [{
            type: "text" as const,
            text: `# ${skill} (cached)\n\n${cached.content}`,
          }],
        };
      }

      // Fetch from GitHub raw
      const url = `https://raw.githubusercontent.com/${pkg.repo}/${pkg.ref}/${skillPath}`;
      try {
        const resp = await fetch(url);
        if (!resp.ok) {
          return {
            content: [{
              type: "text" as const,
              text: `Error: Failed to fetch ${url} — HTTP ${resp.status} ${resp.statusText}`,
            }],
          };
        }
        const content = await resp.text();
        skillCache.set(cacheKey, { content, fetchedAt: Date.now() });
        return {
          content: [{
            type: "text" as const,
            text: `# ${skill} (fetched from ${pkg.repo})\n\n${content}`,
          }],
        };
      } catch (err) {
        return {
          content: [{
            type: "text" as const,
            text: `Error: Network failure fetching ${url} — ${err instanceof Error ? err.message : String(err)}`,
          }],
        };
      }
    },
  );

  server.tool(
    "skill_list",
    "List available external skills from reference packages (Tier 2 escalation skills). " +
    "Shows what can be fetched via skill_fetch.",
    {},
    async () => {
      const lines: string[] = ["# Available External Skills (Reference Packages)\n"];
      
      lines.push(`## folio-assistant (local)`);
      for (const localSkill of LOCAL_SKILLS) {
        lines.push(`- **${localSkill}** — \`folio-assistant/src/skills/${localSkill}.md\``);
      }
      lines.push("");

      for (const [pkgName, pkg] of Object.entries(REFERENCE_PACKAGES)) {
        lines.push(`## ${pkgName} (${pkg.repo})\n`);
        for (const [skillId, path] of Object.entries(pkg.skills)) {
          const cached = skillCache.get(`${pkgName}/${skillId}`);
          const status = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS ? " (cached)" : "";
          lines.push(`- **${skillId}**${status} — \`${path}\``);
        }
        lines.push("");
      }
      return {
        content: [{ type: "text" as const, text: lines.join("\n") }],
      };
    },
  );
}
