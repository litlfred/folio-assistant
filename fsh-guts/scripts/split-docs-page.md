---
$schema: folio-fsh-guts/v1
title: "split-docs-page.py"
kind: script
movedOn: 2026-09-20
movedFrom: "cat-harness/scripts/migrations/split-docs-page.py"
bean: folio-assistant-nfgo
summary: >-
  A one-shot helper that split a hand-written docs page into a content/docs/<slug>/ node tree, deriving node ids with kramdown's OWN slug rule so that every anchor the page already published kept working. Retired — `content/` does not exist in this repository — but the anchor-preservation argument is worth keeping, because it is the part a reimplementation would get wrong.
---

# `split-docs-page.py`

Self-described as a *"One-shot migration helper"*, and its sole remaining value is
one design decision.

## The decision worth keeping

When a published page is split into a node tree, the node ids become the anchors.
Derive them with your own slug function and **every inbound link and every
table-of-contents entry that already exists breaks** — silently, because a
missing anchor scrolls to the top of the page rather than erroring.

So it derived ids with **kramdown's own slug rule**, matching what the page was
already publishing, and then **pinned them in the manifest** so they stop tracking
the heading text. Two properties, and the second matters as much as the first:

| | |
|---|---|
| derive with the *renderer's* rule | today's anchors keep resolving |
| then **pin** the result | tomorrow's heading edit does not move them |

An id that keeps tracking its heading is a URL that changes when someone fixes a
typo.

## Why it is here

`content/` does not exist in this repository — the platform carries no folio — and
the directory it lived in (`scripts/migrations/`) held only this file and is now
gone. Moved rather than deleted, per
[`fsh-guts`](../../cat-harness/skills/folio-core/fsh-guts.md).
