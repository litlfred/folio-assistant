import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
  defineTool({
    id: "paper-latex-build",
    title: "Paper build to LaTeX chapters",
    description:
      "Render a paper's content objects to LaTeX chapters: load the paper manifest, resolve its chapters and blocks, render, validate the LaTeX AST, and write the chapter files. With no manifest it builds the folio's only paper, and refuses — naming them — when there are several or none.",
    install: { none: true },
    invoke: { shell: "bun run cat content:build" },
    io: {
      inputs: [
        { name: "paperManifest", schema: t("RepoPath"), required: false, arg: { positional: 0 }, description: "The paper's `<paper>.ts` manifest; absent, the folio's single paper." },
        { name: "outDir", schema: t("RepoPath"), required: false, arg: { flag: "--out-dir" }, description: "Where to write the chapters; absent, `chapters/` at the content root." },
      ],
      outputs: [
        { name: "chapters", schema: t("RepoPath"), description: "One `.tex` per chapter under the output directory." },
      ],
    },
    satisfies: ["content-validation"],
    requires: { runtime: ["bun"], network: false },
  }),
);
