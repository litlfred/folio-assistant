#!/usr/bin/env bash
# upload-bib-papers.sh — batch-intake of curated bibliography papers
# into uploads/. Each paper:
#   1. Downloaded (idempotent by file existence; skipped if already present),
#   2. Committed as its own commit (per-paper provenance in git),
#   3. All on one shared branch claude/upload-bib-papers-<utc-ymd>,
#   4. Pushed at end via SSH (origin = git@github.com:litlfred/qou.git).
#
# Open a PR yourself after the push, or pass `--pr` to invoke
# `gh pr create` once at the end (one PR, N commits).
#
# Usage:
#   bash scripts/upload-bib-papers.sh           # download + commit + push
#   bash scripts/upload-bib-papers.sh --dry-run # show what would be done
#   bash scripts/upload-bib-papers.sh --pr      # also open PR via gh CLI
#
# Paper list is loaded from scripts/bib-papers-list.txt (one entry per
# non-comment line, format `<url>|<target-filename>|<description>`).
# Regenerate the list from content/schema/references.ts via:
#   python3 scripts/gen-bib-papers-list.py

# ── Re-exec under bash if invoked via sh (POSIX shell lacks pipefail) ─
if [ -z "${BASH_VERSION:-}" ]; then
  if command -v bash >/dev/null 2>&1; then
    exec bash "$0" "$@"
  else
    echo "ERROR: this script requires bash (you invoked it via sh or a non-bash shell)." >&2
    echo "       Install bash, then run:  bash $0 $*" >&2
    exit 2
  fi
fi

set -euo pipefail

REPO_SLUG="litlfred/qou"
SSH_REMOTE="git@github.com:${REPO_SLUG}.git"
UPLOADS_DIR="uploads"
DEFAULT_BRANCH="main"
DRY_RUN=0
OPEN_PR=0

FORCE=0
for a in "$@"; do
  case "$a" in
    --dry-run) DRY_RUN=1 ;;
    --pr) OPEN_PR=1 ;;
    --force)
      # Re-download all listed papers even if uploads/<target> already
      # exists. Useful when a URL was corrected in references.ts but the
      # old (wrong) PDF was already fetched in a prior run — without
      # --force, the script idempotently skips and the wrong PDF stays.
      FORCE=1 ;;
    --help|-h)
      sed -n '2,/^$/p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $a" >&2; exit 2 ;;
  esac
done

# ── Repo root + paths ─────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PAPERS_LIST="$SCRIPT_DIR/bib-papers-list.txt"
cd "$REPO_ROOT"
mkdir -p "$UPLOADS_DIR"

if [[ ! -f "$PAPERS_LIST" ]]; then
  echo "ERROR: paper list not found at $PAPERS_LIST" >&2
  echo "       Generate it via:  python3 scripts/gen-bib-papers-list.py" >&2
  exit 2
fi

# ── Load papers list (skip blank + comment lines) ─────────────
PAPERS=()
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" ]] && continue
  [[ "$line" =~ ^[[:space:]]*# ]] && continue
  PAPERS+=("$line")
done < "$PAPERS_LIST"

echo "[load] ${#PAPERS[@]} papers from $PAPERS_LIST"

UTC_YMD="$(date -u +%Y-%m-%d)"
BRANCH="claude/upload-bib-papers-${UTC_YMD}"

if [[ $DRY_RUN -eq 1 ]]; then
  echo "[dry-run] would create branch: $BRANCH"
  echo "[dry-run] would process ${#PAPERS[@]} papers:"
  for entry in "${PAPERS[@]}"; do
    IFS='|' read -r url target _desc <<<"$entry"
    if [[ -f "$UPLOADS_DIR/$target" ]]; then
      echo "  [skip] $UPLOADS_DIR/$target already present"
    else
      echo "  [get]  $url → $UPLOADS_DIR/$target"
    fi
  done
  exit 0
fi

# ── Ensure SSH remote ─────────────────────────────────────────
CURRENT_REMOTE="$(git remote get-url origin 2>/dev/null || true)"
if [[ "$CURRENT_REMOTE" != "$SSH_REMOTE" ]]; then
  if [[ -z "$CURRENT_REMOTE" ]]; then
    git remote add origin "$SSH_REMOTE"
  else
    git remote set-url origin "$SSH_REMOTE"
  fi
  echo "[git] origin → $SSH_REMOTE"
fi

# SSH probe
ssh_probe="$(ssh -o StrictHostKeyChecking=accept-new -T git@github.com 2>&1 || true)"
if echo "$ssh_probe" | grep -qi "successfully authenticated"; then
  echo "[ssh] github.com auth OK"
else
  echo "WARN: ssh -T git@github.com did not return success; check ~/.ssh setup" >&2
  echo "$ssh_probe" | head -2 >&2
fi

# Branch off main
git fetch origin "$DEFAULT_BRANCH" --quiet 2>/dev/null || true
if git rev-parse --verify --quiet "$BRANCH" >/dev/null; then
  echo "[git] branch $BRANCH already exists locally; checking out"
  git checkout "$BRANCH"
else
  echo "[git] new branch: $BRANCH (off origin/$DEFAULT_BRANCH)"
  git checkout -b "$BRANCH" "origin/$DEFAULT_BRANCH"
fi

# ── Process each paper ────────────────────────────────────────
ADDED=0
SKIPPED=0
FAILED=0
for entry in "${PAPERS[@]}"; do
  IFS='|' read -r url target desc <<<"$entry"
  target_path="$UPLOADS_DIR/$target"

  if [[ -f "$target_path" && $FORCE -eq 0 ]]; then
    SHA_LOCAL="$(sha256sum "$target_path" | cut -d' ' -f1)"
    echo "[skip] $target_path already present (sha=${SHA_LOCAL:0:12})"
    SKIPPED=$((SKIPPED+1))
    continue
  fi
  if [[ -f "$target_path" && $FORCE -eq 1 ]]; then
    OLD_SHA="$(sha256sum "$target_path" | cut -d' ' -f1)"
    echo "[force] $target_path exists (sha=${OLD_SHA:0:12}) — re-downloading"
    rm -f "$target_path"
  fi

  echo "[get ] $url"
  TMP="$(mktemp)"
  if curl --fail --silent --show-error --location \
          --user-agent "qou-upload-bib-papers/1.0 (+https://github.com/${REPO_SLUG})" \
          --max-time 120 \
          --output "$TMP" \
          "$url"; then
    SIZE="$(stat -c%s "$TMP" 2>/dev/null || stat -f%z "$TMP")"
    SHA="$(sha256sum "$TMP" | cut -d' ' -f1)"
    mv "$TMP" "$target_path"
    echo "[ok  ] $target_path  size=${SIZE}B  sha=${SHA:0:12}"

    # Use -f to bypass the global *.pdf gitignore rule on uploads/
    # (the repo's .gitignore should whitelist uploads/* via a `!` rule,
    # but -f is a defense in depth in case it doesn't).
    git add -f "$target_path"
    git commit -m "intake: $target (size=${SIZE}B, sha=${SHA:0:12})

$desc

Source: $url

Per scripts/upload-bib-papers.sh batch; each paper committed
separately so per-paper provenance lives in git history."
    ADDED=$((ADDED+1))
  else
    echo "FAIL  $url (curl exit non-zero; skipping)" >&2
    rm -f "$TMP"
    FAILED=$((FAILED+1))
  fi
done

echo
echo "─── summary ───"
echo "  added:   $ADDED"
echo "  skipped: $SKIPPED (already present)"
echo "  failed:  $FAILED (curl error — skipped, did not abort batch)"

if [[ $ADDED -eq 0 && $SKIPPED -gt 0 ]]; then
  echo "[done] nothing new to push; all $SKIPPED papers already in uploads/"
  exit 0
elif [[ $ADDED -eq 0 ]]; then
  echo "[done] nothing committed (all attempts failed)"
  exit 1
fi

# ── Push branch ───────────────────────────────────────────────
# Use --force-with-lease: this branch is uniquely owned by the script
# (named claude/upload-bib-papers-<utc-ymd>), so a previous broken run
# may have left a different tip on remote. --force-with-lease is safe
# — it only force-pushes if the remote matches what we last fetched,
# bailing out if someone else has pushed in between.
echo "[git] push --force-with-lease -u origin $BRANCH"
git push --force-with-lease -u origin "$BRANCH"

PUSHED_URL="https://github.com/${REPO_SLUG}/tree/${BRANCH}"
echo "[ok ] branch pushed: $PUSHED_URL ($ADDED commits)"

# ── Optional PR ───────────────────────────────────────────────
if [[ $OPEN_PR -eq 1 ]]; then
  if command -v gh >/dev/null 2>&1; then
    echo "[gh ] opening PR..."
    gh pr create \
      --base "$DEFAULT_BRANCH" \
      --head "$BRANCH" \
      --title "intake: $ADDED bibliography papers added to uploads/" \
      --body "Batch upload from scripts/upload-bib-papers.sh; $ADDED new files, $SKIPPED already present. Each file is its own commit so per-paper provenance is preserved.

Paper list: scripts/bib-papers-list.txt (generated by scripts/gen-bib-papers-list.py from content/schema/references.ts)."
  else
    echo "WARN: gh CLI not found; open PR manually at $PUSHED_URL" >&2
  fi
fi
