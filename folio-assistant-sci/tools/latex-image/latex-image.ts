import { toolFactory } from "@litlfred/cat-harness-tools/schemas/tools/tool-folders.js";
import { defineTool } from "@litlfred/cat-harness-tools/schemas/tools/tool.js";

// The LaTeX image is part of THIS Tool (bean `ar1s`, phase 2): the
// Dockerfile sits beside it under `scripts/docker-latex-build/`, and
// `install.container` is its build line, which is what
// `deps:python:check` reads to find the image it checks.
export default toolFactory((t) =>
  defineTool({
    id: "latex-image",
    title: "Compile LaTeX in a container",
    description:
      "Compile a rendered paper's `main.tex` with latexmk inside a TeX Live (full) image, for a host with Docker but no TeX engine. The image carries TeX Live, latexmk, Pandoc, latexdiff, graphviz and poppler-utils; it does not run the content pipeline, which renders the chapters on the host first.",
    install: {
      container:
        "docker build -t folio-latex -f folio-assistant-sci/scripts/docker-latex-build/Dockerfile folio-assistant-sci/scripts/docker-latex-build",
    },
    invoke: {
      container: "docker run --rm -v .:/workspace -w /workspace folio-latex latexmk -pdf -interaction=nonstopmode",
    },
    io: {
      inputs: [
        { name: "mainTex", schema: t("RepoPath"), required: true, arg: { positional: 0 }, description: "The rendered paper's top-level `.tex`, relative to the checkout." },
      ],
      outputs: [
        { name: "pdf", schema: t("RepoPath"), description: "The compiled PDF beside the input." },
      ],
    },
    satisfies: ["latex-build-cache"],
    requires: { runtime: ["docker"], network: true },
    remedies: [{ host: "archive.ubuntu.com", none: "The image build installs texlive-full from apt; with the archive refused there is no image. `tex-install` needs the same host." }],
    selection: {
      when: "A step needs a compiled PDF, `pdflatex` is not on PATH, and Docker is available — the container alternative to `tex-install`.",
      limits: "Needs Docker. The first build pulls ubuntu:24.04 and texlive-full (several GB); later runs reuse the image.",
      cost: "One image build (10-20 minutes, once), then one latexmk compile per run.",
    },
  }),
);
