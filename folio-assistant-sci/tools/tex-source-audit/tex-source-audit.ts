import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
  defineTool({
    id: "tex-source-audit",
    title: "TeX-source hazard audit",
    description:
      "Catch the source patterns that crash pdflatex but read as ordinary prose — a bare `_` or `^` in a bibliography field, `|` inside a markdown table cell where it is also the column separator, a `$…$` span across two lines, markdown link syntax inside a fenced tex block, a double subscript.",
    install: { none: true },
    invoke: { shell: "bun run cat latex:audit-source" },
    io: {
      inputs: [
        { name: "strict", schema: t("Flag"), required: false, arg: { flag: "--strict" }, description: "Exit 1 on any finding, for use as a gate." },
      ],
      outputs: [
        { name: "report", schema: t("Text"), description: "Hazards with file and line, plus a committed sidecar. Run where no folio exists it says `No .md files found … refusing to report success. This audits a FOLIO's content; folio-assistant is the platform.` and exits 2 (could-not-determine)." },
      ],
    },
    satisfies: ["latex-validation"],
    requires: { runtime: ["bun"], network: false },
  }),
);
