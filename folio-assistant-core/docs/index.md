---
title: "folio-assistant-core"
description: "The content layer: what a folio is, its block kinds and adapters, and the folio graph kind itself."
has_children: false
---

# folio-assistant-core

**The content layer.** This instance defines what a *folio* is: the
content-object model, the block kinds, the content adapters (`document` and
`paper`) and the profiles nested inside them, and the `folio` graph kind
itself.

## Where it sits

It sits on [C@T Harness](https://github.com/litlfred/folio-assistant/tree/main/cat-harness)
and may import from it. The harness never imports from this layer.
`bun run check:partition:edges` reports any edge that runs the wrong way.
Instances such as WHO IRIS sit on top of this one. That is why the navbar
lists it between them, because the order comes from each declaration's
`needs`.

## What it holds

The declaration
[`folio-assistant-core.json`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/folio-assistant-core.json)
lists every directory and the graph kinds each one holds. The section below is
generated from that declaration. It shows the counts and the viewers that are
published today.

{% include harness_details.html instance="folio-assistant-core" %}

## The rule this layer turns on

This repository is the platform, not the content. A folio's chapters,
constants and vocabularies live in that folio's own repository. If you are
about to write subject matter here, you are either in the wrong repository or
writing something that belongs in a folio as data.

The instance's
[README](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/README.md)
sets out the scope boundary in full, along with what is still pre-split.
