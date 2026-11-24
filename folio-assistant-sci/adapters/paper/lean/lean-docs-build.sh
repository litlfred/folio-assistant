#!/usr/bin/env bash
# lean-docs-build — build a Lake package's doc-gen4 HTML, cache-aware.
#
# The visualiser of a `lean` directory is this render, wrapped in the harness
# rail by lean-render.ts. This script only BUILDS it; it publishes nothing.
#
# USAGE (run from the folio's checkout root)
#
#   bash <sci>/adapters/paper/lean/lean-docs-build.sh \
#     --lake-root folio/quantum-observable-universe/lean --lib QOU \
#     [--platform <index root>] [--restore] [--allow-cold] [--dry-run]
#
# Output: <lake-root>/.lake/build/doc   (doc-gen4's own location; printed last)
#
# WHAT IT DOES, IN ORDER, AND WHY EACH GUARD EXISTS
#
# 1. Refuses while another `lake` or `lean` process is running. Two Lake
#    processes on one `.lake/` race on the same oleans; the folio's own notes
#    record a concurrent background `lake build` rewriting a tree another
#    agent was measuring (qou AGENTS.md, 2026-09-06).
# 2. Refuses on a tree restored WITHOUT traces (`.lake/RESTORED-NO-TRACES`).
#    `lake build` treats an untraced olean as stale, rebuilds it and EVICTS
#    the restored cache: measured on qou, Mathlib oleans 6990 -> 334 in ten
#    minutes with zero paper modules built (bean qou-r13s). `:docs` is a Lake
#    build, so the same eviction applies. Restore a traced cache first.
# 3. Checks the warm cache is present (`lake-cache.sh status`); with
#    `--restore` restores it (about 2 minutes) instead. Without a warm cache it
#    refuses unless `--allow-cold`: a from-source Mathlib build is 30-60
#    minutes before doc-gen4 even starts.
# 4. Enables doc-gen4 for this build only. A folio keeps the `[[require]]`
#    commented out on main (it adds ~20 heavy metaprogramming modules to every
#    `lake build`). If the lakefile carries the `--- BEGIN doc-gen4` /
#    `--- END doc-gen4` sentinels, the commented lines between them are
#    uncommented in place and the lakefile is restored on exit, whatever
#    happens. A lakefile that already requires doc-gen4 is left alone.
#    `lake update` is NOT run: it can move other pins; the folio's manifest
#    must already list doc-gen4 at the rev the lakefile names.
# 5. Runs `lake -R -Kenv=dev build <Lib>:docs` for each `--lib`.
#
# COST, MEASURED AND NOT
#
#   doc-gen4's `:docs` facet renders EVERY module in the import closure, so a
#   Mathlib-based package renders Mathlib too. qou's July 2026 render: 4,193
#   pages, 545 MB, of which 337 MB is Mathlib/. Build time was not measured
#   here (this script was written without running Lake: another agent held the
#   cache). Expect: compiling doc-gen4 and its dependencies once, then one
#   doc pass per module of the closure — thousands for Mathlib. Prune at
#   publish time with `lean-render.ts --modules <Lib,...>` (29 MB for qou).
#   Disk: the render plus doc-gen4's own build under .lake/; check free space
#   first (`df -h .`).
#
# EXIT CODES
#   0 built   1 build failed   2 usage / guard refused   3 cache miss (no --allow-cold)
set -uo pipefail

PROG="${0##*/}"
LAKE_ROOT=""
LIBS=()
PLATFORM="${FOLIO_ASSISTANT_ROOT:-}"
RESTORE=0
ALLOW_COLD=0
DRY=0

while [ $# -gt 0 ]; do
  case "$1" in
    --lake-root) LAKE_ROOT="$2"; shift 2 ;;
    --lib) LIBS+=("$2"); shift 2 ;;
    --platform) PLATFORM="$2"; shift 2 ;;
    --restore) RESTORE=1; shift ;;
    --allow-cold) ALLOW_COLD=1; shift ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) sed -n '2,52p' "$0"; exit 0 ;;
    *) echo "$PROG: unknown argument $1" >&2; exit 2 ;;
  esac
done
[ -n "$LAKE_ROOT" ] && [ "${#LIBS[@]}" -gt 0 ] || { echo "$PROG: --lake-root and at least one --lib are required" >&2; exit 2; }
[ -d "$LAKE_ROOT" ] || { echo "$PROG: $LAKE_ROOT is not a directory" >&2; exit 2; }
LAKE_ROOT="$(cd "$LAKE_ROOT" && pwd)"

LAKEFILE=""
for f in lakefile.toml lakefile.lean; do [ -f "$LAKE_ROOT/$f" ] && LAKEFILE="$LAKE_ROOT/$f" && break; done
[ -n "$LAKEFILE" ] || { echo "$PROG: no lakefile.toml or lakefile.lean in $LAKE_ROOT" >&2; exit 2; }

# 1. Nobody else on the cache.
if pgrep -x lake >/dev/null 2>&1 || pgrep -x lean >/dev/null 2>&1; then
  echo "$PROG: a lake/lean process is already running — refusing to share .lake/ with it" >&2
  exit 2
fi

# 2. No build over an untraced restore.
for d in "$LAKE_ROOT" "$(git -C "$LAKE_ROOT" rev-parse --show-toplevel 2>/dev/null || echo "$LAKE_ROOT")"; do
  if [ -f "$d/.lake/RESTORED-NO-TRACES" ]; then
    echo "$PROG: $d/.lake/RESTORED-NO-TRACES — a Lake build here would evict the restored cache. Restore a traced cache first." >&2
    exit 2
  fi
done

# 3. Warm cache.
# This layer's own copy (it moved here from the tools layer,
# folio-assistant#2598), else the one in the index checkout --platform names.
CACHE_SH=""
for c in "$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)/scripts/lake-cache.sh" "${PLATFORM:+$PLATFORM/folio-assistant-sci/scripts/lake-cache.sh}"; do
  [ -n "$c" ] && [ -f "$c" ] && CACHE_SH="$c" && break
done
if [ -n "$CACHE_SH" ]; then
  if [ "$RESTORE" = 1 ]; then
    echo "$ bash $CACHE_SH restore --lake-root $LAKE_ROOT"
    [ "$DRY" = 1 ] || bash "$CACHE_SH" restore --lake-root "$LAKE_ROOT"; rc=$?
    [ "${rc:-0}" = 0 ] || [ "$ALLOW_COLD" = 1 ] || { echo "$PROG: restore missed (exit $rc) — pass --allow-cold to build Mathlib from source" >&2; exit 3; }
  elif ! bash "$CACHE_SH" status --lake-root "$LAKE_ROOT" >/dev/null 2>&1; then
    [ "$ALLOW_COLD" = 1 ] || { echo "$PROG: no warm cache under $LAKE_ROOT/.lake (lake-cache.sh status) — pass --restore, or --allow-cold to build from source" >&2; exit 3; }
  fi
else
  echo "$PROG: lake-cache.sh not found (pass --platform <index root>); cannot check the cache" >&2
  [ "$ALLOW_COLD" = 1 ] || exit 3
fi

# 4. doc-gen4 for this build only.
BACKUP=""
restore_lakefile() { [ -n "$BACKUP" ] && [ -f "$BACKUP" ] && mv -f "$BACKUP" "$LAKEFILE"; }
trap restore_lakefile EXIT INT TERM
if grep -Eq '^[[:space:]]*name[[:space:]]*=[[:space:]]*"doc-gen4"|require[[:space:]]+"leanprover"[[:space:]]*/[[:space:]]*"doc-gen4"|require[[:space:]]+«?doc-gen4' "$LAKEFILE"; then
  echo "doc-gen4 already required by $LAKEFILE"
elif grep -q -- '--- BEGIN doc-gen4' "$LAKEFILE"; then
  BACKUP="$(mktemp "${LAKEFILE}.lean-docs.XXXXXX")"
  cp -p "$LAKEFILE" "$BACKUP"
  sed -i '/--- BEGIN doc-gen4/,/--- END doc-gen4/ s/^# \(\[\[require\]\]\|name = \|git = \|rev = \)/\1/' "$LAKEFILE"
  echo "doc-gen4 enabled for this build (lakefile restored on exit)"
else
  echo "$PROG: $LAKEFILE neither requires doc-gen4 nor carries the '--- BEGIN doc-gen4' sentinels; add the require (commented, between sentinels) first" >&2
  exit 2
fi

# 5. Build.
rc=0
for lib in "${LIBS[@]}"; do
  echo "$ (cd $LAKE_ROOT && lake -R -Kenv=dev build $lib:docs)"
  if [ "$DRY" = 0 ]; then
    (cd "$LAKE_ROOT" && lake -R -Kenv=dev build "$lib:docs") || rc=1
  fi
done
[ "$rc" = 0 ] || { echo "$PROG: doc build failed" >&2; exit 1; }
echo "$LAKE_ROOT/.lake/build/doc"
