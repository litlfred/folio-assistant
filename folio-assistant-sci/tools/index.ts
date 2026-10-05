/**
 * folio-assistant-sci's Tool nodes: the `tools` graph for the science layer.
 *
 * @module folio-assistant-sci/tools
 * @graphNode tool
 *
 * Reached by the harness through tool auto-discovery (`cat-harness/tools/
 * discover.ts`, bean `p0za`), never by an import, as `folio-assistant-core`'s
 * are. A Tool node is a declaration read at load; these invoke shell commands,
 * so declaring them copies no code.
 *
 * ## The iterative paper build (issue #2117, 2026-10-04)
 *
 * The owner asked for the loop litlfred/qou used to iterate on a large paper,
 * as "new skill/tools". It has four steps, governed by the `latex-build-cache`
 * skill:
 *
 * 1. `latex-preflight` (cat-harness), a static check that needs no TeX;
 * 2. `tex-install`, to get an engine into a sandbox that has none;
 * 3. `paper-feature-build`, which compiles only the changed chapters plus a
 *    latexdiff of each, with margin notes off;
 * 4. `paper-latex-build` (cat-harness), the full render.
 *
 * Steps 2 and 3 had no Tool node, so an agent searching the tools graph could
 * not find the loop; and step 3 could not run anywhere, because it read the
 * preamble deleted in `34a70659c7`. It now lives beside the recovered print
 * template in `adapters/paper/latex/`.
 */
import { defineTool, type ToolDefinition } from "../../cat-harness/schemas/tool.js";
import { toolTypeIri } from "../../cat-harness/schemas/tool-types.js";

export function tools(baseUrl?: string): ToolDefinition[] {
  const B = baseUrl ?? "";
  const t = (n: Parameters<typeof toolTypeIri>[1]): string => toolTypeIri(B, n);

  return [
    defineTool({
      id: "paper-feature-build",
      title: "Paper feature build (changed chapters + latexdiff)",
      description:
        "Quick preview of a paper folio's branch: render the paper with the sci print template (plus the folio's notation fragment when it has one), then compile ONLY the chapters changed against a base ref, and a colored and a plain latexdiff of each. Margin notes are off by default (`FAST_PREVIEW=1`, about 2x). Cross-references to chapters outside the build print as '??'. A preview, never a publish build. Run from the folio. Without a TeX engine the render still runs and the compile steps are skipped with a message.",
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
          "A preview: cross-references outside the build show '??', margin notes are off by default, and a chapter's base latexdiff degrades to 'all added' when the base ref has no committed chapter .tex. Needs pdflatex/latexmk for the PDFs and latexdiff for the diffs; without them only the render runs.",
        cost: "One paper render (about 20-40 s on a 2,900-block paper) plus one pdflatex compile per output PDF.",
      },
    }),
    defineTool({
      id: "tex-install",
      title: "Install TeX Live in a sandbox",
      description:
        "Install TeX Live (full) and latexmk where no TeX engine is present, disabling the firewalled launchpad PPAs that otherwise abort `apt-get update`. Idempotent: does nothing when pdflatex and memoize.sty are already present. About 5 GB and 10-20 minutes, so run it in the background. pdflatex unpacks early but is not usable until the post-install format build ends (`kpsewhich memoize.sty` returning a path is the ready signal).",
      install: { none: true },
      invoke: { shell: "bash cat-harness/scripts/install-tex.sh" },
      io: {
        inputs: [],
        outputs: [
          { name: "engine", schema: t("Text"), description: "A `pdflatex --version` line on success. The installed packages are system-wide." },
        ],
      },
      satisfies: ["latex-build-cache"],
      requires: { runtime: ["bash", "apt-get", "sudo"], network: true },
      selection: {
        when: "A step needs to compile TeX (`paper-feature-build`'s PDFs, a full paper build) and `pdflatex` is not on PATH.",
        limits: "Debian/Ubuntu with apt and sudo only. Installs system packages; it does not touch the repository.",
        cost: "About 5 GB of disk and 10-20 minutes, once per container.",
      },
    }),

    // The formal-edge extractor, served over MCP. It reached the servers as a
    // `contributes` tool group (`contributions.ts`) until both servers came to
    // serve every Tool node in the folio's dependency tree (bean riit, 3c);
    // this node is what registers it now, and the contribution is gone.
    defineTool({
      id: "lean-formal-edges",
      title: "Formal edges from the Lean build",
      description:
        "Extract ELABORATED formal dependencies between a folio's lean.ref declarations (LeanArchitect's rule over the folio's own lean.ref set). Needs a Lean toolchain and a built Lake project. Tagged declarations missing from the build are reported, never recorded as dependency-free; with ingest the result is recorded in the formal cache as source \"elaborated\".",
      install: { none: true },
      invoke: { inProcess: { module: "content/pipeline/formal-edges-mcp.ts" }, mcp: { tool: "lean_formal_edges" } },
      io: {
        inputs: [
          { name: "lake_dir", schema: t("RepoPath"), required: true, description: "The folio's Lake project directory (holds lakefile.* and .lake/)." },
          { name: "root", schema: t("RepoPath"), required: false, description: "Content root to collect lean.ref targets from (default: the folio's declared one)." },
          { name: "ingest", schema: t("Flag"), required: false, description: "Record the result in the formal cache as source \"elaborated\"." },
        ],
        outputs: [
          { name: "report", schema: t("Markdown"), description: "The extracted edges, or why they could not be determined — never an empty edge set in place of a failure." },
        ],
      },
      satisfies: ["lean-formal-edges"],
      requires: { runtime: ["bun", "lake"], network: false },
    }),
  ];
}
