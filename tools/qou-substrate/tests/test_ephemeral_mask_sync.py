"""Cross-package sync check: `_EPHEMERAL_META_FIELDS` must be identical
in `qou_substrate.witness` (canonical) and
`qou_mass._internal.witness_base` (PyPI mirror).

The qou-mass package bundles a copy of `qou_substrate.witness` to keep
its PyPI wheel self-contained (no runtime dependency on qou-substrate).
The duplication is a known maintenance contract; this test prevents
silent drift between the two ephemeral-field sets.

If this test fails, sync the smaller set onto the larger one (or
re-derive both from a fresh design decision) and update both files
in the same PR.
"""

from __future__ import annotations

import sys
from pathlib import Path


def test_ephemeral_mask_sync():
    """`_EPHEMERAL_META_FIELDS` is identical across canonical + mirror."""
    # qou_substrate (canonical) — already on sys.path via package install
    from qou_substrate.witness import _EPHEMERAL_META_FIELDS as canonical

    # qou-mass mirror — add the bundled copy's path so we can import
    repo_root = Path(__file__).resolve().parents[3]
    mirror_path = repo_root / "qou-mass" / "src"
    if mirror_path.is_dir() and str(mirror_path) not in sys.path:
        sys.path.insert(0, str(mirror_path))
    from qou_mass._internal.witness_base import _EPHEMERAL_META_FIELDS as mirror

    assert canonical == mirror, (
        f"_EPHEMERAL_META_FIELDS drift detected between canonical and mirror.\n"
        f"  qou_substrate (canonical): {sorted(canonical)}\n"
        f"  qou_mass._internal (mirror): {sorted(mirror)}\n"
        f"  only-in-canonical: {sorted(canonical - mirror)}\n"
        f"  only-in-mirror:    {sorted(mirror - canonical)}\n"
        f"  Sync both files in the same PR."
    )


def test_ephemeral_mask_contains_required_fields():
    """The mask MUST include the runtime-metadata fields. Catches accidental
    removal that would re-introduce noisy diffs on Python-version swaps."""
    from qou_substrate.witness import _EPHEMERAL_META_FIELDS

    required = {
        "commitSha", "scriptCommitSha", "computedAt", "durationMs",
        "environment", "elapsed_seconds", "elapsed_sec",
    }
    missing = required - _EPHEMERAL_META_FIELDS
    assert not missing, (
        f"_EPHEMERAL_META_FIELDS is missing required runtime-metadata "
        f"fields: {sorted(missing)}. Removing these would cause witness "
        f"rewrites on environment / per-item-timing differences alone "
        f"(noisy diffs without substantive content change)."
    )
