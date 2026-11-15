"""Utilities for loading, saving, and merging proof-objects.json manifests."""

import json
from datetime import datetime, timezone
from pathlib import Path

from .config import DEFAULT_MANIFEST, LEAN_MERGE_KEYS
from .git_utils import get_commit_sha


def load_manifest(path=None):
    """Load proof-objects.json and return the parsed dict.

    Returns an empty manifest structure if the file does not exist.
    """
    path = Path(path) if path else DEFAULT_MANIFEST
    if not path.exists():
        return {
            "version": "1.0",
            "manuscript": {},
            "objects": [],
            "dependencies": [],
        }
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def save_manifest(manifest, path=None):
    """Write the manifest dict to proof-objects.json."""
    path = Path(path) if path else DEFAULT_MANIFEST
    with open(path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)


def update_manifest_timestamp(manifest):
    """Set the generated_at field to the current UTC time."""
    manuscript = manifest.setdefault("manuscript", {})
    manuscript["generated_at"] = datetime.now(timezone.utc).isoformat()
    manuscript["commit_sha"] = get_commit_sha()


def merge_with_existing(new_objects, existing_path):
    """Merge newly extracted objects with an existing proof-objects.json.

    Preserves review records and Lean linkage data for objects that still
    exist.  Removes objects whose labels are no longer in the LaTeX source.
    """
    existing_path = Path(existing_path)
    if not existing_path.exists():
        return new_objects

    with open(existing_path, encoding="utf-8") as f:
        existing = json.load(f)

    existing_by_label = {obj["label"]: obj for obj in existing.get("objects", [])}
    merged = []

    for new_obj in new_objects:
        label = new_obj["label"]
        if label in existing_by_label:
            old = existing_by_label[label]
            # Preserve reviews
            if "reviews" in old:
                new_obj["reviews"] = old["reviews"]
            # Preserve Lean linkage if not overridden by LaTeX macro
            if "lean" not in new_obj and "lean" in old:
                new_obj["lean"] = old["lean"]
                new_obj["formalization_status"] = old.get(
                    "formalization_status", "not_started"
                )
            elif "lean" in new_obj and "lean" in old:
                # Merge: keep fields from old that new doesn't have
                for key in LEAN_MERGE_KEYS:
                    if key in old["lean"] and key not in new_obj["lean"]:
                        new_obj["lean"][key] = old["lean"][key]
        merged.append(new_obj)

    return merged


def build_dependency_edges(objects):
    """Build dependency edge list from objects' uses fields."""
    dependencies = []
    for obj in objects:
        if "uses" in obj:
            for dep_label in obj["uses"]:
                dependencies.append(
                    {"from": obj["label"], "to": dep_label, "relation": "uses"}
                )
    return dependencies
