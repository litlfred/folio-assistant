---
# folio-assistant-yean
title: 'SKILL GAP: two textbook Tool nodes cannot be written — no skill states what they do'
status: todo
type: task
priority: normal
created_at: 2026-09-20T05:14:54Z
updated_at: 2026-09-20T05:14:54Z
parent: folio-assistant-d308
---

Met while working `v7bg`. **Two scripts are textbook Tool nodes and cannot be
written, because no skill states what they do.**

`gen-themes-css` → `assets/css/themes.css` from `schemas/themes.ts`
`gen-avatars-css` → `assets/css/avatars.css` from `schemas/avatars.ts`

Both committed, both published, both single-file — the exact shape `maintains`
exists for, and both carry the owner's own requirement in their headers:

> *"named css assets in KG rather than hardcoded colors"* — the graph is the
> source, the stylesheet is a rendering of it, so a colour or a glyph has one
> home.

## Why no node was written

`satisfies` requires at least one skill. Searched the whole corpus for a skill
stating this capability: **none.** `kg-export` serializes the graph to JSON;
`rendering-auditor` audits a content block's visual output; `one-voice-style-guide`
is prose voice. Nothing says "render the graph's asset nodes into the site's
stylesheets".

Stretching one of those would make the `satisfies` edge **false**, which
`covered-is-not-reachable` forbids in both directions. So the scripts stay
unreachable and the gap is recorded, rather than closed with an edge that lies.

## Why this is the owner's call and not an agent's

Authoring a skill is a claim about the platform's **capability vocabulary** — what
this harness says it can do, generically, for every downstream instance. That is a
design act with consequences past this repo, since a skill is inherited by every
dependent instance.

And the trap is specific: a skill written to give a script somewhere to point is
**a Tool with front matter**. It would pass every check and teach nothing.

## The two candidates

**A — one skill: site presentation assets.** "The graph is the source of the
site's visual assets; a colour, a glyph or a theme has one home, and the
stylesheet is generated." Covers both scripts, and any future generated asset.
Risk: broad enough to become a bucket.

**B — no new skill; these are `kg-export` after all.** Argue that a stylesheet IS
a rendering of the graph, so both nodes satisfy `kg-export` like the schema
carriers do. Cheaper, and defensible — but `kg-export`'s own description says
*"serialize … to one JSON document"*, so it would need rewording, and a skill
reworded to admit a Tool is the stretch under another name.

**A is recommended.** B changes a skill's stated capability to fit a mechanism,
which is the direction this whole family of findings says not to go.

## The general finding this instance produced

Recorded in `covered-is-not-reachable` §"The third case": there are three
mismatches, and the instruments see only the first.

| case | what exists | what is missing | what sees it |
|---|---|---|---|
| 1 | a skill | a Tool | `check:tools`, `tools:coverage` |
| 2 | a skill and Tools for its neighbours | a Tool for the mechanism | nothing |
| 3 | a mechanism | any skill stating it | nothing |

Case 3 is invisible to `tools:coverage` by construction: it enumerates skills and
asks which lack Tools, so a capability nobody stated is absent from the list it
walks.

## Done when

- [ ] the owner picks A or B
- [ ] if A: the skill authored, stating the capability generically and naming no
      script; then `themes-css` and `avatars-css` nodes with `maintains`
- [ ] if B: `kg-export`'s description widened deliberately and on the record,
      then both nodes
- [ ] either way, a check that finds case 3 — a published generated artefact with
      no Tool maintaining it. `check:declared-assets` may already be the place
