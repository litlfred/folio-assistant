#!/usr/bin/env bun
/**
 * Spec validation checker (spec-kit Child 2 / issue #752).
 *
 * ## What this script does
 *
 * Verifies that a specification adheres to the declared template
 * (`cat-harness/skills/sdlc/spec-kit/spec-template.md`):
 * - Contains all mandatory sections:
 *   - "User Scenarios & Testing"
 *   - "Requirements"
 *   - "Success Criteria"
 * - Does not reach adjudicated status with unresolved `[NEEDS CLARIFICATION]` markers (SC-004).
 * - Reads specs from issue comments, not from a directory (FR-013).
 * - Implements three-state reporting: exit 0 (pass), exit 1 (finding), exit 2 (could not determine).
 *
 * ## Usage
 *
 * ```sh
 * bun run cat-harness/scripts/check-spec.ts --issue 730
 * bun run cat-harness/scripts/check-spec.ts --file path/to/spec.md
 * ```
 *
 * @covers schemas
 * @graphNode tool
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  MANDATORY_SPEC_SECTIONS,
  loadDeclaredSpecTemplate,
  validateSpec,
  type SpecValidationResult,
} from "../schemas/spec-template.ts";

/** Default path to the declared spec template relative to repo root. */
export const DEFAULT_TEMPLATE_PATH = join(
  "cat-harness",
  "skills",
  "sdlc",
  "spec-kit",
  "spec-template.md"
);

export interface FetchResult {
  state: "ok" | "unknown";
  content?: string;
  reason?: string;
}

/**
 * Fetch comments for an issue using GitHub CLI (`gh`).
 * Returns state "unknown" if the tool fails or network is unreachable.
 */
export function fetchIssueComments(
  issueNumber: number,
  repo = "litlfred/folio-assistant"
): FetchResult {
  try {
    const res = spawnSync("gh", ["api", `repos/${repo}/issues/${issueNumber}/comments`], {
      encoding: "utf-8",
    });
    if (res.status !== 0) {
      return {
        state: "unknown",
        reason: `gh api exited with code ${res.status}: ${res.stderr || "unknown error"}`,
      };
    }
    const comments = JSON.parse(res.stdout);
    if (!Array.isArray(comments)) {
      return {
        state: "unknown",
        reason: "GitHub API response was not an array of comments",
      };
    }
    // Find comments that look like a spec
    const specComments = comments.filter((c: { body?: string }) => {
      const b = c.body || "";
      return (
        b.includes("Feature Specification") ||
        b.includes("User Scenarios & Testing") ||
        (b.includes("## Requirements") && b.includes("## Success Criteria"))
      );
    });

    if (specComments.length === 0) {
      return {
        state: "ok",
        content: undefined,
      };
    }

    // Return the latest spec comment
    const latest = specComments[specComments.length - 1];
    return {
      state: "ok",
      content: latest.body,
    };
  } catch (err: unknown) {
    return {
      state: "unknown",
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Run validation on a spec text against the declared template.
 */
export function checkSpecText(
  specText: string,
  templatePath: string = DEFAULT_TEMPLATE_PATH
): SpecValidationResult {
  let mandatory = MANDATORY_SPEC_SECTIONS;
  if (existsSync(templatePath)) {
    try {
      const declared = loadDeclaredSpecTemplate(templatePath);
      mandatory = declared.mandatorySections as unknown as typeof MANDATORY_SPEC_SECTIONS;
    } catch {
      // Fallback to constants if template parsing encounters error
    }
  }

  return validateSpec(specText, { mandatorySections: mandatory });
}

// ── CLI execution ────────────────────────────────────────────────

if (import.meta.main) {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.length === 0) {
    console.log(`usage: bun run cat-harness/scripts/check-spec.ts [--issue <number>] [--file <path>] [--require-adjudicated]

Validates that a spec adheres to the declared spec-kit template:
- All mandatory sections present ("User Scenarios & Testing", "Requirements", "Success Criteria")
- Unresolved [NEEDS CLARIFICATION] markers block Adjudicated status (SC-004)
- Three-state reporting: 0 = pass, 1 = finding, 2 = could not determine (FR-005)`);
    process.exit(0);
  }

  const issueIdx = args.indexOf("--issue");
  const fileIdx = args.indexOf("--file");
  const requireAdjudicated = args.includes("--require-adjudicated");

  let specContent: string | undefined;

  if (issueIdx !== -1 && args[issueIdx + 1]) {
    const issueNum = parseInt(args[issueIdx + 1], 10);
    if (isNaN(issueNum)) {
      console.error(`Invalid issue number: ${args[issueIdx + 1]}`);
      process.exit(2);
    }

    console.log(`Reading spec from issue #${issueNum}...`);
    const fetched = fetchIssueComments(issueNum);
    if (fetched.state === "unknown") {
      console.error(`could not determine: ${fetched.reason}`);
      process.exit(2);
    }
    if (!fetched.content) {
      console.error(`finding: issue #${issueNum} carries no reachable spec comment (FR-003, FR-004)`);
      process.exit(1);
    }
    specContent = fetched.content;
  } else if (fileIdx !== -1 && args[fileIdx + 1]) {
    const filePath = resolve(args[fileIdx + 1]);
    if (!existsSync(filePath)) {
      console.error(`could not determine: file not found at ${filePath}`);
      process.exit(2);
    }
    specContent = readFileSync(filePath, "utf-8");
  } else {
    console.error("Please specify either --issue <number> or --file <path>");
    process.exit(2);
  }

  const result = validateSpec(specContent, { requireAdjudicated });

  if (result.state === "pass") {
    console.log(
      `✓ Spec is valid (${result.status || "no status specified"}, ${
        result.missingSections.length
      } missing sections, ${result.unresolvedClarifications.length} unresolved clarifications)`
    );
    process.exit(0);
  } else {
    console.error(`✗ Spec validation failed with ${result.findings.length} finding(s):`);
    for (const f of result.findings) {
      console.error(`  - ${f}`);
    }
    process.exit(1);
  }
}
