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

# ── Materialise the declared directories ────────────────────────────────────
# Owner, 2026-09-20: *"cat-harness __initialize__ uploads/ if not there as one
# of its steps. not keep it there permanently, but nice convention to developer
# to know whats supposed to be there. easier to copy structure."*
#
# `harness.json` declares which directories an instance has; until now nothing
# CREATED them here. `harness:dirs:check` runs in CI as a dry run, and
# `init-folio` materialises them for a NEW folio — so the platform's own tree
# was the one case with a declaration and no step that honours it. A developer
# cloning this repo got whatever happened to be committed, and an empty
# declared directory is invisible: git tracks files, not directories.
#
# This runs the WRITER, idempotently. Each directory it creates gets the
# `keepMarker` .gitignore — a file that ignores nothing and exists to say what
# the directory is for, which is the convention being made discoverable.
#
# Deliberately NOT in `session-start-coord-sweep.sh`: that script's own
# docstring says "keep this fast and read-only", and this writes. The hook is
# where initialization belongs — it is the step that already reports
# "Session initialized".
#
# Never fails the hook. A session that cannot create a directory should still
# start, and the reason is printed rather than swallowed.
echo ""
echo "Declared directories..."
if command -v bun >/dev/null 2>&1; then
  if DIRS_OUT=$(cd "$REPO_ROOT" && bun run cat-harness/scripts/harness-dirs.ts 2>&1); then
    # Match the per-directory lines (`  created <path>`), NOT the summary —
    # which reads "18 declared, 0 created." and contains the word either way.
    # A first draft grepped for "created" and reported a creation on a clean
    # run; caught by running the hook rather than by reading it.
    CREATED_LINES=$(printf '%s\n' "$DIRS_OUT" | grep -E '^  created ' || true)
    if [ -n "$CREATED_LINES" ]; then
      echo "  materialised from harness.json — each gets a .gitignore saying what it is for:"
      printf '%s\n' "$CREATED_LINES" | sed 's/^  created /    + /'
    else
      printf '%s\n' "$DIRS_OUT" | grep -E '^harness dirs:' | sed 's/^/  ✓ /' \
        || echo "  ✓ all declared directories present"
    fi
  else
    # Could-not-determine, said out loud. "No output" and "the command failed"
    # look identical otherwise, and only the second is a defect.
    echo "  ? could not materialise declared directories:"
    printf '%s\n' "$DIRS_OUT" | tail -3 | sed 's/^/    /'
  fi
else
  echo "  ? bun not on PATH — declared directories not checked"
fi

# Work-plan priming lives in the shared primer (scripts/session-start-coord-sweep.sh,
# wired from each CLI's SessionStart hook), not here — single ownership avoids
# double-priming when both the capability prober and the primer run. See
# docs/folio-assistant-migration.md §8.

echo ""
echo "Session initialized."
