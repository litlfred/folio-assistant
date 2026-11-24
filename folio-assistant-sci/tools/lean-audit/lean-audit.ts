import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
  defineTool({
    id: "lean-audit",
    title: "Lean vacuity audit",
    description:
      "Inspect Lean declarations chapter by chapter for proofs that type-check, are sorry-free and axiom-clean, and still carry no mathematical content — assuming what they claim, concluding something trivially true, or resting on a false premise.",
    install: { none: true },
    invoke: { shell: "bun run folio-assistant-sci/scripts/lean-audit.ts" },
    io: {
      inputs: [
        { name: "chapter", schema: t("Slug"), required: false, arg: { flag: "--chapter" }, description: "One chapter instead of the whole corpus." },
        { name: "strict", schema: t("Flag"), required: false, arg: { flag: "--strict" } },
        { name: "checkAxioms", schema: t("Flag"), required: false, arg: { flag: "--check-axioms" }, description: "Axiom-cleanliness is a separate question from vacuity: a proof can be axiom-clean and still assume its conclusion." },
        { name: "json", schema: t("Flag"), required: false, arg: { flag: "--json" } },
      ],
      outputs: [
        { name: "findings", schema: t("Text"), description: "Sorry inventory and trivial-truth detections. Sibling of `lean-coverage`, not an alternative to it: that one COUNTS what is proved, this one asks whether a proof says anything." },
      ],
    },
    satisfies: ["lean-proof-vacuity-audit"],
    // Same refusal as its sibling in the platform repo, and for the same
    // reason: no folio, so no papers to audit. Exit 1 with an explanation.
    requires: { runtime: ["bun"], network: false },
  }),
);
