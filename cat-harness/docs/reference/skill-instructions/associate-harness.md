---
layout: default
title: 'Associate a harness'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/associate-harness.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/associate-harness.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/associate-harness.md){: .fa-edit-source }

{% raw %}
# Associate a harness

The owner, 2026-09-23, on the ihris folio:

> i dont want to publish at /folio-assistant/ihris/; that's a platform change,
> certainly not a materialized publish, but we need a good mechanism for
> "assocaiated" harnesssed KGs. it should be an optional list proroperty of any
> harness inheriting cat-harness (including itself).

## What an association is, and what it is not

A harness has four ways to relate to another:

| relation | field | what it does |
|---|---|---|
| depends | `needs` | loads the other harness under this one (the overlay) |
| references | `remoteGraphs` | knows one **graph** held elsewhere |
| utilizes | `dependencies` (config) | resolves another folio's skills and translations |
| **associated** | `associatedHarnesses` | knows another **harness**, and where it lives |

An associated harness is **not loaded, not built and not copied**. This site
does not publish it. The config panel lists it under "Associated ↗ remote",
and its links go to the harness's own site and its own repository.

## Declare one

Add an entry to `associatedHarnesses` in the declaring instance's `<name>.json`:

```json
"associatedHarnesses": [
  {
    "name": "ihris",
    "title": "iHRIS Knowledge Base",
    "url": "https://litlfred.github.io/ihris/",
    "repository": "https://github.com/litlfred/ihris",
    "relation": "folio-of",
    "note": "A folio on this platform, published from its own repository."
  }
]
```

- `name` is the harness's instance name as **its** declaration gives it.
- `url` is required: where a reader goes.
- `repository` is where the panel's ✎ points. Leave it out if the harness has no
  public source, and the panel shows no ✎. It never falls back to this
  checkout's `origin`.
- `relation` is a few words; `folio-of` means "a folio built on this platform".

## What the schema refuses

`AssociatedHarnessSchema` is strict. It refuses:

- an unknown key (a misspelt `repo` would otherwise vanish and leave ✎ pointing nowhere);
- the same `name` twice;
- a `name` that is also in `needs` (then it would be both loaded and not loaded);
- a `name` that is a harness in this checkout. That one is local, and belongs
  in `needs` or nowhere (`associated-harness-config.test.ts`).

## Then

Run `bun run docs:harness` and commit `docs/_data/harness.json`. The Harnesses
panel (the ⚙ on a sidebar divider, or the glass tile) reads it from there.
{% endraw %}
