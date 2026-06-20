#!/usr/bin/env bash
# Background Lean service: update deps, fetch cache, build.
#
# Full lifecycle for getting Lean MCP operational:
#   1. Check lean/lake availability
#   2. lake update (fetch/update all deps from lakefile.toml)
#   3. lake exe cache get (fetch Mathlib oleans)
#   4. lake build (compile QOU project)
#   5. On failure: retry with exponential backoff (10s, 30s, 90s, 270s)
#
# Writes status to /tmp/qou-lean-build-status.json for session-status.sh
# and the editor skill to consume. Status values:
#   unavailable  — lean not installed or content/quantum-observable-universe/lean/ missing
#   updating     — running lake update
#   caching      — running lake exe cache get
#   building     — running lake build
#   retrying     — build failed, waiting to retry
#   ready        — build succeeded, MCP fully operational
#   failed       — all retries exhausted
#
# Build timing:
#   Per-file wall-clock times are captured and written to
#   /tmp/qou-lean-build-timing.txt (sorted slowest-first).
#   The profiler option in lakefile.toml adds per-declaration
#   elaboration times to the build log.
#
# Usage: ./scripts/lean-build-bg.sh &
#   (launched by SessionStart hook, runs in background)

set -uo pipefail

# Shared Lean env helpers (sets REPO_ROOT, LEAN_DIR, PATH, has())
source "$(dirname "$0")/lib/lean-env.sh"

# Workspace lock: only 1 build per workspace. If locked, exit.
exec 201>"$REPO_ROOT/.lake-build.lock"
if ! flock -n 201; then
  echo "lean-build-bg: Build already running in this workspace. Skipping."
  exit 0
fi

# Global concurrency limit: max 3 globally. If full, exit.
got_global=0
for i in 1 2 3; do
  exec 200>"/tmp/qou-lean-build-$i.lock"
  if flock -n 200; then
    got_global=$i
    break
  fi
done

if [ "$got_global" -eq 0 ]; then
  echo "lean-build-bg: Global limit of 3 builds reached. Skipping."
  exit 0
fi

STATUS_FILE="/tmp/qou-lean-build-status.json"
LOG_DIR="/tmp"
TIMING_FILE="/tmp/qou-lean-build-timing.txt"

write_status() {
    local status="$1" msg="$2" step="$3" attempt="${4:-0}"
    cat > "$STATUS_FILE" <<EOF
{"status": "$status", "message": "$msg", "step": "$step", "timestamp": "$(date -Iseconds)", "attempts": $attempt}
EOF
}

# ── Print timing report from build log ──────────────────────────────
print_timing_report() {
    local log="$1"
    echo "═══════════════════════════════════════════════════════" > "$TIMING_FILE"
    echo "  QOU Lean Build — Per-File Timing Report" >> "$TIMING_FILE"
    echo "  $(date)" >> "$TIMING_FILE"
    echo "═══════════════════════════════════════════════════════" >> "$TIMING_FILE"
    echo "" >> "$TIMING_FILE"

    # Extract [Elab] profiler lines: "  [Elab] ...took Xs"
    # and "Building MODULE" lines from lake output
    if grep -qE '^\[.*\] (Building|Compiling)' "$log" 2>/dev/null; then
        echo "── Lake build phases ──" >> "$TIMING_FILE"
        grep -E '^\[.*\] (Building|Compiling)' "$log" >> "$TIMING_FILE" 2>/dev/null
        echo "" >> "$TIMING_FILE"
    fi

    # Extract profiler timing from Lean output
    # Format: "  <declaration> <Ns>" or "[profiler] ... took <N>ms"
    if grep -qiE 'took [0-9]+(\.[0-9]+)?(ms|s)|elaboration.*[0-9]+ms' "$log" 2>/dev/null; then
        echo "── Slow declarations (≥500ms) ──" >> "$TIMING_FILE"
        grep -iE 'took [0-9]+(\.[0-9]+)?(ms|s)|elaboration.*[0-9]+ms' "$log" 2>/dev/null \
            | sed 's/^[[:space:]]*//' \
            | sort -t' ' -k2 -rn \
            | head -30 \
            >> "$TIMING_FILE"
        echo "" >> "$TIMING_FILE"
    fi

    # Per-module wall-clock timing via lake's built-in output
    # Lake v4.24+ prints "  [X/Y] Building MODULE" — extract module names
    # and check for corresponding "  [X/Y] Compiling MODULE" with timestamps
    if grep -qE '^\[' "$log" 2>/dev/null; then
        echo "── Build steps (from lake) ──" >> "$TIMING_FILE"
        grep -E '^\[' "$log" \
            | grep -v '^$' \
            | tail -50 \
            >> "$TIMING_FILE" 2>/dev/null
        echo "" >> "$TIMING_FILE"
    fi

    # Summary: count errors and warnings
    local n_errors n_warnings
    n_errors=$(grep -c '^error:' "$log" 2>/dev/null || echo 0)
    n_warnings=$(grep -c '^warning:' "$log" 2>/dev/null || echo 0)
    echo "── Summary ──" >> "$TIMING_FILE"
    echo "  Errors:   $n_errors" >> "$TIMING_FILE"
    echo "  Warnings: $n_warnings" >> "$TIMING_FILE"

    # Total build time (from wrapper)
    if [ -n "${BUILD_START:-}" ]; then
        local elapsed=$(( $(date +%s) - BUILD_START ))
        local mins=$((elapsed / 60))
        local secs=$((elapsed % 60))
        echo "  Total:    ${mins}m ${secs}s" >> "$TIMING_FILE"
    fi
    echo "" >> "$TIMING_FILE"

    # Print report to stdout too
    cat "$TIMING_FILE"
}

# ── Pre-check: is lean even available? ────────────────────────────
if ! has lean; then
    write_status "unavailable" "Lean not installed. Use MCP tool: lean_setup" "check" 0
    exit 0
fi

if ! has lake; then
    write_status "unavailable" "Lake not installed. Use MCP tool: lean_setup" "check" 0
    exit 0
fi

if [ ! -d "$LEAN_DIR" ]; then
    write_status "unavailable" "content/quantum-observable-universe/lean/ not found" "check" 0
    exit 0
fi

# If `lean`/`lake` are elan shims but no toolchain is actually installed,
# every invocation will try to fetch from release.lean-lang.org. In
# restricted-egress sandboxes (e.g. host_not_allowed) this fails on every
# resume. Probe once and bail out cleanly instead of looping.
elan_toolchain_dir="${ELAN_HOME:-$HOME/.elan}/toolchains"
if [ ! -d "$elan_toolchain_dir" ] || [ -z "$(ls -A "$elan_toolchain_dir" 2>/dev/null)" ]; then
    if ! curl -sfI --max-time 5 https://release.lean-lang.org > /dev/null 2>&1; then
        write_status "unavailable" "No Lean toolchain installed and release.lean-lang.org unreachable (sandbox egress?)" "check" 0
        exit 0
    fi
fi

# The dir-emptiness check above only catches a *missing* toolchain. But
# `setup-lean-toolchain` can bootstrap an elan shim whose toolchains/ dir
# exists yet cannot resolve a usable toolchain — the dir is non-empty, so the
# guard is bypassed, and every following `lake` call tries to fetch from
# release.lean-lang.org. In restricted-egress sandboxes that fails with a
# "failed to parse release data" backtrace on *every* resume, flooding the
# transcript. Probe the toolchain functionally (bounded by `timeout` so a hung
# elan download can't stall the hook) and bail cleanly when it is broken and
# the release server is unreachable.
if ! timeout 15 lean --version >/dev/null 2>&1; then
    if ! curl -sfI --max-time 5 https://release.lean-lang.org > /dev/null 2>&1; then
        write_status "unavailable" "Lean toolchain present but unusable and release.lean-lang.org unreachable (sandbox egress?)" "check" 0
        exit 0
    fi
fi

cd "$LEAN_DIR"

# ── Step 0: local mathlib redirect (if configured) ──────────────
if mathlib_local_available; then
    mathlib_enable_local_redirect
fi

# ── Step 1: lake update (always run to ensure deps match lakefile) ─
write_status "updating" "Running lake update..." "update" 0
if lake update > "$LOG_DIR/qou-lake-update.log" 2>&1; then
    write_status "updating" "Dependencies updated" "update" 0
else
    # lake update can fail on optional deps (doc-gen4, etc.) — continue
    write_status "updating" "lake update had warnings (continuing)" "update" 0
fi

# ── Step 2: lake exe cache get (fetch Mathlib oleans) ──────────────
write_status "caching" "Fetching Mathlib cache..." "cache" 0
if lake exe cache get > "$LOG_DIR/qou-lake-cache.log" 2>&1; then
    write_status "caching" "Cache fetched" "cache" 0
else
    write_status "caching" "Cache fetch had issues (continuing)" "cache" 0
fi

# ── Step 3: lake build with retry + timing ───────────────────────
MAX_RETRIES=4
DELAYS=(10 30 90 270)
ATTEMPT=0

while [ $ATTEMPT -le $MAX_RETRIES ]; do
    ATTEMPT=$((ATTEMPT + 1))
    write_status "building" "Build attempt $ATTEMPT..." "build" $ATTEMPT

    BUILD_START=$(date +%s)
    export BUILD_START

    # Write build output to the log only (not `tee` to stdout): this hook runs
    # in the background and its stdout lands in the session transcript, so a
    # `tee` here is what actually floods it with elan/lake backtraces. The
    # timing report below reads the log file, so nothing is lost.
    if lake build > "$LOG_DIR/qou-lake-build.log" 2>&1; then
        print_timing_report "$LOG_DIR/qou-lake-build.log"
        write_status "ready" "Lean MCP ready (build succeeded)" "done" $ATTEMPT
        exit 0
    fi

    print_timing_report "$LOG_DIR/qou-lake-build.log"

    if [ $ATTEMPT -le $MAX_RETRIES ]; then
        DELAY=${DELAYS[$((ATTEMPT - 1))]}
        LAST_ERR=$(tail -1 "$LOG_DIR/qou-lake-build.log" 2>/dev/null | head -c 200)
        write_status "retrying" "Build failed: ${LAST_ERR}. Retrying in ${DELAY}s ($ATTEMPT/$MAX_RETRIES)" "build" $ATTEMPT
        sleep "$DELAY"
    fi
done

# All retries exhausted — report last error
LAST_ERR=$(grep "^error:" "$LOG_DIR/qou-lake-build.log" 2>/dev/null | tail -1 | head -c 200)
write_status "failed" "Build failed: ${LAST_ERR:-see /tmp/qou-lake-build.log}" "build" $ATTEMPT
exit 1
