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

# ── Step 4: Split PDF by chapter ─────────────────────────────────
PDF_SPLIT_DIR="$REPO_ROOT/build/pdf-split"
if command -v python3 &>/dev/null; then
  echo "==> Splitting main.pdf by chapter..."
  mkdir -p "$PDF_SPLIT_DIR"
  python3 "$REPO_ROOT/scripts/split-pdf-by-chapter.py" \
    --pdf "$REPO_ROOT/main.pdf" \
    --paper "$PAPER" \
    --out-dir "$PDF_SPLIT_DIR" \
    || echo "  ⚠ PDF split failed (non-fatal)"
fi

# ── Step 5: Sync PDFs to Google Drive (if configured) ────────────
# Reads target folder from GDRIVE_FOLDER_PATH env var or
# folio.config.json googleDrive.folderPath field. Unset = no egress.
_gdrive_folder=""
if [[ -n "${GDRIVE_FOLDER_PATH:-}" ]]; then
  _gdrive_folder="$GDRIVE_FOLDER_PATH"
elif [[ -f "$REPO_ROOT/folio.config.json" ]] && command -v python3 &>/dev/null; then
  _gdrive_folder="$(python3 -c "
import json
try:
  cfg=json.load(open('$REPO_ROOT/folio.config.json'))
  print((cfg.get('googleDrive') or {}).get('folderPath',''))
except Exception:
  pass
" 2>/dev/null || true)"
fi

if [[ -n "${_gdrive_folder:-}" ]] && command -v python3 &>/dev/null; then
  GDRIVE_MCP="$REPO_ROOT/src/google-drive-mcp.py"
  if [[ -f "$GDRIVE_MCP" ]]; then
    echo "==> Syncing PDFs to Google Drive folder: $_gdrive_folder"

    # main.pdf → root folder
    python3 "$GDRIVE_MCP" --upload "$REPO_ROOT/main.pdf" \
      --folder "$_gdrive_folder" || echo "  ⚠ main.pdf Drive upload failed (non-fatal)"

    # standalone appendix PDFs → appendices/
    for pdf in "$REPO_ROOT"/standalone-*.pdf; do
      [ -f "$pdf" ] || continue
      python3 "$GDRIVE_MCP" --upload "$pdf" \
        --folder "$_gdrive_folder/appendices" || echo "  ⚠ appendix Drive upload failed (non-fatal)"
    done

    # Chapter/section PDFs from split manifest → chapters/ and root
    if [[ -f "$PDF_SPLIT_DIR/pdf-split-manifest.json" ]]; then
      python3 "$GDRIVE_MCP" \
        --sync-manifest "$PDF_SPLIT_DIR/pdf-split-manifest.json" \
        --folder "$_gdrive_folder" || echo "  ⚠ Split-manifest Drive sync failed (non-fatal)"
    fi

    echo "==> Drive sync complete."
  else
    echo "==> Drive MCP not found at $GDRIVE_MCP — skipping Drive sync"
  fi
else
  echo "==> Google Drive not configured (set GDRIVE_FOLDER_PATH or folio.config.json googleDrive.folderPath to enable)"
fi

echo "==> Build complete."
