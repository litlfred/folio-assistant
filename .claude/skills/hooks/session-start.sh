#!/usr/bin/env bash
# Session start hook: detects role and probes capabilities
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="$(dirname "$SCRIPT_DIR")"
REPO_ROOT="$(dirname "$(dirname "$SKILLS_DIR")")"

echo "=== Folio Assistant Session Start ==="

# Detect user identity
USER_EMAIL=$(git config user.email 2>/dev/null || echo "unknown")
echo "User: $USER_EMAIL"

# Probe capabilities
echo ""
echo "Checking capabilities..."
for cap_file in "$SKILLS_DIR/capabilities/"*.json; do
  [ -f "$cap_file" ] || continue
  cap_name=$(basename "$cap_file" .json)
  method=$(python3 -c "import json,sys; d=json.load(open('$cap_file')); print(d.get('detection',{}).get('method',''))" 2>/dev/null || echo "")
  if [ "$method" = "command" ]; then
    cmd=$(python3 -c "import json,sys; d=json.load(open('$cap_file')); print(d['detection']['command'])" 2>/dev/null || echo "")
    if eval "$cmd" >/dev/null 2>&1; then
      echo "  ✓ $cap_name"
    else
      echo "  ✗ $cap_name (not available)"
    fi
  elif [ "$method" = "always" ]; then
    echo "  ✓ $cap_name (always)"
  else
    echo "  ? $cap_name ($method — skipped)"
  fi
done

echo ""
echo "Session initialized."
