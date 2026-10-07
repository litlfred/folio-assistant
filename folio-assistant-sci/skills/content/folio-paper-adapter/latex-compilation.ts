import type { SkillDefinition } from "../../../../cat-harness/skills/framework/types.js";

export const latexCompilation: SkillDefinition = {
  id: "latex-compilation",
  name: "LaTeX Compilation",
  description:
    "Compile LaTeX documents to PDF with pdflatex/latexmk and safe shell-escape isolation.",
  requiredCapabilities: [
    { capabilityId: "latex-compiler", degradation: "fail" },
  ],
  routingPatterns: ["compile\\s+latex", "latexmk", "build.*pdf", "compile.*tex"],
  tags: ["compilation", "latex", "pdf"],
};
