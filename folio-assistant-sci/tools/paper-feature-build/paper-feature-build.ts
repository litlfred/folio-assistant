import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
  defineTool({
    id: "paper-feature-build",
    title: "Paper feature build (changed chapters + latexdiff)",
    description:
      "Quick preview of a paper folio's branch: render the paper with the sci print template (plus the folio's notation fragment when it has one), then compile ONLY the chapters changed against a base ref, and a colored and a plain latexdiff of each. A preview, never a publish build. Run from the folio.",
    install: { none: true },
    invoke: { shell: "bash folio-assistant-sci/adapters/paper/latex/feature-build.sh" },
    io: {
      inputs: [
        { name: "base", schema: t("Branch"), required: false, arg: { flag: "--base" }, description: "The ref to diff against. Default `origin/main`." },
        { name: "chapters", schema: t("Slug"), required: false, arg: { flag: "--chapters" }, description: "Chapter slugs, comma-separated. Default: the chapters whose sources changed against `base`." },
        { name: "paper", schema: t("Slug"), required: false, arg: { flag: "--paper" }, description: "The paper's slug. Default: the folio's only paper; with several, the tool refuses and names them." },
        { name: "out", schema: t("RepoPath"), required: false, arg: { flag: "--out" }, description: "Output directory, which the folio should gitignore. Default `build-feature`." },
        { name: "notation", schema: t("RepoPath"), required: false, arg: { flag: "--notation" }, description: "The folio's notation fragment, appended after the template. Default `<paper dir>/latex/notation-preamble.tex` when present." },
        { name: "preload", schema: t("RepoPath"), required: false, arg: { flag: "--preload" }, description: "Bun preload that configures the platform's injected registries (values, Lean packages). Default `scripts/preload-registry.ts` when present. It must import the same platform checkout as this tool." },
      ],
      outputs: [
        { name: "preview", schema: t("RepoPath"), description: "`<out>/changed.pdf`, `<out>/<chapter>.diff-color.pdf` and `.diff-plain.pdf`, with the logs and `<out>/build.log` beside them. The render also rewrites the folio's `chapters/` and `main.tex`." },
      ],
    },
    satisfies: ["latex-build-cache"],
    requires: { runtime: ["bun", "git", "bash"], network: false },
    selection: {
      when:
        "Iterating on a paper's prose or mathematics, before a full build: you want to see the changed chapters typeset, and what changed, in a minute or so instead of compiling the whole paper.",
      limits:
        "A preview: cross-references outside the build show '??', margin notes are off by default (`FAST_PREVIEW=1`, about 2x faster), and a chapter's base latexdiff degrades to 'all added' when the base ref has no committed chapter .tex. Needs pdflatex/latexmk for the PDFs and latexdiff for the diffs; without them only the render runs.",
      cost: "One paper render (about 20-40 s on a 2,900-block paper) plus one pdflatex compile per output PDF.",
    },
  }),
);
