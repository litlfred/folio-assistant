#!/usr/bin/env bash
#
# Hook script: re-render TeX blocks and export JSON when content .md files change.
#
# Called by Claude Code PostToolUse hook after Edit/Write operations.
# Checks if any .md files under content/ were modified and triggers:
#   1. TeX block rendering (local pdflatex or Docker paper-assistant fallback)
#   2. JSON export for the viewer
#
# Exit 0 always — rendering failures should not block the edit.
#
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
source "$REPO_ROOT/scripts/lib/docker-tex.sh"

# Only trigger for content .md file changes
if ! git diff --name-only 2>/dev/null | grep -q '^content/.*\.md$'; then
  exit 0
fi

echo "[render-on-change] Content .md file changed, re-rendering..."

# Re-render TeX blocks (local TeX or Docker fallback)
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

# Re-export JSON for viewer
if command -v bun &>/dev/null; then
  bun run "$REPO_ROOT/content/pipeline/export-json.ts" 2>&1 | sed 's/^/  /' || true
fi

echo "[render-on-change] Done."
