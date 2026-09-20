# Lightweight LaTeX build image for QOU paper compilation.
#
# Includes: TeX Live (full), Pandoc, latexdiff, graphviz, Python
# Does NOT include: Bun, Lean, MCP server (use host Bun for content pipeline)
#
# Build:
#   docker build -t qou-latex -f scripts/docker-latex-build/Dockerfile .
#
# Usage (compile PDF after running content pipeline on host):
#   cd content && bun run pipeline/build.ts ...   # generates chapters/*.tex + main.tex
#   docker run --rm -v $(pwd):/workspace -w /workspace --entrypoint "" qou-latex \
#     latexmk -pdf -interaction=nonstopmode main.tex

FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# ── System packages ────────────────────────────────────────────────
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
      ca-certificates curl git unzip jq \
      python3 \
      # TeX Live full (includes ccicons, all fonts, all packages)
      texlive-full \
      latexmk \
      # Document tools
      pandoc latexdiff graphviz \
      # PDF tools
      poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# ── Pre-warm TeX caches ─────────────────────────────────────────
RUN mkdir -p /tmp/texwarm && \
    printf '\\documentclass{report}\n\\usepackage[utf8]{inputenc}\n\\usepackage[T1]{fontenc}\n\\usepackage{amsmath,amssymb,amsthm,mathtools}\n\\usepackage{hyperref}\n\\usepackage{graphicx}\n\\usepackage{cite}\n\\usepackage{ccicons}\n\\usepackage{titlesec}\n\\usepackage{tikz}\n\\usepackage{tikz-cd}\n\\usepackage[dvipsnames]{xcolor}\n\\begin{document}\nHello.\n\\end{document}\n' \
      > /tmp/texwarm/warm.tex && \
    cd /tmp/texwarm && \
    pdflatex -interaction=nonstopmode warm.tex && \
    rm -rf /tmp/texwarm

# Verify installations
RUN pdflatex --version | head -1 && \
    latexmk --version | head -1 && \
    pandoc --version | head -1 && \
    python3 --version

WORKDIR /workspace
