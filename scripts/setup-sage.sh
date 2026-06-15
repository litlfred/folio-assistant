#!/bin/bash
# Setup SageMath for QOU witness computations.
#
# Copy-paste from repo root:
#
#   ./scripts/setup-sage.sh
#
# Then run all witness computations:
#
#   ./scripts/run-sage-witnesses.sh
#
# NOTE: SageMath requires Python <= 3.12. If your system Python is 3.13+,
# this script creates a dedicated conda environment with Python 3.12.

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_NAME="qou-sage"

echo "═══════════════════════════════════════════════════════════"
echo "SageMath setup for QOU witness computations"
echo "═══════════════════════════════════════════════════════════"
echo

# ── Check if sage is already available ───────────────────────────
if command -v sage &>/dev/null; then
    echo "✓ SageMath already installed:"
    sage --version 2>&1 | head -1
    echo
    echo "Ready. Run:"
    echo "  ./scripts/run-sage-witnesses.sh"
    exit 0
fi

# ── Check if the conda env already exists ────────────────────────
if command -v conda &>/dev/null; then
    if conda env list 2>/dev/null | grep -q "$ENV_NAME"; then
        echo "✓ Conda environment '$ENV_NAME' exists."
        echo
        echo "Activate it and run:"
        echo "  conda activate $ENV_NAME && ./scripts/run-sage-witnesses.sh"
        exit 0
    fi
fi

# ── Install via conda/mamba with Python 3.12 ────────────────────
install_conda_env() {
    local mgr="$1"
    echo "▸ Creating conda environment '$ENV_NAME' with Python 3.12 + Sage..."
    echo "  (This takes 5-15 minutes on first install)"
    echo
    $mgr create -y -n "$ENV_NAME" -c conda-forge python=3.12 sage
    echo
    echo "✓ Sage installed in conda environment '$ENV_NAME'"
    echo
    echo "To run the witness computations, copy-paste:"
    echo
    echo "  conda activate $ENV_NAME && ./scripts/run-sage-witnesses.sh"
    echo
    exit 0
}

if command -v mamba &>/dev/null; then
    install_conda_env mamba
fi

if command -v conda &>/dev/null; then
    install_conda_env conda
fi

# ── No conda — try system package managers ───────────────────────

# macOS: Homebrew
if [[ "$(uname)" == "Darwin" ]] && command -v brew &>/dev/null; then
    echo "▸ Installing SageMath via Homebrew..."
    brew install --cask sage
    echo
    echo "✓ Done. Run:"
    echo "  ./scripts/run-sage-witnesses.sh"
    exit 0
fi

# Linux: apt (Debian/Ubuntu)
if command -v apt &>/dev/null; then
    echo "▸ Installing SageMath via apt..."
    sudo apt update && sudo apt install -y sagemath
    echo
    echo "✓ Done. Run:"
    echo "  ./scripts/run-sage-witnesses.sh"
    exit 0
fi

# ── Nothing found — give copy-paste instructions ────────────────
echo "✗ No package manager found that can install SageMath."
echo
echo "Option 1: Install miniforge (lightweight conda), then re-run:"
echo
echo "  curl -L -O https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-\$(uname)-\$(uname -m).sh"
echo "  bash Miniforge3-\$(uname)-\$(uname -m).sh"
echo "  # restart shell, then:"
echo "  ./scripts/setup-sage.sh"
echo
echo "Option 2: Docker (no install needed):"
echo
echo "  docker run -v \$(pwd):/qou -w /qou sagemath/sagemath:latest ./scripts/run-sage-witnesses.sh"
echo
exit 1
