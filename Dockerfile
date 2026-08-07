# =============================================================================
# folio-assistant — Ubuntu 24.04 LTS base image
# =============================================================================
# Multi-stage build that merges dependencies from all skill packages.
# Each skill package declares its requirements in package-manifest.json;
# this Dockerfile is the union of all declared APT, pip, npm, and setup deps.
#
# Build:   docker build -t folio-assistant .
# Run:     docker run -it folio-assistant
# =============================================================================

FROM ubuntu:24.04 AS base

LABEL org.opencontainers.image.title="folio-assistant"
LABEL org.opencontainers.image.description="Cross-repository agent skills framework with unified skill management, RBAC, and capability detection"
LABEL org.opencontainers.image.source="https://github.com/litlfred/folio-assistant"
LABEL org.opencontainers.image.licenses="MIT"

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# ─── System packages (union of all skill package aptPackages) ─────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Core tools
    curl \
    wget \
    ca-certificates \
    unzip \
    jq \
    git \
    git-lfs \
    build-essential \
    cmake \
    pkg-config \
    # Python
    python3 \
    python3-pip \
    python3-venv \
    # Node.js (via nodesource for LTS)
    nodejs \
    npm \
    # Java (for FHIR IG Publisher)
    openjdk-21-jre-headless \
    # Ruby (for Jekyll / IG Publisher)
    ruby-full \
    # Diagramming
    graphviz \
    plantuml \
    # PDF text extraction (pdftotext; MIT-safe subprocess CLI, not an AGPL import)
    poppler-utils \
    # LaTeX (for math authoring)
    texlive-full \
    latexmk \
    biber \
    pandoc \
    # Libraries
    libgmp-dev \
    && rm -rf /var/lib/apt/lists/*

# ─── Node.js global packages ─────────────────────────────────────────────────
RUN npm install -g \
    typescript \
    ts-node \
    fsh-sushi

# ─── Python packages ─────────────────────────────────────────────────────────
RUN pip3 install --no-cache-dir --break-system-packages \
    matplotlib \
    numpy \
    sympy \
    jupyter \
    fhir.resources \
    fhirpathpy \
    requests \
    pyyaml \
    jsonschema \
    lxml \
    pypdf \
    leanblueprint

# ─── Ruby gems ───────────────────────────────────────────────────────────────
RUN gem install jekyll bundler

# ─── FHIR IG Publisher (pinned version for reproducibility) ──────────────────
# Pin to a specific release; update this ARG when upgrading.
ARG IG_PUBLISHER_VERSION=1.7.4
RUN mkdir -p /opt/ig-publisher \
    && curl -fSL -o /opt/ig-publisher/publisher.jar \
       "https://github.com/HL7/fhir-ig-publisher/releases/download/${IG_PUBLISHER_VERSION}/publisher.jar"

ENV JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
ENV IG_PUBLISHER_JAR=/opt/ig-publisher/publisher.jar

# ─── Lean 4 toolchain ────────────────────────────────────────────────────────
# Download the installer, verify it's a shell script, then execute it.
#
# LEAN_TOOLCHAIN_VERSION should TRACK THE CONTENT REPO's `lean-toolchain`, not
# drift independently — elan will otherwise download the content repo's pin on
# first `lake build` anyway, and the image's own version only serves to make
# capability probes lie. (It had drifted to v4.16.0 while qou was on v4.24.0.)
#
# Floor: >= v4.17.0, required by the lean-atlas capability below.
ARG ELAN_VERSION=v3.1.1
ARG LEAN_TOOLCHAIN_VERSION=v4.24.0
RUN curl -fSL -o /tmp/elan-init.sh \
       "https://raw.githubusercontent.com/leanprover/elan/${ELAN_VERSION}/elan-init.sh" \
    && head -1 /tmp/elan-init.sh | grep -q '^#!' \
    && sh /tmp/elan-init.sh -y --default-toolchain "leanprover/lean4:${LEAN_TOOLCHAIN_VERSION}" \
    && rm /tmp/elan-init.sh \
    && echo 'export PATH="$HOME/.elan/bin:$PATH"' >> /etc/profile.d/lean.sh

ENV LEAN_HOME=/root/.elan
ENV PATH="/root/.elan/bin:${PATH}"

# ─── External Lean tooling (network egress required) ─────────────────────────
# Some pipeline capabilities depend on third-party Lean projects fetched from
# github.com. They are NOT installed as image binaries — Lean tooling is
# consumed as Lake requires declared in the *content* repo's lakefile.toml, so
# the fetch happens at `lake update` time in that repo, not here.
#
# What that means for provisioning:
#
#   * The image must allow outbound HTTPS to github.com (and the Lake reservoir)
#     at container runtime, not just at build time. A build-time-only egress
#     policy will produce an image where `lake update` fails.
#   * Nothing below is required for folio-assistant itself to run. Every
#     dependent capability is probed (.claude/skills/capabilities/*.json) and
#     degrades to `n/a` when absent — see the `--scan` fallback in
#     content/pipeline/lean-atlas-ingest.ts.
#
# Currently declared:
#
#   lean-atlas (MIT) — https://github.com/NyxFoundation/lean-atlas
#     Formal dependency graph, type/value edge split.
#     Content-repo lakefile.toml:
#       [[require]]
#       name  = "lean-atlas"
#       scope = "NyxFoundation"
#       git   = "https://github.com/NyxFoundation/lean-atlas"
#       rev   = "main"          # pin a commit for reproducibility
#     Then: lake update lean-atlas
#           lake exe atlas graph-data --output graph.json --pretty
#
#     REQUIRES Lean >= 4.17.0 (v4.28.0 tested). Satisfied by the
#     LEAN_TOOLCHAIN_VERSION above (v4.24.0, matching qou). If a content repo
#     pins below 4.17.0, the probe fails closed there and the ingest script's
#     --scan fallback supplies an approximate graph instead.
#
#     Node 18+ / pnpm are needed only for Atlas's web viewer, not for
#     graph-data export, so they are deliberately not provisioned here.

# ─── beans work-plan tracker CLI ─────────────────────────────────────────────
# Generic agent session work-plan / cross-agent coordination tracker
# (https://github.com/hmans/beans; see .claude/skills/local/todo-manager.md).
# Build it from source with a throwaway Go toolchain installed into /usr/local/bin
# (already on PATH), then purge the toolchain + module cache so the CLI ships in
# the image without the ~500MB Go install. `command -v beans` gates the build so
# a provisioning regression fails fast instead of shipping a CLI-less image.
RUN apt-get update && apt-get install -y --no-install-recommends golang-go \
    && GOBIN=/usr/local/bin go install github.com/hmans/beans@latest \
    && apt-get purge -y golang-go && apt-get autoremove -y \
    && rm -rf /var/lib/apt/lists/* /root/go /root/.cache/go-build \
    && command -v beans

# ─── Application setup ───────────────────────────────────────────────────────
WORKDIR /workspace

COPY package.json tsconfig.json ./
COPY schemas/ schemas/
COPY skills/ skills/
COPY scripts/ scripts/
COPY .claude/ .claude/

# Install npm dependencies
RUN npm install --production

# Generate schemas and registry
RUN npx ts-node scripts/generate-schemas.ts
RUN npx ts-node scripts/generate-docs.ts
RUN npx ts-node scripts/generate-registry.ts

CMD ["/bin/bash"]
