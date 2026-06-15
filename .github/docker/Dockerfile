# DEPRECATED — Use scripts/mcp-server/Dockerfile (paper-assistant) instead.
#
# All CI workflows now use the unified paper-assistant image which includes
# everything this image had plus Bun, full TeX Live, GitHub CLI, and more.
# See build-lean-mcp.yml for the build workflow.
#
# This file is kept for reference only. The docker-ci-image.yml workflow
# that builds this image has been disabled.
#
# Original description:
# QOU CI Docker Image
# Pre-installs Lean toolchain, TeX Live, Python, pandoc, graphviz, and latexdiff
# so CI workflows skip expensive download/install steps.

FROM ubuntu:24.04

LABEL org.opencontainers.image.source="https://github.com/litlfred/qou"
LABEL org.opencontainers.image.description="CI image for the QOU LaTeX + Lean project"

ARG LEAN_TOOLCHAIN=leanprover/lean4:v4.16.0

ENV DEBIAN_FRONTEND=noninteractive
ENV PATH="/root/.elan/bin:${PATH}"

# ── System packages ────────────────────────────────────────────────────
RUN apt-get update -qq && apt-get install -y --no-install-recommends \
      # Build essentials
      ca-certificates curl git unzip \
      # Python
      python3 python3-pip python3-venv \
      # LaTeX (scheme-small covers most needs; extras for latexpand)
      texlive texlive-latex-extra texlive-fonts-recommended texlive-bibtex-extra \
      texlive-science texlive-extra-utils biber dvisvgm \
      # Document tools
      pandoc latexdiff graphviz \
      # Needed by some Lean/Lake native deps
      build-essential cmake libgmp-dev \
    && rm -rf /var/lib/apt/lists/*

# ── Install ccicons from CTAN (was in texlive-fonts-extra) ───────────
RUN mkdir -p /tmp/ccicons && cd /tmp/ccicons \
    && curl -sL https://mirrors.ctan.org/install/fonts/ccicons.tds.zip -o ccicons.tds.zip \
    && unzip -q ccicons.tds.zip -d /usr/local/share/texmf \
    && texhash \
    && updmap-sys --enable Map=ccicons.map \
    && rm -rf /tmp/ccicons

# ── Python packages ────────────────────────────────────────────────────
RUN pip3 install --break-system-packages --no-cache-dir \
      requests>=2.32

# ── Lean toolchain via elan ────────────────────────────────────────────
RUN curl -sSf https://raw.githubusercontent.com/leanprover/elan/master/elan-init.sh \
      | sh -s -- -y --default-toolchain "${LEAN_TOOLCHAIN}"

# Verify installations
RUN lean --version && lake --version && pdflatex --version | head -1 && python3 --version

WORKDIR /workspace
