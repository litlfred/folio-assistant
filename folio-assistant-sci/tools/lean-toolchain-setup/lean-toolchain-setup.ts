import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
  defineTool({
    id: "lean-toolchain-setup",
    title: "Lean toolchain install",
    description:
      "Install the toolchain pinned in `lean-toolchain`, fetching it from the GitHub release rather than through elan's downloader. Idempotent, and it detects partial state rather than re-downloading.",
    // It IS the install step, so `install.cli` names itself: an agent that needs
    // Lean runs this, and `install.none` would say no step exists.
    install: { cli: "folio-assistant-sci/scripts/setup-lean-toolchain.sh" },
    invoke: { shell: "folio-assistant-sci/scripts/setup-lean-toolchain.sh" },
    io: {
      inputs: [],
      outputs: [{ name: "toolchain", schema: t("Text"), description: "The linked toolchain name, and the per-repo override that selects it." }],
    },
    satisfies: ["lean-environment-setup"],
    // Network, and a specific reason worth carrying: `release.lean-lang.org`
    // answers 403 "Host not in allowlist" from this container's network policy,
    // which is what breaks `elan toolchain install` and why this script exists
    // at all. An agent reading only `network: true` would retry elan.
    requires: { runtime: ["bash", "curl", "elan"], network: true },
    remedies: [{ host: "github.com", none: "It fetches the toolchain from the GitHub release because release.lean-lang.org is refused; with GitHub refused too there is no source." }],
  }),
);
