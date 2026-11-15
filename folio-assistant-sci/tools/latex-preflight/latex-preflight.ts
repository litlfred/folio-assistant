import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

// ── The TeX checks, and the SECOND authoring skill with no mechanism ──
//
// `latex-authoring` is not satisfied here, and the reason is now a pattern
// rather than an accident. Its contract requires `documentClass` and
// `mainFile` — what you are AUTHORING. Nothing in the corpus accepts either:
// `generate-main-tex` takes `--preamble`, `--chapters-dir` and `--out`.
//
// That is the same shape as `proof-verification` one group over, whose
// contract requires `projectRoot` and finds no taker. **Authoring skills
// name the artefact you are creating; the corpus has checking mechanisms.**
// Two instances make it worth stating: a contract written from the authoring
// side does not become satisfiable by pointing a checker at it, and forcing
// the edge would make the node lie about its interface. Recorded on `jh2j`.
//
// These two satisfy `latex-validation`, which matches them exactly —
// "validate LaTeX source files for syntactic correctness, structural
// consistency, and adherence to project conventions" — and has no contract
// to contradict. Complementary rather than alternative: one stops a compile
// from failing, the other reports a defect in a compile that succeeded.
export default toolFactory((t) =>
  defineTool({
    id: "latex-preflight",
    title: "LaTeX preflight",
    description:
      "Lint TeX source for the pdflatex-compile failure classes a permissive AST parser accepts — the ones that pass validation and then break the build.",
    install: { none: true },
    invoke: { shell: "bun run folio-assistant-sci/pipeline/latex-preflight.ts" },
    io: {
      inputs: [
        { name: "json", schema: t("Flag"), required: false, arg: { flag: "--json" } },
        { name: "warn", schema: t("Flag"), required: false, arg: { flag: "--warn" }, description: "Report without failing — for a corpus not yet clean." },
      ],
      outputs: [{ name: "findings", schema: t("Text"), description: "Compile-breaking hazards, located. A clean run here is not a successful compile; it is the absence of these classes." }],
    },
    satisfies: ["latex-validation"],
    // No TeX distribution needed: this reads source and never invokes pdflatex.
    // Stated because the sibling `latex-overfull` DOES need a build log, and a
    // caller would otherwise assume both have the same prerequisites.
    requires: { runtime: ["bun"], network: false },
  }),
);
