import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
  defineTool({
    id: "latex-overfull",
    title: "LaTeX overfull-box report",
    description:
      "Turn a pdflatex log's Overfull \\hbox warnings into a located, actionable report, with a threshold so a long tail of trivial overruns does not bury the real ones.",
    install: { none: true },
    invoke: { shell: "bun run cat latex:overfull" },
    io: {
      inputs: [
        // REQUIRED and positional — found by running it, not by reading it:
        // `usage: latex-overfull-report.ts <main.log> [--min N] …`. The first
        // draft of this node declared only the flags, which would have told a
        // caller the log was optional and sent them to a usage error.
        { name: "log", schema: t("RepoPath"), required: true, arg: { positional: 0 }, description: "The pdflatex log to read." },
        { name: "min", schema: t("Dpi"), required: false, arg: { flag: "--min" }, description: "Ignore overruns below this size" },
        { name: "max", schema: t("Dpi"), required: false, arg: { flag: "--max" }, description: "Fail above this count, for use as a gate." },
        { name: "json", schema: t("Flag"), required: false, arg: { flag: "--json" } },
      ],
      outputs: [{ name: "report", schema: t("Text"), description: "Located overfull boxes. Requires a build log: with no log there is nothing to read, which is could-not-determine rather than clean." }],
    },
    satisfies: ["latex-validation"],
    // Reads a pdflatex LOG, so it needs a build to have happened — not a TeX
    // distribution of its own. The distinction matters to a caller deciding
    // whether to run it: no log means no answer, not a pass.
    requires: { runtime: ["bun"], network: false },
  }),
);
