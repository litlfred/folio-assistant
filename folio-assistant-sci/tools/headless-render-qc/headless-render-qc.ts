import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
  defineTool({
    id: "headless-render-qc",
    title: "Headless render QC (Playwright)",
    description:
      "Drive a folio's built viewer in headless Chromium and report the blocks whose diagrams, SVGs, LaTeX math or markdown do not render — with `--screenshot` to save the pictures.",
    install: { none: true },
    invoke: { shell: "bun run cat render:headless-qc" },
    io: {
      inputs: [
        { name: "screenshot", schema: t("Flag"), required: false, arg: { flag: "--screenshot" }, description: "Save the screenshots as well as the verdict." },
      ],
      outputs: [
        // input-site: inert #5e83c8da — prose naming the directory, in a message or a description
        { name: "report", schema: t("Text"), description: "Per block: rendered, or the failure. Needs a FOLIO's `build/viewer/paper.json` and its `folio-assistant/ui`, so it exits 2 with `No paper.json found` in the platform (could-not-determine)." },
      ],
    },
    // `rendered-verification`, NOT `html-rendering-qc`. Established by reading
    // the bodies rather than matching the names: `html-rendering-qc` and
    // `markdown-render-check` both audit `.md` SOURCE for patterns that will
    // fail, while `rendered-verification` is the one about "LOOKING at it in a
    // browser … driving it with Playwright in this environment" — which is
    // what this script does. The first guess was `html-rendering-qc` and it
    // was wrong.
    satisfies: ["rendered-verification"],
    // A FOLIO's build output, so a node rather than a script here — it reaches
    // downstream where the tree exists. Same posture and same reason as
    // `l1-complete-check`.
    requires: { runtime: ["bun", "chromium"], network: false },
  }),
);
