"""Git helper utilities."""

import subprocess
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent


def get_commit_sha(repo_root=None):
    """Return the current HEAD commit SHA, or 'unknown' on failure."""
    root = repo_root or _REPO_ROOT
    try:
        return (
            subprocess.check_output(
                ["git", "rev-parse", "HEAD"], cwd=root, stderr=subprocess.DEVNULL
            )
            .decode()
            .strip()
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return "unknown"
