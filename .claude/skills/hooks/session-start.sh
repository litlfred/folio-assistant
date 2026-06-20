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

# Probe capabilities using jq (no eval, no arbitrary command execution)
echo ""
echo "Checking capabilities..."
for cap_file in "$SKILLS_DIR/capabilities/"*.json; do
  [ -f "$cap_file" ] || continue
  cap_name=$(basename "$cap_file" .json)
  method=$(jq -r '.detection.method // ""' "$cap_file")

  case "$method" in
    command)
      cmd=$(jq -r '.detection.command // ""' "$cap_file")
      # Only allow known safe detection commands (no shell metacharacters).
      # Hold the bracket pattern in a variable: inlining it as an `[[ =~ ]]`
      # literal makes bash's conditional lexer choke on the metacharacters
      # themselves ("syntax error near `;'"), which silently broke this whole
      # hook. Inside [...] these are all literal, so no escaping is needed.
      unsafe_meta='[;|&$`()]'
      if [[ "$cmd" =~ $unsafe_meta ]]; then
        echo "  ⚠ $cap_name (unsafe detection command, skipped)"
        continue
      fi
      # Split command into array and execute without shell interpretation
      read -ra cmd_parts <<< "$cmd"
      if "${cmd_parts[@]}" >/dev/null 2>&1; then
        echo "  ✓ $cap_name"
      else
        echo "  ✗ $cap_name (not available)"
      fi
      ;;
    env-var)
      var=$(jq -r '.detection.variable // ""' "$cap_file")
      if [ -n "${!var:-}" ]; then
        echo "  ✓ $cap_name"
      else
        echo "  ✗ $cap_name (env var $var not set)"
      fi
      ;;
    file-exists)
      path=$(jq -r '.detection.path // ""' "$cap_file")
      if [ -e "$path" ]; then
        echo "  ✓ $cap_name"
      else
        echo "  ✗ $cap_name (file not found: $path)"
      fi
      ;;
    always)
      echo "  ✓ $cap_name (always)"
      ;;
    mcp-probe)
      endpoint=$(jq -r '.detection.endpoint // ""' "$cap_file")
      echo "  ? $cap_name (mcp-probe: $endpoint — requires runtime check)"
      ;;
    *)
      echo "  ? $cap_name ($method — unknown detection method)"
      ;;
  esac
done

# Work-plan priming lives in the shared primer (scripts/session-start-coord-sweep.sh,
# wired from each CLI's SessionStart hook), not here — single ownership avoids
# double-priming when both the capability prober and the primer run. See
# docs/folio-assistant-migration.md §8.

echo ""
echo "Session initialized."
