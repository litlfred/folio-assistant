/**
 * Dependency checking tool — reports what's installed and what's missing.
 *
 * Tools:
 *   check_dependencies  — Check all required/optional dependencies
 *
 * @module scripts/mcp-server/tools/check-deps
 */

import { z } from "zod";
import { execSync } from "child_process";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

interface DepCheck {
  name: string;
  required: boolean;
  check: () => string;
  install_hint: string;
}

const DEPS: DepCheck[] = [
  {
    name: "bun",
    required: true,
    check: () => {
      const v = execSync("bun --version", { encoding: "utf-8" }).trim();
      return `v${v}`;
    },
    install_hint: "curl -fsSL https://bun.sh/install | bash",
  },
  {
    name: "latexmk",
    required: true,
    check: () => {
      const v = execSync("latexmk --version", { encoding: "utf-8" }).split("\n")[0];
      return v;
    },
    install_hint: "apt install latexmk (Ubuntu) / port install latexmk (macOS)",
  },
  {
    name: "pdflatex",
    required: true,
    check: () => {
      execSync("pdflatex --version", { stdio: "pipe" });
      return "available";
    },
    install_hint: "apt install texlive-latex-base (Ubuntu) / port install texlive-latex (macOS)",
  },
  {
    name: "pandoc",
    required: false,
    check: () => {
      const v = execSync("pandoc --version", { encoding: "utf-8" }).split("\n")[0];
      return v;
    },
    install_hint: "apt install pandoc (Ubuntu) / port install pandoc (macOS)",
  },
  {
    name: "pdftoppm",
    required: false,
    check: () => {
      execSync("which pdftoppm", { stdio: "pipe" });
      return "available";
    },
    install_hint: "apt install poppler-utils (Ubuntu) / port install poppler (macOS)",
  },
  {
    name: "lean",
    required: false,
    check: () => {
      const v = execSync("lean --version", { encoding: "utf-8" }).trim();
      return v;
    },
    install_hint: "Use MCP tool: lean_setup",
  },
  {
    name: "lake",
    required: false,
    check: () => {
      execSync("which lake", { stdio: "pipe" });
      return "available";
    },
    install_hint: "Installed with lean via elan",
  },
  {
    name: "uv",
    required: false,
    check: () => {
      const v = execSync("uv --version", { encoding: "utf-8" }).trim();
      return v;
    },
    install_hint: "curl -LsSf https://astral.sh/uv/install.sh | sh",
  },
  {
    name: "rg (ripgrep)",
    required: false,
    check: () => {
      const v = execSync("rg --version", { encoding: "utf-8" }).split("\n")[0];
      return v;
    },
    install_hint: "apt install ripgrep (Ubuntu) / port install ripgrep (macOS)",
  },
  {
    name: "xdg-open",
    required: false,
    check: () => {
      execSync("which xdg-open", { stdio: "pipe" });
      return "available";
    },
    install_hint: "apt install xdg-utils (Ubuntu) / built-in on macOS (as 'open')",
  },
];

export function registerDepsTools(server: McpServer): void {

  server.tool(
    "check_dependencies",
    "Check all required and optional dependencies for the paper writing " +
    "assistant. Reports what's installed, what's missing, and install hints.",
    {
      required_only: z.boolean().default(false)
        .describe("Only check required dependencies"),
    },
    async ({ required_only }) => {
      const results: string[] = [];
      let missingRequired = 0;
      let missingOptional = 0;

      for (const dep of DEPS) {
        if (required_only && !dep.required) continue;

        let status: string;
        try {
          status = dep.check();
        } catch {
          status = "NOT INSTALLED";
          if (dep.required) missingRequired++;
          else missingOptional++;
        }

        const icon = status === "NOT INSTALLED"
          ? (dep.required ? "✗" : "○")
          : "✓";
        const req = dep.required ? "(required)" : "(optional)";
        const hint = status === "NOT INSTALLED"
          ? `\n    Install: ${dep.install_hint}`
          : "";

        results.push(`  ${icon} ${dep.name.padEnd(15)} ${status.padEnd(30)} ${req}${hint}`);
      }

      const summary = missingRequired > 0
        ? `${missingRequired} required dep(s) missing!`
        : `All required deps present. ${missingOptional} optional dep(s) missing.`;

      return {
        content: [{
          type: "text" as const,
          text: `Dependency check:\n${results.join("\n")}\n\n${summary}`,
        }],
      };
    },
  );
}
