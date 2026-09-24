---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Site presentation assets'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/theming/site-presentation-assets.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/theming/site-presentation-assets.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/theming/site-presentation-assets.md){: .fa-edit-source }

{% raw %}
# Site presentation assets — the node is the source, the stylesheet is a rendering

**A visual fact has one home, and it is a node in the knowledge graph.** A
colour, a glyph, an avatar, a theme's token set: declared once as data, and the
stylesheet the site serves is **generated** from it.

The owner's requirement, and the whole of it:

> *named css assets in KG rather than hardcoded colors*

Authoring the stylesheet by hand beside the nodes gives **two answers to one
question**, free to disagree — and they do disagree, silently, because nothing
compares a hex triple in a `.css` file with a hex triple in a `.ts` file. This is
the same failure as a hand-written `title:` in a Jekyll config next to a declared
instance name, which diverged the day it was written.

## The test

> **Could a reader change this visual fact in one place and be sure the site
> agrees?**

If the answer needs them to remember a second file, the fact has two homes and
one of them is wrong.

## Four rules

**1 — Never hand-edit a generated stylesheet.** It is build output that happens
to be committed, and it is committed only so it is readable on the forge. An edit
survives exactly until the next generator run.

**2 — Gate staleness, do not trust it.** The generator takes a `--check` arm that
compares against the committed copy and fails rather than writing. A generator
whose `--check` is not in CI is a generator whose output drifts, and the drift is
invisible because the file looks authored.

**3 — A published generated asset needs a Tool that `maintains` it.** Otherwise
the provenance is unreachable: nothing can answer "which node produced this
stylesheet", and the asset becomes the third case in
[`covered-is-not-reachable`](../folio-core/covered-is-not-reachable.md) — a mechanism nobody
can find. Declare the artefact by its **published** path, and check that
something actually publishes it before claiming so.

**4 — An asset reference resolves; it is never composed.** A page that names a
generated asset must reach it relative to its own location, so the same bytes work
at the canonical base and under a staging prefix with no configuration. A page
that composes the URL from a base needs a different build per environment, and a
staging build that differs from what ships is testing something else.

**An address may be relativized. A name may not** — a JSON-LD `@id` or a schema
`$id` is an identity, and relativizing it changes what the document claims to be,
resolving against whatever URL happened to serve it.

## Themes are token sets, not stylesheets with branches

A theme declares **tokens** — the named values a stylesheet reads. Light and dark
are two valuations of one token set, not two hand-maintained blocks that drift
apart.

So a new colour is a token on the node, and the generator decides how it reaches
CSS. Adding a `@media (prefers-color-scheme: dark)` branch by hand to cover a
value the node does not carry is rule 1 broken with extra steps: the node still
does not know about the colour, so the next instance to render it gets the light
value in the dark.

## The third state applies here too

An asset whose presence **cannot be determined** — the site not built, a fetch
refused — is not *present*. Report it as could-not-determine and do not let it
clear the assets the check did not reach. A generated asset that silently went
missing renders as an unstyled page, which looks like a design choice rather than
a failure.

## What this skill does not cover

- **Prose voice and tone** — [`one-voice-style-guide`](../folio-core/one-voice-style-guide.md).
- **Whether a rendered block LOOKS right** — that is a content question, and the
  rendering auditor's.
- **How a link is spelled** —
  [`link-style-raw-is-not-the-private-repo-answer`](../../../memory/link-style-raw-is-not-the-private-repo-answer.md).

This skill is only about the direction of authority: **the graph decides, the
stylesheet reports.**

## Why this skill exists at all, recorded because the gap was the finding

It was authored 2026-09-20 after two generators — both committed, both published,
both single-file — could not be given Tool nodes, because `satisfies` requires a
skill and **no skill stated this capability**. The mechanism had existed for some
time; the vocabulary had not.

That is the third mismatch in
[`covered-is-not-reachable`](../folio-core/covered-is-not-reachable.md), and it is invisible to
`bun run tools:coverage` by construction: that tool enumerates **skills** and asks
which lack Tools, so a capability nobody stated is absent from the list it walks.
Bean `yean`.

The skill was written before the nodes, and deliberately names no script. A skill
written to give a command somewhere to point is **a Tool with front matter**: it
passes every check and teaches nothing.
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Code node review](../../processes/review-code.html) | Review the schema definition node |

