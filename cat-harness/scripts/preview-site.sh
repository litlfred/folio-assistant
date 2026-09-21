#!/usr/bin/env bash
# Build the docs site locally, so a page can be looked at rather than described.
#
# WHY THIS EXISTS
#
# `continual-progress` argues that a human cannot assess a rendered artefact
# from a description of it. The same holds for the agent that wrote it, and it
# was measured here on 2026-09-21: `gen-handler-index.ts` emitted raw
# `<h3><code>kind</code></h3>` blocks, kramdown passed them through without
# assigning heading ids, and the just-the-docs anchor-heading include fell back
# to the page's own id — so all 22 kind headings rendered `href="#published-
# graphs"`, one anchor for every section, with `aria-labelledby` naming a
# heading that is not the one being labelled. Bean `gjli` is the standing
# accessibility rule.
#
# The generator's own output looked correct. `bun run gates --all` was green
# across the whole defect. Only a build showed it.
#
# THE TWO THINGS THAT MAKE A NAIVE BUILD FAIL HERE
#
#   1. `bundle exec jekyll` reports "command not found: jekyll" even with the
#      gems installed and `bundle check` satisfied — the binstub is not on the
#      path bundler searches. The gem's own executable works.
#   2. `_config.yml` pins `remote_theme: just-the-docs/just-the-docs@v0.12.0`,
#      and the plugin downloads it from codeload.github.com. In a sandboxed
#      session the egress proxy returns 403 and the build aborts. The
#      `just-the-docs` GEM is installed, so this strips the remote_theme line
#      and uses it.
#
# WHAT THIS IS NOT
#
# It is NOT what CI builds. CI uses `actions/jekyll-build-pages` with the
# `github-pages` gem and the pinned REMOTE theme, so chrome can differ — theme
# version, its CSS, its includes. What does NOT differ is Liquid and kramdown,
# which is where the defects this exists to catch live. Read a layout question
# off the staging preview, not off this.
#
# Usage:
#   cat-harness/scripts/preview-site.sh [dest]
#     dest  where to write the built site (default: a temp directory)

set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
docs="$here/../docs"
dest="${1:-$(mktemp -d)}"

# The gem executable. Resolved rather than hardcoded, because the rbenv
# version moves — and each candidate is TRIED rather than trusted to exist.
#
# `command -v jekyll` finds an rbenv SHIM here, and the shim exits with
# "rbenv: jekyll: command not found" while helpfully listing the very version
# that has it. A path that resolves is not a path that runs, so the loop below
# asks each candidate for `--version` and takes the first that answers. Same
# rule as everywhere else in this repository: a declared thing is checked, not
# assumed.
jekyll=""
for cand in \
  "$(command -v jekyll || true)" \
  $(find /opt/rbenv/versions -maxdepth 3 -name jekyll -type f -perm -u+x 2>/dev/null) \
  $(find /usr/local /usr/lib -maxdepth 6 -name jekyll -type f -perm -u+x 2>/dev/null)
do
  [ -n "$cand" ] || continue
  if "$cand" --version >/dev/null 2>&1; then jekyll="$cand"; break; fi
done
if [ -z "$jekyll" ]; then
  echo "preview-site: no WORKING jekyll executable found." >&2
  echo "  Candidates were tried with --version; a shim that resolves but exits" >&2
  echo "  non-zero does not count. Try: (cd cat-harness/docs && bundle install)" >&2
  exit 1
fi
echo "preview-site: using $jekyll ($("$jekyll" --version 2>/dev/null))"

# A config with the remote theme stripped and the local gem used instead —
# see (2). Written to a temp file so the committed `_config.yml`, which is what
# CI reads, is never touched.
cfg="$(mktemp /tmp/preview-config-XXXXXX.yml)"
trap 'rm -f "$cfg"' EXIT
grep -v '^remote_theme:' "$docs/_config.yml" \
  | sed 's/^\(\s*\)- jekyll-remote-theme$/\1- jekyll-seo-tag/' > "$cfg"
echo "theme: just-the-docs" >> "$cfg"

echo "preview-site: building $docs -> $dest"
"$jekyll" build --config "$cfg" --source "$docs" --destination "$dest" 2>&1 \
  | grep -vE "deprecation|DEPRECATION|^\s*╵|^\s*╷|^\s*[0-9]+ \||WARNING: [0-9]+ repetitive" \
  || true

if [ ! -f "$dest/index.html" ]; then
  echo "preview-site: build produced no index.html — see the output above." >&2
  exit 1
fi

echo
echo "preview-site: built. Some things worth opening:"
for p in index.html platform.html cat-harness/index.html cat-harness/voices/index.html; do
  [ -f "$dest/$p" ] && printf '  %-34s %s bytes\n' "$p" "$(wc -c < "$dest/$p" | tr -d ' ')"
done
echo
echo "  Serve it:  python3 -m http.server -d $dest 8099"
echo "  Anchors:   grep -o 'href=\"#[^\"]*\"' $dest/cat-harness/index.html | sort -u | head"
