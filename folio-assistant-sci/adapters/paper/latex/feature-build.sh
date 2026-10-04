#!/usr/bin/env bash
#
# feature-build.sh — QUICK draft build of a PAPER folio for branch iteration.
#
# Builds ONLY the changed chapters (not the full paper) and emits a latexdiff
# of each vs a base ref, in colored and plain form. Run it from the FOLIO
# (the content repository), not from the platform.
#
# The preamble is the paper print template beside this script
# (`paper-preamble.tex`), with the folio's own notation fragment appended when
# it has one. It is INLINED, not precompiled into a format: mylatexformat
# gobbles everything between %&fmt and \begin{document}, which silently drops
# the per-paper manifest macros. The speedup comes from compiling FEWER
# chapters, plus FAST_PREVIEW (margin notes off, ~2x). See the sci skill
# `latex-build-cache` for the measurements and the caches that do not work.
#
# Numbers are the pipeline-fixed values; cross-refs to chapters not in this
# build resolve to '??'. A preview, NOT a publish build.
#
# Moved here from cat-harness/scripts/ on 2026-10-04 (issue #2117): it is
# paper-only, and the template it needs lives in this adapter. Before the move
# it read `latex/preamble.tex`, deleted in 34a70659c7, and the old
# `content/` layout, so it could not run in any checkout.
#
# Usage (from the folio root):
#   folio-assistant/folio-assistant-sci/adapters/paper/latex/feature-build.sh \
#     [--base <ref>] [--chapters s1,s2] [--paper <slug>] [--out <dir>] [--notation <file>]
#   --base      diff against this ref              (default: origin/main)
#   --chapters  explicit chapter slugs, csv        (default: changed vs --base)
#   --paper     paper slug                         (default: the folio's only paper)
#   --out       output dir, keep it gitignored     (default: build-feature)
#   --notation  folio notation fragment to append  (default: <paper dir>/latex/notation-preamble.tex if present)
#   --preload   bun preload that configures the platform's injected registries
#               (value registry, Lean packages)      (default: scripts/preload-registry.ts if present)
#
# The platform pipeline is dependency-injected: `build.ts` throws "Value registry
# not configured" unless the folio's preload has run. The preload must import
# the SAME platform checkout this script lives in (normally the folio's
# `folio-assistant/` link), or it configures a different module instance.
#
# Requires bun, and for steps 2-3 a TeX engine (install-tex.sh beside this file).
#
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"; cd "$ROOT"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLATFORM="$(cd "$HERE/../../../.." && pwd)"
TEMPLATE="$HERE/paper-preamble.tex"
PAPER=""; BASE="origin/main"; CHAPTERS=""; OUT="build-feature"; NOTATION=""; PRELOAD=""
while [ $# -gt 0 ]; do case "$1" in
  --base) BASE="${2:-}"; shift 2;;
  --chapters) CHAPTERS="${2:-}"; shift 2;;
  --paper) PAPER="${2:-}"; shift 2;;
  --out) OUT="${2:-}"; shift 2;;
  --notation) NOTATION="${2:-}"; shift 2;;
  --preload) PRELOAD="${2:-}"; shift 2;;
  *) echo "feature-build: unknown arg: $1" >&2; exit 2;;
esac; done

# The folio's content directory and paper come from its own declaration, never
# a hardcoded name: the same answer build.ts gives when run from the folio.
read -r FOLIODIR PAPER < <(PAPER_ARG="$PAPER" bun -e '
  const { folioDir } = await import(process.argv[1] + "/cat-harness/schemas/cat-harness.ts");
  const { requirePaper } = await import(process.argv[1] + "/cat-harness/content/pipeline/repo-root.ts");
  const root = process.cwd();
  let paper;
  try { paper = requirePaper(process.env.PAPER_ARG || undefined, root); }
  catch (e) { console.error("feature-build: " + e.message + " (use --paper <slug>)"); process.exit(2); }
  console.log(require("node:path").relative(root, folioDir(root)) + " " + paper);
' "$PLATFORM") || exit 2
PAPERDIR="$FOLIODIR/$PAPER"
[ -z "$NOTATION" ] && [ -f "$PAPERDIR/latex/notation-preamble.tex" ] && NOTATION="$PAPERDIR/latex/notation-preamble.tex"
[ -z "$PRELOAD" ] && [ -f scripts/preload-registry.ts ] && PRELOAD="scripts/preload-registry.ts"
PRELOAD_ARGS=(); [ -n "$PRELOAD" ] && PRELOAD_ARGS=(--preload "$ROOT/$PRELOAD")

# Preview tool → drop the per-block margin annotations by default (~2x faster
# compile: 19.5s → 9.1s, measured on a real engine). generate-main-tex.ts reads
# this; published builds leave it unset. FAST_PREVIEW=0 keeps the margin icons;
# QOU_FAST_PREVIEW is the old name and is still honoured.
export FAST_PREVIEW="${FAST_PREVIEW:-${QOU_FAST_PREVIEW:-1}}"

mkdir -p "$OUT"
PREAMBLE="$OUT/preamble-source.tex"
cat "$TEMPLATE" > "$PREAMBLE"
if [ -n "$NOTATION" ]; then
  echo "feature-build: notation fragment → $NOTATION"
  printf '\n%% ── Folio notation fragment (%s) ──\n' "$NOTATION" >> "$PREAMBLE"
  cat "$NOTATION" >> "$PREAMBLE"
fi

echo "feature-build: [1/3] render chapters + inline main.tex (paper: $PAPER)…"
bun run "${PRELOAD_ARGS[@]}" "$PLATFORM/cat-harness/content/pipeline/build.ts" "$PAPERDIR/$PAPER.ts" \
    --out-dir chapters/ --generate-main --main-out main.tex \
    --preamble "$PREAMBLE" >"$OUT/build.log" 2>&1 \
  || echo "feature-build: (content build reported issues — continuing; see $OUT/build.log)"

if [ -z "$CHAPTERS" ]; then
  CHAPTERS="$(git diff --name-only "$BASE"...HEAD -- "$PAPERDIR/" 2>/dev/null \
    | sed -nE "s#^$PAPERDIR/([^/]+)/.*#\1#p" | sort -u | paste -sd, -)"
fi
[ -z "$CHAPTERS" ] && { echo "feature-build: no changed chapters vs $BASE — nothing to build."; exit 0; }
echo "feature-build: changed chapters → $CHAPTERS"

mkdir -p "$OUT"  # (also created above)
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
