---
# folio-assistant-fuzm
title: The staging slug sanitiser can emit '..' — safety rests on git's ref rules, written down nowhere
status: todo
type: task
parent: folio-assistant-1xhc
created_at: 2026-09-20T06:53:04Z
updated_at: 2026-09-20T06:53:04Z
---


Found 2026-09-20 while siting bean `6pfo`'s retired-record store, by checking whether the slug could reach a path it should not.

## The finding

`feature-staging.yml`'s slug sanitiser, used by both the `stage` and `cleanup` jobs:

```sh
SLUG=$(echo "$BRANCH" | sed 's|[^a-zA-Z0-9._-]|-|g' | sed 's|--*|-|g' | sed 's|^-||;s|-$||')
```

`.` is in the permitted class, and the substitution **replaces** rather than deletes — so two adjacent input dots produce two adjacent output dots. Input `..` yields output `..`.

The cleanup job then runs:

```sh
rm -rf "STAGING/$SLUG"
```

With `SLUG` of `..` that is `rm -rf "STAGING/.."` — the checkout root of the `gh-pages` working copy, not a preview.

## Why it is not currently exploitable, and why that is the point

**Git rejects every ref name containing `..`.** Verified with `git check-ref-format` across eight candidates — `..`, `../..`, `a/../../x`, `./.`, `.git`, `...`, `a..b`, `feat/..%2f..` — every one rejected. Since the only source of an output dot is an input dot, and any adjacent pair requires an adjacent pair in the input, the sanitiser cannot emit `..` from a name git would accept as a branch.

So the guard is real. **It just is not in this file, or in any comment near it.** The safety of an `rm -rf` rests on an invariant of git's ref format that nothing here states and no test pins.

## What breaks it, none of which is far-fetched

- A slug taken from something that is not a ref — a dispatch input, an issue title, a directory listing of `STAGING/` read back from `gh-pages`. `cleanup-dispatch` already takes `cleanup_slug` as a **dispatch input**; it is guarded by a confirmation that must repeat the slug exactly, which is a guard on the CALLER rather than on the value.
- A change to the sanitiser that looks equivalent — adding `/` to the permitted class for nested previews, say.
- Reuse of the sanitiser somewhere with no `rm` today but one later.

The job's own comment already marks it **"THE SERIOUS ONE"** for a different reason: it runs on `pull_request_target`, so an interpolated fork branch name is arbitrary code execution with write access. The `..` case is the same class of hazard one layer down, and the existing comment's care is evidence this is the right file to state it in.

## Done when

- The invariant is written where the sanitiser is, naming git's ref rules as the reason rather than leaving the `sed` to look self-sufficient.
- A test pins it: a slug that is `..`, or contains a path separator, is refused by whatever consumes it — so the protection does not depend on the input happening to be a ref.
- Every `rm -rf` built from a slug refuses a slug that is not a single safe path segment, rather than trusting its provenance.

## Not in scope

Rewriting the sanitiser. It is correct for the input it actually gets; the defect is that nothing says why, and nothing would notice if that stopped being true.
