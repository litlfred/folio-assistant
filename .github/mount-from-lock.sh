#!/usr/bin/env bash
# Lay down every remote mount `index.lock.json` records, on a checkout that has
# none of them yet.
#
# The replayer is `cat-harness/scripts/mount-from-lock.ts`, and cat-harness is
# itself one of the mounts — so on a fresh clone the tool that would mount it
# is not on disk. This breaks that loop the smallest way: read the commit the
# lock pins for cat-harness, fetch ONLY that one file at that commit, and run
# it. The script imports nothing but `node:*` (see its header), so one file is
# all it needs; every decision — instances, commits, directories, digests — is
# still the lock's, and the script still verifies each tree digest.
#
# CI calls this before anything else in a job, and so does the session-start
# hook. It is idempotent: a mount already on disk and intact is reported
# `current`. Extra arguments go to the replayer (e.g. `--check`).
#
# Usage: .github/mount-from-lock.sh [--root <dir>] [replayer args…]
set -euo pipefail

root="."
if [ "${1:-}" = "--root" ]; then root="$2"; shift 2; fi
lock="$root/index.lock.json"
# No lock at the target is not an error: a folio that remote-mounts nothing
# has none, and the replayer (fetched below from the platform's own lock)
# reports it `not-enabled` and exits 0. Exiting here instead failed every such
# folio's staging at "Mount the folio's own layers" (smart-ra#32).

# The replayer comes from the cat-harness the TARGET's lock pins; a folio
# whose lock does not mount cat-harness (it is replayed by a platform checked
# out beside it) uses the pin of the platform checkout this script sits in.
own_lock="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/index.lock.json"
read -r repo sha < <(bun -e '
  const fs = require("node:fs");
  for (const f of process.argv.slice(1)) {
    if (!fs.existsSync(f)) continue;
    const l = JSON.parse(fs.readFileSync(f, "utf-8"));
    const i = (l.instances ?? []).find((x) => x.instance === "cat-harness");
    if (i) { console.log(i.repository, i.sha); process.exit(0); }
  }
  console.error("mount-from-lock: no lock pins a cat-harness instance: " + process.argv.slice(1).join(", "));
  process.exit(2);
' "$lock" "$own_lock")

prefix="${CAT_MOUNT_URL_PREFIX:-https://github.com}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
git -C "$work" init -q
# --filter=blob:none fetches the commit's trees but no file bodies; the
# checkout below then fetches the one blob it needs.
git -C "$work" fetch -q --depth 1 --filter=blob:none "${prefix%/}/${repo}.git" "$sha"
git -C "$work" checkout -q FETCH_HEAD -- scripts/mount-from-lock.ts

status=0
bun "$work/scripts/mount-from-lock.ts" --root "$root" "$@" || status=$?
exit "$status"
