#!/usr/bin/env python3
"""Summarise one QA axis's failing criteria, reading `qa-sweep --json` on stdin.

Extracted from `.github/workflows/qa-sweep.yml`, where it lived as a
multi-line `python3 -c "…"` argument inside a YAML block scalar inside a shell
double-quoted string. Its lines sat at column 0, which is *less* than the block
scalar's base indentation, so YAML ended the scalar there and the workflow file
stopped parsing. GitHub cannot read the `on:` triggers of a file it cannot
parse, so it registered a startup failure against every push instead — a run
with zero jobs, named after the file path rather than the workflow's `name:`.

Three layers of quoting over indentation-significant code is not worth the
saving. A file has no base indentation to conflict with, runs outside CI, and
fails at the point of the mistake.
"""

import collections
import json
import sys


def main() -> int:
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError as exc:
        # The sweep is invoked with `2>/dev/null`, so a crash upstream arrives
        # here as empty stdin. Say which it was rather than dying on a
        # traceback that reads like a bug in this script.
        print(f"no parseable sweep JSON on stdin ({exc})", file=sys.stderr)
        return 1

    counts: collections.Counter = collections.Counter()
    for block in data.get("blocks", []):
        for detail in block.get("details", []):
            if "fail" in detail.get("outcome", ""):
                counts[detail["criterion"]] += 1

    print(f"criteria run: {len(data.get('want_criteria', []))}")
    if not counts:
        print("  (no failing criteria)")
    for criterion, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"  {n:4d} {criterion}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
