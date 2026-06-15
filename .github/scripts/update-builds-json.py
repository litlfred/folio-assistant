#!/usr/bin/env python3
"""Update builds.json with the current feature branch build info.

Reads from environment variables (not string interpolation) to prevent injection.

Usage:
  python3 .github/scripts/update-builds-json.py

Required env vars:
  HEAD_REF, HEAD_SHA, FNAME_BASE, PAGES_URL, REPO_URL
"""

import json
import os
import sys
from datetime import datetime, timezone

# Read all values from env (safe — no shell interpolation)
head_ref = os.environ.get("HEAD_REF", "")
head_sha = os.environ.get("HEAD_SHA", "")
fname_base = os.environ.get("FNAME_BASE", "")
pages_url = os.environ.get("PAGES_URL", "")
repo_url = os.environ.get("REPO_URL", "")

if not head_ref:
    print("Error: HEAD_REF not set", file=sys.stderr)
    sys.exit(1)

# Read existing builds
try:
    with open("builds-existing.json") as f:
        builds = json.load(f)
except (FileNotFoundError, json.JSONDecodeError):
    builds = []

# Remove existing entry for this branch
builds = [b for b in builds if b.get("branch") != head_ref]

# Add new entry
draft_path = f"drafts/{head_ref}"
timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

builds.append({
    "branch": head_ref,
    "sha": head_sha,
    "timestamp": timestamp,
    "pdf_url": f"{pages_url}/{draft_path}/{fname_base}.pdf",
    "diff_pdf_url": f"{pages_url}/{draft_path}/{fname_base}-diff.pdf",
    "html_url": f"{pages_url}/{draft_path}/",
    "source_url": f"{repo_url}/tree/{head_ref}",
})

# Sort by timestamp, keep most recent 20
builds.sort(key=lambda b: b.get("timestamp", ""), reverse=True)
builds = builds[:20]

with open("builds-existing.json", "w") as f:
    json.dump(builds, f, indent=2)

print(f"Updated builds.json with entry for {head_ref}")
