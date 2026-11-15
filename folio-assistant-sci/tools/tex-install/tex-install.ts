import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

export default toolFactory((t) =>
  defineTool({
    id: "tex-install",
    title: "Install TeX Live in a sandbox",
    description:
      "Install TeX Live (full) and latexmk where no TeX engine is present, disabling the firewalled launchpad PPAs that otherwise abort `apt-get update`. Idempotent: does nothing when pdflatex and memoize.sty are already present. Run it in the background. pdflatex unpacks early but is not usable until the post-install format build ends (`kpsewhich memoize.sty` returning a path is the ready signal).",
    install: { none: true },
    invoke: { shell: "bash cat-harness-tools/scripts/install-tex.sh" },
    io: {
      inputs: [],
      outputs: [
        { name: "engine", schema: t("Text"), description: "A `pdflatex --version` line on success. The installed packages are system-wide." },
      ],
    },
    satisfies: ["latex-build-cache"],
    requires: { runtime: ["bash", "apt-get", "sudo"], network: true },
    remedies: [{ host: "archive.ubuntu.com", none: "apt is the only source declared. The script already disables the launchpad PPAs, which answer 403 here." }],
    selection: {
      when: "A step needs to compile TeX (`paper-feature-build`'s PDFs, a full paper build) and `pdflatex` is not on PATH.",
      limits: "Debian/Ubuntu with apt and sudo only. Installs system packages; it does not touch the repository.",
      cost: "About 5 GB of disk and 10-20 minutes, once per container.",
    },
  }),
);
