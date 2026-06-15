#!/bin/bash
# Run the lean compile audit end-to-end.
#
# Usage:
#   ./scripts/lean-compile-audit.sh
#   ./scripts/lean-compile-audit.sh --branch <custom-branch-name>
#
# Behavior:
#   1. Fetches origin/main and branches to a fresh feature branch BEFORE
#      starting the slow Lean audit (default name:
#      claude/lean-compile-audit-YYYY-MM-DD; reset to origin/main if it
#      already exists locally). This isolates the audit from any race
#      with new main commits during the run.
#   2. Stashes any uncommitted in-progress work so the audit branch
#      stays scoped to its own changes.
#   3. Runs the slow Lean build + per-file diagnostics collection +
#      content QA sweep on the feature branch.
#   4. Commits the audit results (diagnostics JSON + qa.json sidecars)
#      and pushes the feature branch (force-with-lease so re-running
#      on the same day overwrites the prior auto-branch cleanly).
#   5. Restores the user's original branch + stashed working tree.
#   6. Prints the PR-create URL so the user can open a PR for review
#      instead of pushing directly to main.
#
# Robustness:
#   - The script NEVER pushes to main. Always to a feature branch.
#   - If main has moved while the audit was running, the feature
#     branch is unaffected (it was created from origin/main at the
#     start; the branch's commits land cleanly on top of that base).
#   - Push failures retry with exponential backoff (network-level
#     retries; not for non-fast-forward rejections, which can't
#     happen on a fresh auto-managed branch).
#   - On script exit (success or failure), the trap restores the
#     user's prior branch + stashed work.
set -euo pipefail

# ── CLI arg parsing ─────────────────────────────────────────────
BRANCH=""
while [ $# -gt 0 ]; do
  case "$1" in
    --branch)
      BRANCH="${2:-}"
      if [ -z "$BRANCH" ]; then
        echo "error: --branch requires a value" >&2
        exit 2
      fi
      shift 2
      ;;
    --help|-h)
      sed -n '2,40p' "$0"
      exit 0
      ;;
    *)
      echo "error: unknown argument: $1" >&2
      echo "usage: $0 [--branch <name>]" >&2
      exit 2
      ;;
  esac
done

if [ -z "$BRANCH" ]; then
  BRANCH="claude/lean-compile-audit-$(date -u +%Y-%m-%d)"
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# ── Save user's state for restoration on exit ───────────────────
START_BRANCH=""
STASHED=0
if git rev-parse --git-dir &>/dev/null; then
  START_BRANCH="$(git branch --show-current 2>/dev/null || true)"
fi

restore_state() {
  set +e
  if [ "$STASHED" = "1" ]; then
    echo ""
    echo "Restoring previously-stashed changes..."
    git stash pop --quiet 2>/dev/null || \
      echo "(stash pop failed; recover with 'git stash list' + 'git stash pop')"
  fi
  if [ -n "$START_BRANCH" ] && \
     [ "$(git branch --show-current 2>/dev/null)" != "$START_BRANCH" ]; then
    echo "Restoring branch '$START_BRANCH'..."
    git checkout "$START_BRANCH" --quiet 2>/dev/null || \
      echo "(checkout failed; you are on '$(git branch --show-current 2>/dev/null)')"
  fi
}
trap restore_state EXIT

# ── Fetch origin/main + branch FIRST (before slow audit) ────────
echo "Fetching origin/main..."
git fetch origin main --quiet

# Stash any uncommitted work so the audit branch is scoped to its own diff
if ! git diff --quiet HEAD 2>/dev/null || ! git diff --quiet --cached 2>/dev/null; then
  echo "(stashing uncommitted in-progress work)"
  git stash push -m "lean-compile-audit pre-run $(date -u +%Y-%m-%dT%H:%M:%SZ)" --quiet
  STASHED=1
fi

# Create/reset the audit feature branch from origin/main
# (-B resets local if it exists; we force-with-lease later on push for
# the same reason. The branch is auto-managed; previous runs that opened
# a PR will have been merged or closed by the time we re-run today.)
echo "Branching to '$BRANCH' from origin/main..."
git checkout -B "$BRANCH" origin/main --quiet

# ── Install elan if missing ─────────────────────────────────────
if ! command -v lean &>/dev/null && ! [ -f "$HOME/.elan/bin/lean" ]; then
  echo "Installing elan (Lean toolchain manager)..."
  curl https://elan.lean-lang.org/install.sh -sSf | sh -s -- -y
fi
export PATH="$HOME/.elan/bin:$PATH"

# ── Install bun if missing ──────────────────────────────────────
if ! command -v bun &>/dev/null; then
  echo "Installing bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

# ── Fetch Mathlib cache + build ─────────────────────────────────
echo "Fetching Mathlib cache..."
lake exe cache get 2>/dev/null || true

echo "Building Lean (this may take a while on first run)..."
lake build || echo "Build had errors — continuing to collect diagnostics"

# ── Install content deps ────────────────────────────────────────
(cd content && bun install --frozen-lockfile 2>/dev/null || bun install)

# ── Collect diagnostics ─────────────────────────────────────────
echo "Collecting diagnostics from .lean files..."
TARGETS=$(bun run content/pipeline/lean-compile-audit.ts --list 2>/dev/null \
  | grep '\.lean$')
TOTAL=$(echo "$TARGETS" | wc -l)
JSONL=$(mktemp /tmp/lean-diag.XXXXXX.jsonl)
COUNT=0

echo "$TARGETS" | while IFS= read -r f; do
  COUNT=$((COUNT + 1))
  printf "\r[%d/%d] %s" "$COUNT" "$TOTAL" "$f"
  DIAG=$(lake env lean "$f" 2>&1 | grep ': error:' | head -10 || true)
  ENTRIES=""
  if [ -n "$DIAG" ]; then
    ENTRIES=$(echo "$DIAG" | while IFS= read -r line; do
      LN=$(echo "$line" | sed -n 's/.*:\([0-9]*\):[0-9]*: error:.*/\1/p')
      MSG=$(echo "$line" | sed 's/.*: error: //' | cut -c1-500 | sed 's/"/\\"/g; s/\\/\\\\/g')
      printf '{"line":%s,"severity":"error","message":"%s"},' "${LN:-0}" "$MSG"
    done | sed 's/,$//')
  fi
  echo "{\"file\":\"$f\",\"diagnostics\":[$ENTRIES]}" >> "$JSONL"
done
echo ""

# ── Ingest + sweep ──────────────────────────────────────────────
echo "Ingesting diagnostics..."
bun run content/pipeline/lean-compile-audit.ts --ingest "$JSONL"

echo "Running QA sweep..."
bun run content/pipeline/qa-sweep.ts content/ --only proof-lean-compiles

rm -f "$JSONL"

# ── Commit + push results ──────────────────────────────────────
echo ""
echo "Committing results..."
git add docs/audits/lean-compile-diagnostics.json
git add 'content/**/*.qa.json'

if git diff --cached --quiet; then
  echo "No audit changes to commit — every diagnostic + sidecar already"
  echo "matches origin/main. Cleaning up branch '$BRANCH'."
  exit 0
fi

git commit -m "audit: lean compile diagnostics + sidecar entries"

# Push with retry (force-with-lease for the auto-managed branch case;
# safe because $BRANCH is created from origin/main at script start, so
# any remote ref under the same name is a stale prior run by us)
echo "Pushing '$BRANCH'..."
for attempt in 1 2 3 4; do
  if git push --force-with-lease -u origin "$BRANCH" 2>&1; then
    break
  fi
  if [ "$attempt" = "4" ]; then
    echo ""
    echo "error: push failed after 4 attempts. The branch is committed"
    echo "       locally; you can push manually with:"
    echo "         git push --force-with-lease -u origin '$BRANCH'"
    exit 1
  fi
  delay=$((2 ** attempt))
  echo "push failed (attempt $attempt) — retrying in ${delay}s..."
  sleep "$delay"
done

echo ""
echo "✓ Audit committed + pushed to branch:"
echo "    $BRANCH"
echo ""
echo "Open a pull request:"
echo "    https://github.com/litlfred/qou/pull/new/$BRANCH"
echo ""
echo "Or via the GitHub CLI:"
echo "    gh pr create --base main --head '$BRANCH' \\"
echo "      --title 'audit: lean compile diagnostics + sidecar refresh' \\"
echo "      --body 'Periodic lean compile audit; refreshes proof-lean-compiles sidecars.'"
echo ""
echo "Done."
