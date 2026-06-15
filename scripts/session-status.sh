#!/usr/bin/env bash
# Session-start hook: consolidated "functionalities enabled" status check.
#
# Consolidated session status dashboard. Uses scripts/lib/lean-env.sh for
# human-readable dashboard plus machine-readable JSON.
#
# Output format: JSON with { status: {...}, summary: "..." }
# The summary field is a formatted status table for display.

set -uo pipefail

# Shared Lean env helpers (sets REPO_ROOT, LEAN_DIR, PATH, has())
source "$(dirname "$0")/lib/lean-env.sh"
CONFIG="$REPO_ROOT/lean-mcp.config.json"

# Fresh sandbox containers run as root while the checkout may be owned
# by another uid; git then refuses every command with "dubious
# ownership" and witness builders silently serialise
# scriptCommitSha="unknown" (2026-06-13 diagnosis — environmental, not
# a WitnessBuilder path bug). Mark the repo safe once per session;
# idempotent, no-op when already configured.
git config --global --get-all safe.directory 2>/dev/null | grep -Fqx "$REPO_ROOT" \
  || git config --global --add safe.directory "$REPO_ROOT" 2>/dev/null || true

# ── 1. Core tools ───────────────────────────────────────────────
BUN_OK=false;    BUN_VER=""
NODE_OK=false;   NODE_VER=""
UV_OK=false;     UV_VER=""
RG_OK=false;     RG_VER=""
GIT_OK=false;    GIT_VER=""

if has bun; then BUN_OK=true; BUN_VER=$(bun --version 2>/dev/null); fi
if has node; then NODE_OK=true; NODE_VER=$(node --version 2>/dev/null); fi
if has uv; then UV_OK=true; UV_VER=$(uv --version 2>/dev/null | head -1); fi
if has rg; then RG_OK=true; RG_VER=$(rg --version 2>/dev/null | head -1); fi
if has git; then GIT_OK=true; GIT_VER=$(git --version 2>/dev/null); fi

# ── 1b. Rust / Hecke engine ──────────────────────────────────
CARGO_OK=false;  CARGO_VER=""
HECKE_OK=false;  HECKE_VER=""

if has cargo; then
  CARGO_OK=true; CARGO_VER=$(cargo --version 2>/dev/null)
elif [ -f "$HOME/.cargo/env" ]; then
  source "$HOME/.cargo/env"
  if has cargo; then CARGO_OK=true; CARGO_VER=$(cargo --version 2>/dev/null); fi
fi

HECKE_DIR="$REPO_ROOT/tools/hecke-engine"
HECKE_BIN="$HECKE_DIR/target/release/hecke-engine"
HECKE_VER_FILE="$HECKE_DIR/Cargo.toml"
if [ -f "$HECKE_BIN" ]; then
  HECKE_OK=true
  HECKE_VER=$(grep '^version' "$HECKE_VER_FILE" 2>/dev/null | head -1 | sed 's/.*"\(.*\)"/\1/')
elif [ "$CARGO_OK" = true ] && [ -f "$HECKE_DIR/Cargo.toml" ]; then
  (cd "$HECKE_DIR" && cargo build --release 2>/dev/null) && {
    HECKE_OK=true
    HECKE_VER=$(grep '^version' "$HECKE_VER_FILE" 2>/dev/null | head -1 | sed 's/.*"\(.*\)"/\1/')
  }
fi

# ── 2. PDF generation ──────────────────────────────────────────
PDFLATEX_OK=false
LATEXMK_OK=false
DVISVGM_OK=false
PANDOC_OK=false
PDF_STATUS="disabled"
PDF_FIX=""

if has pdflatex; then PDFLATEX_OK=true; fi
if has latexmk; then LATEXMK_OK=true; fi
if has dvisvgm; then DVISVGM_OK=true; fi
if has pandoc; then PANDOC_OK=true; fi

if [ "$PDFLATEX_OK" = true ] && [ "$LATEXMK_OK" = true ]; then
    PDF_STATUS="enabled"
elif [ "$PDFLATEX_OK" = true ]; then
    PDF_STATUS="partial"
    PDF_FIX="Install latexmk: sudo apt install latexmk"
else
    PDF_FIX="Install TeX Live: sudo apt install texlive-latex-base texlive-latex-extra texlive-fonts-recommended latexmk"
fi

# ── 3. Content pipeline ────────────────────────────────────────
PIPELINE_OK=false
PIPELINE_FIX=""
if [ "$BUN_OK" = true ] && [ -f "$REPO_ROOT/content/pipeline/validate.ts" ]; then
    PIPELINE_OK=true
else
    PIPELINE_FIX="Install bun: curl -fsSL https://bun.sh/install | bash"
fi

# ── 4. Lean / MCP (uses shared lean_detect from lib/lean-env.sh) ──
lean_detect
LEAN_FIX=$(lean_fix_hint)

REMOTE_DOMAIN=""
if [ -f "$CONFIG" ]; then
    REMOTE_DOMAIN=$(python3 -c "import json; print(json.load(open('$CONFIG')).get('domain',''))" 2>/dev/null || true)
fi
REMOTE_URL=""
[ -n "$REMOTE_DOMAIN" ] && REMOTE_URL="https://$REMOTE_DOMAIN/mcp"

# ── 5. MCP paper-assistant ─────────────────────────────────────
ASSISTANT_OK=false
source "$REPO_ROOT/scripts/folio-port.sh"
ASSISTANT_PORT="$FOLIO_PORT"
if curl -sf --max-time 2 "http://localhost:${ASSISTANT_PORT}/health" &>/dev/null; then
    ASSISTANT_OK=true
fi

# ── 5b. Lean build status (from background builder) ──────────────
LEAN_BUILD_STATUS="unknown"
LEAN_BUILD_MSG=""
BUILD_STATUS_FILE="/tmp/qou-lean-build-status.json"
if [ -f "$BUILD_STATUS_FILE" ]; then
    LEAN_BUILD_STATUS=$(python3 -c "import json; print(json.load(open('$BUILD_STATUS_FILE')).get('status','unknown'))" 2>/dev/null || echo "unknown")
    LEAN_BUILD_MSG=$(python3 -c "import json; print(json.load(open('$BUILD_STATUS_FILE')).get('message',''))" 2>/dev/null || echo "")
fi

# ── 6. TODOs ────────────────────────────────────────────────────
TODO_COUNT=0
TODO_SUMMARY="No open todos."
if [ -d "$REPO_ROOT/todos" ]; then
    TODO_OUTPUT=$("$REPO_ROOT/scripts/check-todos.sh" 2>/dev/null || echo '{}')
    TODO_COUNT=$(echo "$TODO_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('count',0))" 2>/dev/null || echo 0)
    TODO_SUMMARY=$(echo "$TODO_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('summary','No open todos.'))" 2>/dev/null || echo "No open todos.")
fi

# ── 7. TeX block rendering (SVG preview) ───────────────────────
TEX_RENDER_OK=false
if [ "$PDFLATEX_OK" = true ] && [ "$DVISVGM_OK" = true ]; then
    TEX_RENDER_OK=true
fi

# ── Build summary ──────────────────────────────────────────────
ok() { [ "$1" = true ] && echo "✓" || echo "✗"; }

SUMMARY=$(cat <<EOSUMMARY
╔══════════════════════════════════════════════════════╗
║           QOU Session — Functionalities              ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  $(ok $PIPELINE_OK) Content pipeline    (validate/build/render)     ║
║  $(ok $PDFLATEX_OK) PDF generation      (pdflatex + latexmk)       ║
║  $(ok $TEX_RENDER_OK) TeX block preview   (pdflatex + dvisvgm → SVG)  ║
║  $(ok $PANDOC_OK) HTML export        (pandoc)                    ║
║  $(ok $LEAN_OK) Lean toolchain    (lean + lake)                ║
║  $(ok $([ "$LEAN_BUILD_STATUS" = "ready" ] && echo true || echo false)) Lean build        ($LEAN_BUILD_STATUS)                  ║
║  $(ok $LEAN_REMOTE_OK) Lean remote MCP    ($REMOTE_URL)  ║
║  $(ok $ASSISTANT_OK) Paper assistant     (localhost:$ASSISTANT_PORT)           ║
║  $(ok $CARGO_OK) $(printf '%-50s' "Rust/Cargo        ($CARGO_VER)")║
║  $(ok $HECKE_OK) $(printf '%-50s' "Hecke engine      ($HECKE_VER)")║
║  $(ok $RG_OK) Symbol search      (ripgrep)                   ║
║                                                      ║
╠══════════════════════════════════════════════════════╣
║  Lean mode: $(printf '%-42s' "$LEAN_MODE")║
║  TODOs: $(printf '%-46s' "$TODO_SUMMARY")║
╠══════════════════════════════════════════════════════╣
║  Precision: $(printf '%-42s' "L1 ≤ 1 ppb (50 dps default)")║
║             $(printf '%-42s' "L2 ≤ σ_exp/100 (see docs/precision-goals.md)")║
╚══════════════════════════════════════════════════════╝
EOSUMMARY
)

# ── Collect fixes ──────────────────────────────────────────────
FIXES=""
[ "$PIPELINE_OK" = false ] && FIXES="$FIXES\n  → Content pipeline: $PIPELINE_FIX"
[ "$PDF_STATUS" != "enabled" ] && [ -n "$PDF_FIX" ] && FIXES="$FIXES\n  → PDF generation: $PDF_FIX"
[ "$PANDOC_OK" = false ] && FIXES="$FIXES\n  → HTML export: sudo apt install pandoc"
[ "$LEAN_MODE" = "none" ] || [ "$LEAN_MODE" = "local-degraded" ] && [ -n "$LEAN_FIX" ] && FIXES="$FIXES\n  → Lean: $LEAN_FIX"
[ "$DVISVGM_OK" = false ] && [ "$PDFLATEX_OK" = true ] && FIXES="$FIXES\n  → TeX preview: sudo apt install dvisvgm"
[ "$ASSISTANT_OK" = false ] && FIXES="$FIXES\n  → Paper assistant: ./scripts/start-folio-assistant.sh --http"
[ "$CARGO_OK" = false ] && FIXES="$FIXES\n  → Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && source ~/.cargo/env"
[ "$HECKE_OK" = false ] && [ "$CARGO_OK" = true ] && FIXES="$FIXES\n  → Hecke engine: cd tools/hecke-engine && cargo build --release --bin v2"

if [ -n "$FIXES" ]; then
    SUMMARY="$SUMMARY

To enable missing features:$FIXES"
fi

# ── JSON output ────────────────────────────────────────────────
# Escape the summary for JSON
SUMMARY_ESCAPED=$(echo "$SUMMARY" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null || echo '""')

cat <<EOF
{
  "status": {
    "content_pipeline": $PIPELINE_OK,
    "pdf_generation": $([ "$PDF_STATUS" = "enabled" ] && echo true || echo false),
    "pdf_status": "$PDF_STATUS",
    "tex_block_preview": $TEX_RENDER_OK,
    "html_export": $PANDOC_OK,
    "lean_available": $LEAN_OK,
    "lean_mode": "$LEAN_MODE",
    "lean_version": "$LEAN_VER",
    "lean_local_ready": $LEAN_LOCAL_READY,
    "lean_remote_ok": $LEAN_REMOTE_OK,
    "lean_remote_url": "$REMOTE_URL",
    "lean_build_status": "$LEAN_BUILD_STATUS",
    "lean_build_message": "$LEAN_BUILD_MSG",
    "paper_assistant": $ASSISTANT_OK,
    "ripgrep": $RG_OK,
    "bun": $BUN_OK,
    "uv": $UV_OK,
    "node": $NODE_OK,
    "todo_count": $TODO_COUNT
  },
  "summary": $SUMMARY_ESCAPED
}
EOF
exit 0
