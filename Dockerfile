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
ARG ELAN_VERSION=v3.1.1
RUN curl -fSL -o /tmp/elan-init.sh \
       "https://raw.githubusercontent.com/leanprover/elan/${ELAN_VERSION}/elan-init.sh" \
    && head -1 /tmp/elan-init.sh | grep -q '^#!' \
    && sh /tmp/elan-init.sh -y --default-toolchain leanprover/lean4:v4.16.0 \
    && rm /tmp/elan-init.sh \
    && echo 'export PATH="$HOME/.elan/bin:$PATH"' >> /etc/profile.d/lean.sh

ENV LEAN_HOME=/root/.elan
ENV PATH="/root/.elan/bin:${PATH}"

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
