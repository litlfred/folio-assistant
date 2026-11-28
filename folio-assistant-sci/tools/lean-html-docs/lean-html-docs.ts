import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

// The `lean` directory's visualiser (owner, 2026-10-10: "there should be a
// lean/ visualizer which is then the lean html render (but wrapped w/
// cat-harness navbar chrome/rails)"). Two Tools because they fail
// differently and cost wildly differently: the build is a Lake run over a
// warm cache, the publish is a file pass over its output.
export default toolFactory((t) =>
  defineTool({
    id: "lean-html-docs",
    title: "Build a Lean package's HTML docs (doc-gen4)",
    description:
      "Build the doc-gen4 HTML render of a folio's Lake package — the visualiser of a declared `lean` directory — with `lake -R -Kenv=dev build <Lib>:docs`, cache-aware: refuses while another lake/lean process holds `.lake/`, refuses on a restored tree that carries no traces (a Lake build there EVICTS the cache), checks or restores the warm cache first, and enables a sentinel-commented doc-gen4 `[[require]]` for this build only, restoring the lakefile on exit. Never runs `lake update`. Output: `<lake-root>/.lake/build/doc`.",
    install: { none: true },
    invoke: { shell: "bash folio-assistant-sci/adapters/paper/lean/lean-docs-build.sh" },
    io: {
      inputs: [
        { name: "lakeRoot", schema: t("RepoPath"), required: true, arg: { flag: "--lake-root" }, description: "The Lake package directory whose lakefile requires (or sentinel-comments) doc-gen4, e.g. `folio/quantum-observable-universe/lean`." },
        { name: "lib", schema: t("InstanceId"), required: true, arg: { flag: "--lib" }, description: "The `lean_lib` to document, e.g. `QOU` (a Lean library name: alphanumerics, dot, underscore, hyphen). Repeat for several." },
        { name: "platform", schema: t("RepoPath"), required: false, arg: { flag: "--platform" }, description: "The index checkout holding `lake-cache.sh`. Default `$FOLIO_ASSISTANT_ROOT`." },
        { name: "restore", schema: t("Flag"), required: false, arg: { flag: "--restore" }, description: "Restore the warm cache first (about 2 minutes) instead of only checking it." },
        { name: "allowCold", schema: t("Flag"), required: false, arg: { flag: "--allow-cold" }, description: "Build without a warm cache: Mathlib from source, 30-60 minutes before doc-gen4 starts." },
        { name: "dryRun", schema: t("Flag"), required: false, arg: { flag: "--dry-run" }, description: "Run every guard, print the build command, build nothing." },
      ],
      outputs: [
        { name: "render", schema: t("RepoPath"), description: "`<lake-root>/.lake/build/doc`, doc-gen4's output, printed as the last line. Feed it to `lean-render-publish`." },
      ],
    },
    satisfies: ["lean-html-docs"],
    requires: { runtime: ["bash", "git", "lake"], network: true },
    remedies: [{ host: "github.com", none: "doc-gen4 and its dependencies are fetched from GitHub on first use, and the warm cache is stored there; without it there is no render." }],
    selection: {
      when: "A folio's declared `lean` directory needs its visualiser (the doc-gen4 render) built or refreshed, before `lean-render-publish` wraps it.",
      limits:
        "doc-gen4 renders the WHOLE import closure, Mathlib included. It does not prune; prune at publish. Refuses, rather than risks, a shared or untraced `.lake/`. Never run it while another agent holds the folio's Lean cache.",
      cost: "Unmeasured. One doc-gen4 compile, then one doc pass per module of the closure — thousands for a Mathlib package; qou's July render was 4,193 pages, 545 MB. Needs that much free disk beyond the build.",
    },
  }),
);
