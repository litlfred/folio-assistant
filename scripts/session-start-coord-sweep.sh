#!/usr/bin/env bash
# session-start-coord-sweep.sh
#
# Runs at session start (per .claude/settings.json SessionStart hook).
# Emits a brief context block that the agent reads + uses to decide
# whether to dispatch a background subagent for full coord-sweep.
#
# Per CLAUDE.md "User accessibility" §5-minute idle trigger AND
# .claude/skills/local/coordinate.md: at session start fetch origin/main,
# list relevant new commits, summarize sibling PR activity. Pass the
# heavy work off to a background Explore subagent — don't disrupt
# user-facing flow.
#
# Output: markdown that's printed back to the agent as a system reminder.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# 1. Fetch origin/main quietly
git fetch origin main >/dev/null 2>&1 || {
  echo "## Coord sweep — origin/main fetch failed (network?)"
  exit 0
}

CURRENT_BRANCH="$(git symbolic-ref --short HEAD 2>/dev/null || echo "DETACHED")"

# 2. Did main change since this branch was created?
NEW_COMMITS_ON_MAIN="$(git log --oneline HEAD..origin/main 2>/dev/null | wc -l | tr -d ' ')"

# 3. Find sibling claude/* branches updated in last 24h
RECENT_SIBLINGS="$(git for-each-ref --sort=-committerdate \
  --format='%(refname:short) %(committerdate:relative) %(subject)' \
  refs/remotes/origin/claude 2>/dev/null \
  | grep -v "$CURRENT_BRANCH" \
  | head -8 || true)"

# 4. Emit the markdown block
cat <<EOF
## Coord sweep (session start) — $(date -u +%Y-%m-%dT%H:%M:%SZ)

**Branch:** \`$CURRENT_BRANCH\`
**Origin/main is ahead by:** $NEW_COMMITS_ON_MAIN commit(s) since this branch diverged.

EOF

if [ "$NEW_COMMITS_ON_MAIN" -gt 0 ]; then
  echo "**Recent main landings (last 10):**"
  git log --oneline HEAD..origin/main | head -10 | sed 's/^/- /'
  echo
fi

if [ -n "$RECENT_SIBLINGS" ]; then
  echo "**Recent sibling branches on origin (last 24h):**"
  echo "$RECENT_SIBLINGS" | sed 's/^/- /'
  echo
fi

# 5. Recommended action
echo "**Recommended action:**"
echo
echo "If the current request touches a goal listed in \`STATUS.md\`:"
echo "1. Read the goal's master ledger (\`docs/coordination/<goal>.md\`)"
echo "2. Read the queue (\`todos/<goal>-queue.json\`)"
echo "3. Run \`/session-intent\` to declare intent + claim a probe"
echo "4. **Dispatch a background \`Agent(subagent_type=Explore)\`** to"
echo "   triage the new main commits + sibling activity above — do NOT"
echo "   do it in the foreground. Escalate to user only if the subagent"
echo "   surfaces something actionable against the current workplan."
echo
echo "*See \`.claude/skills/local/coordinate.md\` §11 (multi-agent same-goal)*"
