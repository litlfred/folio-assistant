#!/usr/bin/env bash
# session-start-coord-sweep.sh — the shared, agent-generic session-start primer.
#
# Emits a markdown block to stdout that each agent CLI injects into context at
# session start. It is wired from the native SessionStart command hook of every
# CLI that supports one (Claude Code via .claude/settings.json; Gemini CLI and
# Antigravity via their hooks.json) — all invoking THIS one script, so there is a
# single source of priming logic. It is also CLI-independent: it works whether or
# not the `beans` CLI is on PATH.
#
# What it surfaces:
#   1. The beans work-plan (`beans prime` + `beans list`, or a .beans/ fallback).
#   2. How far the default branch has moved since this branch diverged.
#   3. Recent sibling agent branches.
#   4. A generic recommended action.
#
# Heavy triage (reading every new commit / sibling PR) belongs in a background
# subagent, not here. Keep this fast and read-only.

set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Repo-scoped lock so parallel workspaces of the *same* repo don't all fetch at
# once, without serialising unrelated repos that share this generic script.
lock_id="$(printf '%s' "$REPO_ROOT" | cksum | cut -d' ' -f1)"
exec 200>"/tmp/folio-coord-sweep-${lock_id}.lock"
flock 200 2>/dev/null || true

# ── 1. Work-plan (beans) ────────────────────────────────────────────────────
BEANS_DIR="$REPO_ROOT/.beans"
echo "## Work-plan (beans) — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo
if command -v beans >/dev/null 2>&1; then
  beans prime 2>/dev/null || true
  beans list 2>/dev/null || echo "_(beans list returned nothing)_"
elif [ -d "$BEANS_DIR" ]; then
  echo "_(beans CLI not on PATH — reading .beans/ directly; run \`scripts/install-beans.sh\` for full priming)_"
  found=0
  for f in "$BEANS_DIR"/*.md; do
    [ -f "$f" ] || continue
    found=1
    title=$(sed -n 's/^# //p' "$f" 2>/dev/null | head -1)
    status=$(grep -m1 -iE '^(status|state):' "$f" 2>/dev/null | sed 's/^[^:]*:[[:space:]]*//')
    printf -- '- %s%s\n' "${title:-$(basename "$f" .md)}" "${status:+ [$status]}"
  done
  if [ "$found" -eq 0 ]; then echo "_(no beans found in .beans/)_"; fi
else
  echo "_(no .beans/ store and no beans CLI — nothing to prime; see AGENTS.md)_"
fi
echo

# ── 2. Branch / default-branch delta ────────────────────────────────────────
CURRENT_BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || echo DETACHED)"

# Resolve the default branch generically (origin/HEAD), fall back to main.
DEFAULT_BRANCH="$(git symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')"
[ -n "$DEFAULT_BRANCH" ] || DEFAULT_BRANCH=main

if ! git fetch origin "$DEFAULT_BRANCH" >/dev/null 2>&1; then
  echo "## Coord sweep"
  echo
  echo "_origin/$DEFAULT_BRANCH fetch failed (offline?). Branch: \`$CURRENT_BRANCH\`._"
  exit 0
fi

NEW_ON_DEFAULT="$(git rev-list --count "HEAD..origin/$DEFAULT_BRANCH" 2>/dev/null || echo 0)"

echo "## Coord sweep"
echo
echo "**Branch:** \`$CURRENT_BRANCH\` · **origin/$DEFAULT_BRANCH ahead by:** $NEW_ON_DEFAULT commit(s) since divergence."
echo

if [ "${NEW_ON_DEFAULT:-0}" -gt 0 ] 2>/dev/null; then
  echo "**Recent landings on \`$DEFAULT_BRANCH\` (last 10):**"
  git log --oneline "HEAD..origin/$DEFAULT_BRANCH" 2>/dev/null | head -10 | sed 's/^/- /'
  echo
fi

# ── 3. Recent sibling agent branches ────────────────────────────────────────
RECENT_SIBLINGS="$(git for-each-ref --sort=-committerdate \
  --format='%(refname:short) %(committerdate:relative) %(subject)' \
  refs/remotes/origin/claude 2>/dev/null \
  | grep -v "$CURRENT_BRANCH" \
  | head -8 || true)"

if [ -n "$RECENT_SIBLINGS" ]; then
  echo "**Recent sibling \`claude/*\` branches:**"
  echo "$RECENT_SIBLINGS" | sed 's/^/- /'
  echo
fi

# ── 4. Recommended action (generic) ─────────────────────────────────────────
cat <<'EOF'
**Recommended action:**

1. If you'll do durable work, claim a bean (`beans <id> --status in-progress`)
   or open one (`beans create "<title>"`) — see AGENTS.md and
   `.claude/skills/local/bean-coordination.md`.
2. If the default branch moved, dispatch a **background** subagent to triage the
   new landings + sibling activity above — don't do it in the foreground.
   Escalate only if it surfaces something actionable against the work-plan.
EOF
