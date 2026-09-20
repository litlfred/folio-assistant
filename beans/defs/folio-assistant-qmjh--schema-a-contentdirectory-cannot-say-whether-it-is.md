---
# folio-assistant-qmjh
title: 'SCHEMA: a ContentDirectory cannot say whether it is a LAYOUT dependents reproduce or where THIS instance''s content lives'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T12:32:20Z
updated_at: 2026-09-20T12:44:54Z
parent: folio-assistant-zzmr
---


Queued on the owner's ruling of 2026-09-20: root `harness.json` now, this
schema work next. Their words for it: *"directive for cat-harness to create if
(as named in schema)"*.

## It was already found, and already declined — that is the point

`cat-harness/harness.json`, on the `bootstrap` skills entry, states it exactly:

> a `ContentDirectory` cannot say whether it is a LAYOUT dependents should
> reproduce (`uploads/`, `library/`, `voices/`) or merely WHERE ITS OWN CONTENT
> LIVES (`workflows/`, `schemas/`, `tools/`). […] Adding that distinction was
> considered and DECLINED for now: it is a schema change whose per-directory
> classification is a judgement about every directory here, not a bootstrap
> workaround.

So this bean is not a discovery. It is the decision being taken off the shelf,
and the declining reason is still the risk to design against.

## What it costs to get wrong, measured

Simulated on a fresh folio depending on this instance: `init-folio` would create
**five directories it has no use for**, each with a committed keep-marker. That
is the `dh4f` shape shipped downstream to every folio — a consumer scanning a
directory that exists and is empty, reporting a clean run over it.

And the near side is measured too. Flipping `uploads` to `scope: "repository"`
to move one queue turned **6 tests red**: three the dependent-inherits-its-own
guarantee, two the upload URL's instance segment, one corpus paths. Scope is
not the axis this needs.

## Why `scope` is not already the answer

`scope` says WHERE a path resolves — instance root or repository root. This asks
something orthogonal: whether a DEPENDENT should get one of its own. The two are
independent, and `bootstrap`'s `workflows/` is the proof: no scope, so
cat-harness inherits it, and `materialiseDirectories` re-roots it against the
inheriting instance by design, wanting `cat-harness/workflows/` which is not
there — `harness:dirs:check` reports `21 declared, 1 missing`.

## Done when

- [ ] `ContentDirectory` can express "dependents reproduce this" vs "this is
      where MY content lives", and the field is REQUIRED so a new directory
      cannot go unclassified — the `BLOCK_KINDS` discipline.
- [ ] Every directory in every `harness.json` here is classified, each by a
      judgement recorded in its `description` rather than inferred from its name.
- [ ] `materialiseDirectories` creates only the reproduce-set for a dependent.
      Falsified in both directions: a fresh folio gets `uploads/` and `library/`
      and does NOT get `workflows/`, `schemas/`, `tools/` or `src/skills/`.
- [ ] The `bootstrap` entry in `cat-harness/harness.json` that exists only to
      work around this can then go, which is the check that it actually landed.
- [ ] `wwi6`'s four tests still pass unchanged. If they need editing, the design
      is wrong — they pin the property this must preserve.

## Not in scope

Moving anything. The root `uploads/` relocation is done (`889e003012`) and did
not need this; it works because the root declares itself, leaving cat-harness's
declaration alone.
