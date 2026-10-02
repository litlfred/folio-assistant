---
# folio-assistant-rtoc
title: README TOC generation is qou-hardcoded and every chapter PDF link it emits is a 404
status: completed
type: task
priority: normal
created_at: 2026-08-29T08:05:00Z
updated_at: 2026-08-29T09:10:00Z
---

Working on `claude/readme-github-pages-links-2tweq0`.

## Two defects, one script

`scripts/generate-readme.sh` lives in the PLATFORM but is entirely one folio's
content: the title, the three badges, the knot registry, the `QOU.` module
namespace, and a `PAGES` constant hardcoded to `litlfred.github.io/qou`. It
emits a chapter table for exactly one paper — `quantum-observable-universe` —
even though `content/folio.ts` in that folio lists five.

1. **Links assume a public GitHub Pages site.** `litlfred/qou` is private
   (unauthenticated `github.com/litlfred/qou` → 404), so every `github.io` URL
   in its README is unreachable for the people who *do* have repo access.
2. **The URLs were never checked against anything.** They are composed by
   convention — `${PAGES}/papers/<paper>/chapters/<dir>.pdf` — and the
   `gh-pages` branch has no `chapters/` directory at all. All 23 chapter PDF
   links are 404 even with Pages public. Three of six appendix links resolve.

## What raw.githubusercontent does not fix

`raw.githubusercontent.com` 404s on a private repo without a token, and a
browser session cookie does not authenticate it — so swapping the host makes
nothing reachable. What *does* work for a private repo is a
`github.com/<owner>/<repo>/blob/<ref>/<path>` link: it honours the viewer's
session and GitHub renders PDFs inline. The build artefacts are already
committed on `gh-pages`, so they have a blob URL.

## Plan

- `content/pipeline/readme-toc.ts` — one TOC per paper in the folio, link
  targets **verified against `git ls-tree` of the publish ref** so an
  unpublished chapter renders `—` rather than a dead link. `blob` / `pages` /
  `raw` link styles, config-driven, `blob` default.
- Generic MCP tool `readme_toc`, `bun run readme:toc[:check]`.
- Repoint `generate-readme.sh` at it, for all papers.

## Landed

- fa PR #146 — `content/pipeline/readme-toc.ts`, `readme_toc` MCP tool
  (generic), `bun run readme:toc[:check]`, `folio_init` scaffolds the markers,
  `readme-metadata.ts` deduplicated onto the shared discovery. 16 tests; full
  suite 1152/0; tsc and eslint clean.
- qou PR #5974 — README regenerated: five papers instead of one, PDF links
  verified (5 resolve, 38 honestly `—`), artefacts table repointed at
  `gh-pages` blobs with the two dead rows (`blueprint/`, `docs/`) removed.

## Caught only by running it against a real folio

`git ls-tree -r` over a published site is several megabytes — past Node's
1 MiB `execFileSync` default — so it threw ENOBUFS, the catch turned that into
"ref unavailable", and every PDF cell fell back to `—` on a healthy branch.
Buffer is 64 MiB now. The fixture trees in the tests are orders of magnitude
too small to reach it; only the qou run exposed it.
