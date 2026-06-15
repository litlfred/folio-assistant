#!/usr/bin/env bash
# Build the QOU paper PDF using Docker for LaTeX compilation.
#
# Prerequisites:
#   - Node.js + npx (for content pipeline via tsx)
#   - Docker with the qou-latex image built:
#       docker build -t qou-latex -f scripts/docker-latex-build/Dockerfile .
#
# Usage:
#   ./scripts/docker-latex-build/build-pdf.sh              # full build
#   ./scripts/docker-latex-build/build-pdf.sh --tex-only   # skip content pipeline (reuse existing chapters/*.tex)
#   ./scripts/docker-latex-build/build-pdf.sh --clean      # clean aux files before build
#   ./scripts/docker-latex-build/build-pdf.sh --help
#
# Output: main.pdf in the repo root

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DOCKER_IMAGE="${DOCKER_IMAGE:-qou-latex}"
PAPER="${PAPER:-quantum-observable-universe}"
TEX_ONLY=false
CLEAN=false
STRICT=false

usage() {
  echo "Usage: $0 [--tex-only] [--clean] [--strict] [--image IMAGE] [--paper PAPER]"
  echo ""
  echo "Options:"
  echo "  --tex-only   Skip content pipeline, compile existing .tex files"
  echo "  --clean      Remove LaTeX aux files before compilation"
  echo "  --strict     Fail on LaTeX errors (omit -f flag)"
  echo "  --image IMG  Docker image to use (default: qou-latex)"
  echo "  --paper DIR  Paper directory name (default: quantum-observable-universe)"
  echo "  --help       Show this help"
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --tex-only) TEX_ONLY=true; shift ;;
    --clean)    CLEAN=true; shift ;;
    --strict)   STRICT=true; shift ;;
    --image)    DOCKER_IMAGE="$2"; shift 2 ;;
    --paper)    PAPER="$2"; shift 2 ;;
    --help)     usage ;;
    *)          echo "Unknown option: $1"; usage ;;
  esac
done

cd "$REPO_ROOT"

# ── Verify Docker image exists ───────────────────────────────────
if ! docker image inspect "$DOCKER_IMAGE" &>/dev/null; then
  echo "Docker image '$DOCKER_IMAGE' not found. Building..."
  docker build -t "$DOCKER_IMAGE" -f scripts/docker-latex-build/Dockerfile .
fi

# ── Step 0: Clean aux files if requested ─────────────────────────
if [ "$CLEAN" = true ]; then
  echo "==> Cleaning LaTeX aux files..."
  rm -f main.aux main.log main.fls main.fdb_latexmk main.out main.toc \
       main.lof main.lot main.bbl main.blg main.bcf main.run.xml \
       main.synctex.gz main.pdf
fi

# ── Step 1: Content pipeline (generates chapters/*.tex + main.tex) ─
if [ "$TEX_ONLY" = false ]; then
  echo "==> Running content pipeline..."
  cd content
  if [ ! -d node_modules ]; then
    echo "    Installing dependencies..."
    if command -v bun &>/dev/null; then
      bun install --frozen-lockfile
    else
      echo "Error: Bun is required to install content pipeline dependencies reproducibly." >&2
      echo "The content/ directory is locked with bun.lock, so npm fallback is disabled." >&2
      echo "Please install Bun and re-run this script, or use --tex-only to skip the content pipeline." >&2
      exit 1
    fi
  fi

  echo "    Building LaTeX from content objects..."
  npx tsx ../scripts/docker-latex-build/run-build.ts \
    "$PAPER/$PAPER.ts" \
    --out-dir ../chapters/ \
    --generate-main --main-out ../main.tex \
    --preamble ../latex/preamble.tex

  echo "    Exporting BibTeX..."
  npx tsx pipeline/export-bibtex.ts

  cd "$REPO_ROOT"
  echo "==> Content pipeline complete."
else
  echo "==> Skipping content pipeline (--tex-only)"
  if [ ! -f main.tex ]; then
    echo "ERROR: main.tex not found. Run without --tex-only first."
    exit 1
  fi
fi

# ── Step 2: LaTeX compilation via Docker ─────────────────────────
LATEXMK_FLAGS="-pdf -interaction=nonstopmode"
if [ "$STRICT" = false ]; then
  LATEXMK_FLAGS="$LATEXMK_FLAGS -f"
else
  LATEXMK_FLAGS="$LATEXMK_FLAGS -halt-on-error"
fi

echo "==> Compiling PDF with latexmk (Docker: $DOCKER_IMAGE)..."
docker run --rm \
  -v "$REPO_ROOT:/workspace" \
  -w /workspace \
  "$DOCKER_IMAGE" \
  latexmk $LATEXMK_FLAGS main.tex

if [ -f main.pdf ]; then
  SIZE=$(du -h main.pdf | cut -f1)
  PAGES=$(docker run --rm -v "$REPO_ROOT:/workspace" -w /workspace "$DOCKER_IMAGE" \
    pdfinfo main.pdf 2>/dev/null | grep Pages | awk '{print $2}' || echo "?")
  echo "==> SUCCESS: main.pdf ($SIZE, $PAGES pages)"
else
  echo "==> FAILED: main.pdf not produced"
  exit 1
fi

# ── Step 3: Standalone appendices (optional) ─────────────────────
for tex in standalone-*.tex; do
  [ -f "$tex" ] || continue
  echo "==> Compiling standalone: $tex"
  docker run --rm \
    -v "$REPO_ROOT:/workspace" \
    -w /workspace \
    "$DOCKER_IMAGE" \
    latexmk $LATEXMK_FLAGS "$tex"
done

echo "==> Build complete."
