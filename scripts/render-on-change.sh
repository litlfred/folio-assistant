#!/usr/bin/env bash
#
# Hook script: re-render content when .ts/.md files under content/ change.
#
# Called by Claude Code PostToolUse hook after Edit/Write operations.
# Checks if any files under content/ were modified and triggers:
#   1. TeX block rendering (local pdflatex or Docker paper-assistant fallback)
#   2. JSON export for the viewer
#   3. Per-block standalone PDF render for each changed block  [if latexmk available]
#
# Exit 0 always — rendering failures should not block the edit.
#
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$REPO_ROOT/scripts/lib/docker-tex.sh"

# Only trigger for content file changes (.ts or .md under content/)
if ! git diff --name-only 2>/dev/null | grep -q '^content/.*\.\(md\|ts\)$'; then
  exit 0
fi

echo "[render-on-change] Content file changed, re-rendering..."

# ── Step 1: Re-render TeX inline blocks (```tex…``` → SVG) ───────────────────
if git diff --name-only 2>/dev/null | grep -q '^content/.*\.md$'; then
  if tex_local; then
    bun run "$REPO_ROOT/scripts/render-tex/render-tex-blocks.ts" 2>&1 | sed 's/^/  /' || true
  elif tex_docker_ready; then
    echo "[render-on-change] Using Docker paper-assistant image for TeX rendering..."
    docker_tex_run bun run scripts/render-tex/render-tex-blocks.ts 2>&1 | sed 's/^/  /' || true
  elif tex_docker_available; then
    echo "[render-on-change] WARNING: TeX not installed locally and Docker image not pulled."
    echo "[render-on-change] Run: docker pull $PAPER_IMAGE"
  else
    echo "[render-on-change] WARNING: No TeX available (local or Docker), SVGs may be stale"
  fi
fi

# ── Step 2: Re-export JSON for viewer ────────────────────────────────────────
if command -v bun &>/dev/null; then
  bun run "$REPO_ROOT/content/pipeline/export-json.ts" 2>&1 | sed 's/^/  /' || true
fi

# ── Step 3: Per-block standalone PDF render ──────────────────────────────────
# Local latexmk only: render-changed-blocks needs bun + latexmk in-process.
if command -v bun &>/dev/null && tex_local; then
  echo "[render-on-change] Rendering changed block PDFs..."
  bun run "$REPO_ROOT/scripts/render-changed-blocks.ts" 2>&1 | sed 's/^/  /' || true
elif tex_docker_ready && command -v bun &>/dev/null; then
  echo "[render-on-change] latexmk not local — block PDF render skipped (Docker tex available but render-changed-blocks needs local bun+latexmk)"
fi

echo "[render-on-change] Done."
