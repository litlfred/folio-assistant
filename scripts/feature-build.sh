#!/usr/bin/env bash
#
# feature-build.sh — QUICK draft build for branch/feature iteration.
#
# Builds ONLY the changed chapters (not the full paper) and emits a latexdiff
# of each vs a base ref in colored + plain form.
#
# Uses the INLINE preamble (extracted from the generated main.tex), NOT the
# precompiled %&qou format: mylatexformat gobbles everything between %&fmt and
# \begin{document}, which silently drops the per-paper manifest macros (\ordw,
# …) AND the memoize \usepackage. Inlining keeps both. (See the gobbling note
# in .claude/skills/local/latex-build-cache.md.) The speedup here is from
# compiling FEWER chapters, not from a precompiled format.
#
# Numbers are the pipeline-fixed values (correct); cross-refs to chapters not
# in this build resolve to '??' — acceptable for a preview. NOT a publish build.
#
# Usage:
#   scripts/feature-build.sh [--base <ref>] [--chapters s1,s2] [--paper <dir>] [--out <dir>]
#     --base      diff against this ref       (default: origin/main)
#     --chapters  explicit chapter slugs, csv (default: auto from git diff)
#     --paper     paper dir under content/    (default: quantum-observable-universe)
#     --out       output dir (gitignored)     (default: build-feature)
#
# Requires a TeX engine (run scripts/install-tex.sh first if absent) + bun.
#
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"
PAPER="quantum-observable-universe"; BASE="origin/main"; CHAPTERS=""; OUT="build-feature"
while [ $# -gt 0 ]; do case "$1" in
  --base) BASE="${2:-}"; shift 2;;
  --chapters) CHAPTERS="${2:-}"; shift 2;;
  --paper) PAPER="${2:-}"; shift 2;;
  --out) OUT="${2:-}"; shift 2;;
  *) echo "feature-build: unknown arg: $1" >&2; exit 2;;
esac; done
PAPERDIR="content/$PAPER"

# Preview tool → drop the ~2944 per-block margin annotations by default
# (~2x faster compile: 19.5s → 9.1s, measured on a real engine). The
# no-op rides in the inline preamble we extract below, so both the
# changed-chapters PDF and the latexdiffs get it. QOU_FAST_PREVIEW=0 keeps
# the margin icons. (generate-main-tex.ts reads this; published builds
# leave it unset.)
export QOU_FAST_PREVIEW="${QOU_FAST_PREVIEW:-1}"

echo "feature-build: [1/3] render chapters + inline main.tex (cheap)…"
( cd content && bun run pipeline/build.ts "$PAPER/$PAPER.ts" \
    --out-dir ../chapters/ --generate-main --main-out ../main.tex \
    --preamble ../latex/preamble.tex >/dev/null 2>&1 ) \
  || echo "feature-build: (content build reported issues — continuing)"

if [ -z "$CHAPTERS" ]; then
  CHAPTERS="$(git diff --name-only "$BASE"...HEAD -- "$PAPERDIR/" 2>/dev/null \
    | sed -nE "s#^$PAPERDIR/([^/]+)/.*#\1#p" | sort -u | paste -sd, -)"
fi
[ -z "$CHAPTERS" ] && { echo "feature-build: no changed chapters vs $BASE — nothing to build."; exit 0; }
echo "feature-build: changed chapters → $CHAPTERS"

mkdir -p "$OUT"
# Inline preamble = everything in main.tex before \begin{document} (carries the
# manifest macros + memoize \usepackage that %&qou would gobble).
if [ -f main.tex ]; then
  awk '/\\begin\{document\}/{exit} {print}' main.tex > "$OUT/preamble-inline.tex"
else
  echo "feature-build: main.tex missing, falling back to empty preamble"
  touch "$OUT/preamble-inline.tex"
fi
# latexdiff markup defs (UNDERLINE type) so \DIFadd/\DIFdel resolve when we wrap
# a diffed chapter BODY (latexdiff only emits these into a full-document preamble).
cat "$OUT/preamble-inline.tex" > "$OUT/preamble-diff.tex"
cat >> "$OUT/preamble-diff.tex" <<'DIFPRE'
\providecommand{\DIFaddbegin}{}\providecommand{\DIFaddend}{}
\providecommand{\DIFdelbegin}{}\providecommand{\DIFdelend}{}
\providecommand{\DIFadd}[1]{{\protect\color{blue}\uwave{#1}}}
\providecommand{\DIFdel}[1]{{\protect\color{red}\sout{#1}}}
\providecommand{\DIFaddbeginFL}{}\providecommand{\DIFaddendFL}{}
\providecommand{\DIFdelbeginFL}{}\providecommand{\DIFdelendFL}{}
\providecommand{\DIFaddFL}[1]{\DIFadd{#1}}\providecommand{\DIFdelFL}[1]{\DIFdel{#1}}
DIFPRE
IFS=',' read -ra CHS <<< "$CHAPTERS"

echo "feature-build: [2/3] quick changed-chapters PDF…"
{ cat "$OUT/preamble-inline.tex"; echo '\begin{document}'
  for c in "${CHS[@]}"; do [ -f "chapters/$c.tex" ] && echo "\\input{$ROOT/chapters/$c}"; done
  echo '\end{document}'; } > "$OUT/changed.tex"
latexmk -pdf -shell-escape -f -interaction=nonstopmode -outdir="$OUT" "$OUT/changed.tex" >"$OUT/changed.log" 2>&1 || true
[ -f "$OUT/changed.pdf" ] && echo "  → $OUT/changed.pdf" || echo "  ! changed.pdf not produced (see $OUT/changed.log)"

echo "feature-build: [3/3] per-chapter latexdiff (colored + plain)…"
command -v latexdiff >/dev/null 2>&1 || { echo "  (latexdiff not installed — skipping diffs)"; exit 0; }
for c in "${CHS[@]}"; do
  [ -f "chapters/$c.tex" ] || continue
  # chapters/ is gitignored; if a committed base .tex isn't available the diff
  # degrades to "all content added" — acceptable for a preview.
  if git show "$BASE:chapters/$c.tex" > "$OUT/$c.base.tex" 2>/dev/null; then :; else
    echo "  $c: no committed base .tex — diff = full content"; printf '' > "$OUT/$c.base.tex"
  fi
  latexdiff "$OUT/$c.base.tex" "chapters/$c.tex" > "$OUT/$c.body-color.tex" 2>/dev/null || true
  sed -E 's/\\color\{[a-zA-Z]+\}//g' "$OUT/$c.body-color.tex" > "$OUT/$c.body-plain.tex" || true
  for v in color plain; do
    { cat "$OUT/preamble-diff.tex"; echo '\begin{document}'
      echo "\\input{$ROOT/$OUT/$c.body-$v}"; echo '\end{document}'; } > "$OUT/$c.diff-$v.tex"
    latexmk -pdf -shell-escape -f -interaction=nonstopmode -outdir="$OUT" "$OUT/$c.diff-$v.tex" >/dev/null 2>&1 || true
  done
  echo "  $c → $OUT/$c.diff-color.pdf , $OUT/$c.diff-plain.pdf"
done
echo "feature-build: done. (preview only — not a publish build)"
