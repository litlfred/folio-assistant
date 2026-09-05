---
# folio-assistant-rlnk
title: The README tables that are not generated are unverified — nothing checks a link the author typed
status: completed
type: task
priority: normal
created_at: 2026-09-05T08:55:00Z
updated_at: 2026-09-05T09:05:00Z
---

Third in the line after `rtoc` and `rmsy`. Those two made the *generated*
sections verify their own links. Everything else in a folio README is authored
Markdown, and nothing checks it at all.

## The evidence that this is a real class, not a hypothetical

qou's Published Artefacts table listed `blueprint/` and `docs/`. Neither has
ever existed on `gh-pages` — the Lean documentation is published at
`lean/docs/`. Both rows were dead in *both* columns and had been for as long
as anyone had looked, in a table nobody could regenerate. I removed them by
hand in #5974; nothing stops the next two from appearing.

Its Project Structure table has the same shape: hand-maintained repo paths,
never checked against the repo.

## Why an audit rather than a sixth section

A generator would have to invent the labels ("Folio landing page", "Blueprint
(interactive graph)") and the path descriptions, which are authored prose and
worth keeping. The defect in both tables was never staleness of layout — it was
targets that do not resolve. So verify what the author wrote instead of
replacing it.

`readme_audit`: parse every Markdown link, resolve relative paths against the
working tree and repo-internal links against the ref they name (`gh-pages` via
the same listing `folio:toc` uses), report the dead ones with line numbers.
Never rewrites. Keeps the third state: a ref that cannot be read makes its
links **unchecked**, never dead.

## Landed

- fa #165 — `content/pipeline/readme-links.ts`, `readme_audit` MCP tool,
  `bun run readme:audit`. 15 tests; full suite 1360/0; tsc and eslint clean.
- qou #6796 — the one dead link it found, plus two code-span siblings.

## It paid for itself on the first run

qou: 83 links checked, one dead — `tools/witness-schema/`, a package that lives
at `schemas/witness-schema/`. Added to the README *after* the two PRs that
cleaned up the artefacts table, which is the point: the class regenerates, so
the check has to be standing rather than a one-off sweep.

This repo's own README: 16 checked, 16 resolve.

## Known gap, deliberately not closed

The audit sees links. Two of the three wrong `tools/witness-schema/` paths were
code spans, invisible to it. Widening to code spans means guessing which
`foo/bar` strings are paths — globs, module names and shell fragments all look
alike — so it is a heuristic, and a false positive in a link checker is what
gets the checker turned off.
