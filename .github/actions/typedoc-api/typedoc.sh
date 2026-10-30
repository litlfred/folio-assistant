#!/usr/bin/env bash
# fa#2739: the index has no tsconfig.json of its own, so TypeDoc found no
# tsconfig that includes the mounted cat-harness/schemas, reported "Unable to
# find any entry points" and wrote nothing. The `| tail` that followed hid the
# exit code, so the step went green and the site linked an api/ that was never
# published. Read the layer's own tsconfig, and fail when nothing is written.
# The schemas code lives in cat-harness-tools since bean 8lcl (2026-10-30).
set -euo pipefail
rev=()
[ -n "${REV:-}" ] && rev=(--gitRevision "$REV")
npx --yes typedoc@0.28.20 \
  --tsconfig cat-harness-tools/schemas/tsconfig.json \
  "${rev[@]}" \
  --out "$OUT" \
  --entryPointStrategy expand \
  --readme none \
  --hideGenerator \
  --skipErrorChecking \
  --logLevel Error \
  --name "$NAME" \
  cat-harness-tools/schemas
if [ ! -f "$OUT/index.html" ]; then
  echo "::error::TypeDoc wrote no $OUT/index.html"
  exit 1
fi
echo "TypeDoc: $(find "$OUT" -name '*.html' | wc -l) pages in $OUT"
