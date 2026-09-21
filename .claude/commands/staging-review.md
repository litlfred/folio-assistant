---
description: Turn a staging deployment into a reviewable list — before/after URLs looked up in the publish ref, with what to review at each.
argument-hint: "[what you want to look at, in your own words]   (omit for every page this branch changed)"
allowed-tools: Bash(git*), Bash(bun*), mcp__github__pull_request_read, mcp__github__issue_read, Read, Grep, Glob
---

# /staging-review — send back the staging URLs, and what to look at

Runs the [`staging-review`](../../cat-harness/skills/folio-core/staging-review.md)
skill. Read it first; this file only parses the argument and names the order.

## Argument

`$ARGUMENTS` — **one optional string**: what you want to look at, in your own
words. It is passed through verbatim and it **narrows** the list.

- Given: only the pages that answer it. If it matches nothing that changed,
  say so — do not return the whole preview instead.
- Omitted: every page this branch changed.

## Order

1. Resolve the branch and its slug, and find the staging comment on the PR —
   the deployment's own URL, rather than one composed from a formula.
2. `git fetch origin gh-pages`, then **list** `STAGING/<slug>/`. Never fetch a
   page: a rendered page here is ~100 KB, and the listing answers the question.
3. Diff the branch against the default branch and map changed files to
   published surfaces. A schema, a test or a gate maps to **no page**.
4. Emit: the start-here line, the before/after table with what to review in the
   third column, then what could not be checked.

## What this command must not do

- Present a URL as already serving. The publish ref is observable from here;
  Pages propagation is not. Say *"should be live in ~5 minutes"* and schedule
  the check-back.
- Compose a URL from a source path. It is looked up, or it is reported absent.
- Approve, merge, or remove a preview.
