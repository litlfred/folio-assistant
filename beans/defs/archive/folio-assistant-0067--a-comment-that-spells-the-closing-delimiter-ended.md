---
# folio-assistant-0067
title: A comment that spells the closing delimiter ended it early, leaking prose onto every page
status: completed
type: bug
priority: high
created_at: 2026-09-19T09:30:33Z
updated_at: 2026-09-19T09:30:33Z
---

Reported by the owner 2026-09-19, from the staging URL: a wall of prose at the
top of the page, beginning mid-sentence with a backtick.

## What it was

`docs/_includes/head_custom.html:117` carried, inside an HTML comment, a
sentence that SPELLED both halves of the comment wrapper as an example of what
Liquid ignores. The closing half **ended the comment eighteen lines early**, so
lines 117-135 rendered as visible body text — and `head_custom.html` is
included site-wide, so it was on the top of **every page of the docs site**,
not only staging.

The irony is load-bearing rather than decorative: the comment's subject is
"LIQUID PARSES TAGS INSIDE HTML COMMENTS", and its author escaped the Liquid
tags correctly with nested `{% raw %}` — then wrote the HTML delimiter
literally, because it did not occur to anyone that the outer syntax needed
escaping too. Its own text says "This comment cost one red deploy." It then
cost a second one, differently.

## Why nothing caught it

It is well-formed HTML. Jekyll builds it. The CI gates check links, schemas,
the knowledge graph and generated-file drift — none of them asks whether a
comment ends where its author meant it to, and no test renders a page and
looks at it. The staging deploy went green with the defect on every page.

## The asymmetry worth keeping

A Liquid tag HAS an escape. The closing comment delimiter has **none** — there
is no way to write those three characters inside a comment and have the comment
survive, because the parser is not looking for an escape, it stops at the first
match. So the rule is not "escape it carefully", it is **do not write it**.

## Fix

Rewrote the paragraph to describe the wrapper rather than spell it, and
recorded both the original hazard and this one in the comment itself.

Guard: `scripts/tests/html-comment-delimiters.test.ts`. A comment that closes
early is undetectable in general — it looks exactly like one that closes on
purpose. What IS detectable is the only way to author one by accident: an
OPENING delimiter appearing while a comment is already open. Comments do not
nest, so that sequence is never meaningful. Verified the detector fires on the
pre-fix file (1 finding, line 117) and is clean on the fixed one.

Swept all of `docs/**/*.html` for the same shape: this was the only instance.

## Summary of Changes

- `docs/_includes/head_custom.html` — paragraph rewritten; no longer spells the
  delimiter. Comment now closes where intended.
- `scripts/tests/html-comment-delimiters.test.ts` — new guard, 3 tests, one of
  which is the exact pre-fix line as a fixture.

## Not verified

That the rendered page is now clean. This container's egress proxy denies
`litlfred.github.io`, so the fix is verified by parsing the file, not by
loading the published page.
