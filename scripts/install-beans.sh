#!/usr/bin/env bash
# Install the `beans` issue-tracker CLI (https://github.com/hmans/beans).
#
# `beans` is the session work-plan + cross-agent coordination tracker used by
# this repo (data lives in `.beans/`, see `.claude/skills/local/todo-manager.md`).
# It is a Go binary distributed via GitHub releases; fresh cloud sandboxes do
# NOT ship it, so this script reinstalls it on demand.
#
# Usage:
#   scripts/install-beans.sh            # install if missing
#   scripts/install-beans.sh --force    # reinstall even if present
#   BEANS_VERSION=v0.x.y scripts/install-beans.sh   # pin a release tag
#
# Primary method: `go install` (Go >= 1.21 required; the sandbox ships Go).
# The GitHub releases API is often firewalled in sandboxes, so we prefer the
# module proxy (proxy.golang.org) that `go install` uses.
set -euo pipefail

FORCE="${1:-}"
BEANS_VERSION="${BEANS_VERSION:-latest}"

if command -v beans >/dev/null 2>&1 && [ "$FORCE" != "--force" ] && [ "$BEANS_VERSION" = "latest" ]; then
  echo "beans already installed: $(command -v beans)"
  beans version 2>/dev/null || true
  echo "(use --force to reinstall)"
  exit 0
fi

if ! command -v go >/dev/null 2>&1; then
  echo "ERROR: 'go' not found on PATH." >&2
  echo "Install Go >= 1.21, or download a prebuilt binary from" >&2
  echo "  https://github.com/hmans/beans/releases" >&2
  echo "and place it on your PATH." >&2
  exit 1
fi

# Pick a bin dir that is on PATH *and* writable (fall back to ~/.local/bin).
# Writability matters: /usr/local/bin is commonly on PATH but not writable for
# a non-root sandbox user, which would make `go install` fail.
GOBIN_DIR=""
for d in "$HOME/.local/bin" "$(go env GOPATH 2>/dev/null)/bin" "/usr/local/bin"; do
  case ":$PATH:" in
    *":$d:"*)
      if [ -w "$d" ] || { [ ! -d "$d" ] && [ -w "$(dirname "$d")" ]; }; then
        GOBIN_DIR="$d"; break
      fi
      ;;
  esac
done
: "${GOBIN_DIR:=$HOME/.local/bin}"
mkdir -p "$GOBIN_DIR"

echo "Installing beans@${BEANS_VERSION} into ${GOBIN_DIR} via 'go install'..."
GOBIN="$GOBIN_DIR" go install "github.com/hmans/beans@${BEANS_VERSION}"

case ":$PATH:" in
  *":$GOBIN_DIR:"*) ;;
  *) echo "NOTE: add '$GOBIN_DIR' to your PATH:  export PATH=\"$GOBIN_DIR:\$PATH\"" >&2 ;;
esac

echo "Installed: $("$GOBIN_DIR/beans" version 2>/dev/null | head -1)"
echo "Verify with:  beans list  &&  beans check"
