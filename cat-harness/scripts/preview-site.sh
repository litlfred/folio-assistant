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
# WHAT IT NOW DOES AFTER JEKYLL, AND WHY
#
# Jekyll builds `docs/` and nothing else. CI then runs a dozen steps that put
# files into `_site` from elsewhere, and WITHOUT THEM THE PREVIEW 404s ON
# THINGS THAT ARE LIVE. Measured cost in one session, 2026-09-23: three
# separate investigations into 404s that were all this — `/smart-trust/`,
# `cat-harness.jsonld`, and `/assets/qa/index/qa-index.json` — plus running
# `mount-instance-docs.ts` by hand after every single build.
#
# A 404 you have to investigate to dismiss is worse than one you can attribute
# at a glance, so the cheap deterministic steps are done here and the rest are
# NAMED at the end of the run. Both halves matter: doing them silently would
# leave the next unexplained 404 just as expensive.
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
grep -v '^remote_theme:' "$docs/_config.yml" \
  | sed 's/^\(\s*\)- jekyll-remote-theme$/\1- jekyll-seo-tag/' > "$cfg"
echo "theme: just-the-docs" >> "$cfg"

# THE COMPOSED TREE, because that is what CI builds FROM.
#
# `docs-site.yml` runs `compose-docs.ts --out ./_docs` and then points Jekyll
# at `_docs`, not at `cat-harness/docs`. Building the base directly is a
# DIFFERENT SOURCE TREE, and it silently drops every composed directory — which
# is why `/smart-trust/` 404ed here and not live, and cost a session an
# investigation to establish that.
#
# Composed into a temp directory rather than the repository's own `_docs`, so a
# preview never leaves anything behind for the next `git status` to explain.
src="$docs"
composed="$(mktemp -d /tmp/preview-docs-XXXXXX)"
trap 'rm -f "$cfg"; rm -rf "$composed"' EXIT
if bun run "$here/compose-docs.ts" --out "$composed" >/dev/null 2>&1 && [ -f "$composed/_config.yml" ]; then
  src="$composed"
  # The config is stripped from the COMPOSED copy for the same reason as
  # before — see (2) — so the committed one is still never touched.
  grep -v '^remote_theme:' "$composed/_config.yml" \
    | sed 's/^\(\s*\)- jekyll-remote-theme$/\1- jekyll-seo-tag/' > "$cfg"
  echo "theme: just-the-docs" >> "$cfg"
  echo "preview-site: composed the docs layers -> $composed"
else
  # A compose failure is REPORTED, not swallowed: the build still works off the
  # base layer, and a reader who is told which tree was used can account for a
  # missing composed page instead of chasing it.
  echo "preview-site: compose-docs failed — building the BASE layer only." >&2
  echo "  Composed directories (smart-trust's docs among them) will 404." >&2
fi

echo "preview-site: building $src -> $dest"
"$jekyll" build --config "$cfg" --source "$src" --destination "$dest" 2>&1 \
  | grep -vE "deprecation|DEPRECATION|^\s*╵|^\s*╷|^\s*[0-9]+ \||WARNING: [0-9]+ repetitive" \
  || true

if [ ! -f "$dest/index.html" ]; then
  echo "preview-site: build produced no index.html — see the output above." >&2
  exit 1
fi

repo="$(cd "$here/../.." && pwd)"

# ── The post-Jekyll steps, mirroring `docs-site.yml` ──────────────────────
#
# Each is cheap (the slowest is ~2s), offline and deterministic. A step that
# needed the network or a toolchain this environment may not have is NOT run
# here — it is listed at the end instead.

if [ "${PREVIEW_NO_MOUNT:-}" != "1" ]; then
  # `mount-instance-docs.ts --site ./_site --built cat-harness` in CI. Copies
  # each instance's rendered content into the published tree and injects the
  # harness rail into pages Jekyll never sees. Without it `/who-iris/` and
  # every asset under it 404s — including the harness tab marks.
  echo "preview-site: mounting instance-rendered content"
  bun run "$here/mount-instance-docs.ts" --site "$dest" --built cat-harness 2>&1 | sed 's/^/  /' || true
fi

# `cp -rT cat-harness/test/results/witnesses ./_site/assets/qa` in CI. The QA
# witnesses are COMMITTED under `test/results/` (provenance) and SERVED from
# `/assets/qa/` (what every `data-qa-src` says). Without the copy every badge
# fetch 404s, and `paintQaBadges` renders that as `unknown` — "could not
# determine", which is a different answer from "not swept".
if [ -d "$repo/cat-harness/test/results/witnesses" ]; then
  mkdir -p "$dest/assets"
  cp -rT "$repo/cat-harness/test/results/witnesses" "$dest/assets/qa"
  find "$repo/cat-harness/test/results" -maxdepth 1 -name '*.qa-results.json' -exec cp {} "$dest/assets/qa/" \; 2>/dev/null || true
  echo "preview-site: published $(find "$dest/assets/qa" -name '*.json' | wc -l | tr -d ' ') QA document(s)"
fi

# The knowledge graph and the glossary, at the paths the launcher's tiles point
# at. The stub is ASKED FOR rather than assumed — `print-stub.ts` is what CI
# uses, and hardcoding `cat-harness` here would be a second answer to a
# question the declaration already settles.
stub="$(bun run "$here/print-stub.ts" "$repo/cat-harness" 2>/dev/null | tr -d '[:space:]')"
if [ -n "$stub" ]; then
  bun run "$here/kg-export.ts" --out "$dest/$stub.jsonld" >/dev/null 2>&1 \
    && cp "$dest/$stub.jsonld" "$dest/$stub.json" \
    && echo "preview-site: exported $stub.jsonld (+ the .json twin Pages needs)"
  bun run "$here/glossary-export.ts" --out "$dest/$stub-glossary.jsonld" >/dev/null 2>&1 \
    && cp "$dest/$stub-glossary.jsonld" "$dest/$stub-glossary.json" || true
fi

echo
echo "preview-site: STILL NOT DONE HERE, so a 404 on one of these is expected:"
echo "  - the TypeDoc API reference        (a toolchain run, minutes)"
echo "  - bootstrap's own graph + glossary (\`--instance ./bootstrap\` variants)"
echo "  - the kg-viewer page and the schema export"
echo "  - the staging banner and its \`STAGING/<branch>/\` prefix"
echo "  - the pinned REMOTE theme          (see WHAT THIS IS NOT, above)"
echo "  Authority is \`.github/workflows/docs-site.yml\`; this list is a"
echo "  convenience and can go stale, so check there before concluding."

echo
echo "preview-site: built. Some things worth opening:"
for p in index.html platform.html cat-harness/index.html cat-harness/voices/index.html; do
  [ -f "$dest/$p" ] && printf '  %-34s %s bytes\n' "$p" "$(wc -c < "$dest/$p" | tr -d ' ')"
done
echo
echo "  Serve it:  python3 -m http.server -d $dest 8099"
echo "  Anchors:   grep -o 'href=\"#[^\"]*\"' $dest/cat-harness/index.html | sort -u | head"
