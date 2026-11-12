import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

// Moved here from cat-harness/tools/index.ts (bean j9cs, 2026-10-05): the
// `lake-cache` kind (kinds/lake-cache.json) says this harness owns the kind
// AND the tool, and the skill it satisfies (`lean-cache-restore`) is this
// harness's. The script followed it into this layer's scripts/ (from
// cat-harness-tools/scripts/, folio-assistant#2598). A folio's lake-cache
// directory names it as `storage.tool: "lean-cache"`.
export default toolFactory((t) =>
  defineTool({
    id: "lean-cache",
    title: "Lake olean cache",
    description:
      "Restore, verify, seed and diagnose the prebuilt `.lake/` artefacts for a Lean package. Always try `restore` first: a from-source Mathlib build is 30–60 minutes, a restore about two.",
    install: { none: true },
    invoke: { shell: "folio-assistant-sci/scripts/lake-cache.sh" },
    io: {
      inputs: [
        { name: "action", schema: t("LakeCacheAction"), required: true, arg: { positional: 0 }, description: "The verb. `doctor` tells a restore that silently missed from one that worked." },
        { name: "lakeRoot", schema: t("RepoPath"), required: false, arg: { flag: "--lake-root" }, description: "The package whose `.lake/` is acted on." },
        { name: "package", schema: t("PackageName"), required: false, arg: { flag: "--package" } },
      ],
      outputs: [{ name: "result", schema: t("Text"), description: "A real hit, a miss, or a diagnosis — never a miss that reads as a hit." }],
    },
    satisfies: ["lean-cache-restore"],
    requires: { runtime: ["bash", "git", "lake"], network: true },
    remedies: [{ host: "github.com", none: "The warm cache is stored on GitHub; without it, build cold with `lean-build` (30–60 minutes for Mathlib)." }],
  }),
);
