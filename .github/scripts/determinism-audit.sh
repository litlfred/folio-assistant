#!/usr/bin/env bash
#
# Determinism audit: build each producer TWICE in the same tree and diff the
# bytes. A cached output is only as good as its producer is a function of its
# inputs: a producer that stamps the clock, the run, the merge ref or an
# unstable ordering writes different bytes from the same inputs, so its output
# can never be verified against a key (`.github/actions/cached-step`, trust
# `exact`) and a committer can never publish it (`cache:publish`).
#
# What a producer WROTE is measured, not declared: every file git reports as
# modified, untracked or ignored after the run (outside node_modules/ and
# .git/), hashed. Run 1 and run 2 start from the same tree (run 1's outputs
# are removed with `git clean`/`git checkout` first), so any path whose hash
# differs, or that only one run wrote, is a non-deterministic writer.
#
# Usage: determinism-audit.sh [--keep] [--force] [PRODUCER...]   (--force: outside CI)
#   PRODUCER is a name from the table below; default: all of them.
#   --keep keeps run 1's copy under $OUT (default build/determinism-audit).
#
# Writes $OUT/report.md (and $GITHUB_STEP_SUMMARY when set), one section per
# producer: DETERMINISTIC, or the differing paths with the first differing
# line of each. Exit: 0 all deterministic · 1 a producer differs · 3 a
# producer failed to run (could-not-determine, never "deterministic").
#
# THE TREE MUST BE CLEAN: the audit restores it between runs with
# `git checkout -- . && git clean -fdx -e node_modules -e <mounts>`.

set -uo pipefail

# name | command. The producers whose bundles CI caches or means to (beans x35i, tv20).
PRODUCERS=$(cat <<'EOF'
qa-working-copy|bun run cat qa:working-copy
publish-pages|bun run cat derive:publish
smart-pages|bun run smart:pages
ig-index|bun run cat ig-index:build
kg-export|bun run cat kg:export
render-bpmn|bun run cat render:bpmn
EOF
)
# AUDIT_PRODUCERS (tests): the same `name|command` lines, replacing the table.
[ -z "${AUDIT_PRODUCERS:-}" ] || PRODUCERS="$AUDIT_PRODUCERS"

keep=false; force=false
want=()
for a in "$@"; do
  case "$a" in --keep) keep=true ;; --force) force=true ;; -*) echo "usage: $0 [--keep] [--force] [PRODUCER...]" >&2; exit 2 ;; *) want+=("$a") ;; esac
done
# OUTSIDE the checkout, so nothing the reset (`git clean -fdx`) or a producer
# does inside the tree can touch the audit's own records. (First CI run,
# 2026-11-05: every producer read "failed on run 1" with no log written — the
# reset's PREPARE step had failed, silently; its output now goes to
# $OUT/prepare.log and the report names which step failed.)
OUT="${OUT:-${RUNNER_TEMP:-${TMPDIR:-/tmp}}/determinism-audit}"
ROOT=$(git rev-parse --show-toplevel) || exit 3
cd "$ROOT" || exit 3
mkdir -p "$OUT" && OUT=$(cd "$OUT" && pwd) || exit 3
case "$OUT/" in "$ROOT"/*) echo "determinism-audit: OUT ($OUT) must be outside the checkout; the reset would delete it" >&2; exit 2 ;; esac

# Mounted instances are ignored directories the reset must not clean away.
mounts=$(python3 -c 'import json; print("\n".join(i["name"] for i in json.load(open("index.config.json"))["instances"]))' 2>/dev/null || true)
excl=(-e node_modules -e .cache)
while IFS= read -r m; do [ -n "$m" ] && excl+=(-e "/$m"); done <<< "$mounts"

# The reset deletes every ignored file outside the mounts (build caches
# included): that is the point, and why a person has to say --force.
if [ "${CI:-}" != true ] && [ "$force" != true ]; then
  echo "determinism-audit: the reset runs \`git clean -fdx\` outside the mounts; pass --force to run it here" >&2
  exit 2
fi
if [ -n "$(git status --porcelain --untracked-files=normal)" ]; then
  echo "determinism-audit: the tree is not clean; commit or stash first" >&2
  exit 3
fi

# PREPARE (optional): a command run after every reset, before the marker, to
# lay down what the reset removed and a producer reads (e.g. `state:mount`).
reset_tree() {
  git checkout -q -- . && git clean -q -fdx "${excl[@]}" || return 1
  [ -z "${PREPARE:-}" ] || bash -c "$PREPARE" > "$OUT/prepare.log" 2>&1 || { echo "determinism-audit: PREPARE failed; see $OUT/prepare.log" >&2; return 1; }
}

# Every file written since the marker, anywhere in the checkout (mounted
# instances included), with its sha256. Measured by mtime, so nothing about a
# producer's outputs is declared.
snapshot() {
  find . \( -name node_modules -o -name .git -o -path ./.cache \) -prune -o \
    -type f -newer "$1" -print | sed 's#^\./##' | sort \
    | while IFS= read -r p; do printf '%s  %s\n' "$(sha256sum < "$p" | cut -c1-64)" "$p"; done
}

mkdir -p "$OUT"
report="$OUT/report.md"
echo "# Determinism audit at $(git rev-parse --short HEAD)" > "$report"
status=0

while IFS='|' read -r name cmd; do
  [ -n "$name" ] || continue
  if [ ${#want[@]} -gt 0 ] && [[ ! " ${want[*]} " == *" $name "* ]]; then continue; fi
  echo "== $name: $cmd" >&2
  d="$OUT/$name"; rm -rf "$d"; mkdir -p "$d"
  ok=true; failed=""
  for i in 1 2; do
    reset_tree || { ok=false; failed="the reset or PREPARE before run $i (see \`$OUT/prepare.log\`)"; break; }
    mkdir -p "$d"
    touch "$d/marker$i"; sleep 1   # mtime granularity: a write in this second is after the marker
    if ! bash -c "$cmd" > "$d/run$i.log" 2>&1; then ok=false; failed="\`$cmd\` on run $i (see \`$d/run$i.log\`)"; break; fi
    snapshot "$d/marker$i" > "$d/run$i.sha"
    if [ "$i" = 1 ]; then
      mkdir -p "$d/copy1"
      cut -c67- "$d/run1.sha" | tar -cf - -T - 2>/dev/null | tar -xf - -C "$d/copy1"
    fi
  done
  if [ "$ok" = false ]; then
    printf '\n## `%s` — COULD NOT DETERMINE\n\nFailed: %s.\n' "$name" "$failed" >> "$report"
    status=3; reset_tree; continue
  fi
  # Every path either run wrote: run 1's bytes (copy1) against the tree after
  # run 2. A path run 2 left alone still holds run 1's bytes, so a producer that
  # skips an up-to-date file is not reported; one that only run 1 wrote is.
  diffs=$(cat <(cut -c67- "$d/run1.sha") <(cut -c67- "$d/run2.sha") | sort -u | while IFS= read -r p; do
      if [ -f "$d/copy1/$p" ] && [ -f "$p" ]; then cmp -s "$d/copy1/$p" "$p" || echo "$p"; else echo "$p"; fi
    done)
  n=$(wc -l < "$d/run1.sha")
  if [ -z "$diffs" ]; then
    printf '\n## `%s` — DETERMINISTIC\n\n%s files written, byte-identical across two runs.\n' "$name" "$n" >> "$report"
  else
    [ "$status" = 3 ] || status=1
    printf '\n## `%s` — %s of %s files DIFFER\n\n| path | first differing line (run 1 → run 2) |\n|---|---|\n' \
      "$name" "$(printf '%s\n' "$diffs" | wc -l)" "$n" >> "$report"
    while IFS= read -r p; do
      a="$d/copy1/$p"; b="$p"
      if [ ! -f "$a" ] || [ ! -f "$b" ]; then line="written by one run only"
      else line=$(diff <(head -c 2000000 "$a") <(head -c 2000000 "$b") | grep -m2 -E '^[<>]' | cut -c1-160 | tr '\n|' ' /'); fi
      printf '| `%s` | %s |\n' "$p" "${line:-binary or long-line difference}" >> "$report"
    done <<< "$(printf '%s\n' "$diffs" | head -60)"
  fi
  [ "$keep" = true ] || rm -rf "$d/copy1"
  reset_tree
done <<< "$PRODUCERS"

[ -n "${GITHUB_STEP_SUMMARY:-}" ] && cat "$report" >> "$GITHUB_STEP_SUMMARY"
cat "$report"
exit "$status"
