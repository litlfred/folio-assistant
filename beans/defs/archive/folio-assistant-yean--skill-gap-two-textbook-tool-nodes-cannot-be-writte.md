---
# folio-assistant-yean
title: 'SKILL GAP: two textbook Tool nodes cannot be written — no skill states what they do'
status: completed
type: task
priority: normal
created_at: 2026-09-20T05:14:54Z
updated_at: 2026-09-20T14:06:58Z
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

---

## CLOSED 2026-09-20 — the skill was authored on `main`, and candidate A was taken

**The gap this bean recorded no longer exists.** A sibling session answered it
independently, and the answer arrived here through merge `ce9b4cf`.

`skills/folio-core/site-presentation-assets.md` (108 lines) is **candidate A** —
one skill for site presentation assets, stated generically:

> *A visual fact — a colour, a glyph, a theme — lives in a graph node, and the
> stylesheet the site serves is a rendering of it.*

It carries the owner's requirement verbatim, a one-question test ("could a reader
change this visual fact in one place and be sure the site agrees?"), four rules,
and an explicit non-coverage list separating it from `one-voice-style-guide` and
the rendering auditor.

### It is not the thing this bean warned against

The trap recorded above was that *"a skill written to give a script somewhere to
point is **a Tool with front matter** — it would pass every check and teach
nothing."* Checked against the text rather than assumed from its existence:

- **It names no script, deliberately, and says so** in its own closing section.
- Its rules are about **direction of authority**, not invocation: never hand-edit
  generated output; gate staleness rather than trust it; a published generated
  asset needs a Tool that `maintains` it; an asset reference resolves and is never
  composed.
- It generalises past the two scripts — themes as **token sets** rather than
  stylesheets with branches, and the third state for an asset whose presence
  cannot be determined.

### Both nodes are in the graph

| node | invoke | satisfies | maintains |
|---|---|---|---|
| `themes-css` | `bun run themes:css` | `site-presentation-assets` | `schemas/themes.ts` → `assets/css/themes.css` |
| `avatars-css` | `bun run avatars:css` | `site-presentation-assets` | `schemas/avatars.ts` → `assets/css/avatars.css` |

Verified, by running it rather than reading it:

- `bun run check:tools` → *"every satisfies resolves and agrees with its skill's
  contract; every io type is declared; every argv input is injection-safe"*.
- `bun run tools:coverage` → `site-presentation-assets` is **absent from all four
  uncovered tiers** (44 skills have a Tool, 155 do not; tier A is 28).
- `test/results/kg-qa/skills/folio-core/site-presentation-assets.kg-qa.json` —
  4 pass, 0 fail, 0 unknown.
- Both nodes take a `--check` arm, which is rule 2 of the skill satisfied by the
  mechanism the skill governs.

### One thing the owner may still want to revisit

This bean existed **because the A-vs-B choice was the owner's**, and it was
settled on `main` by a sibling rather than by them. The outcome is A. B was
*"these are `kg-export` after all"*, which would have required rewording
`kg-export` away from *"serialize … to one JSON document"* — the stretch under
another name. A is the better answer on the merits and is what shipped; recorded
here only so the decision is visible as having been made, not inferred.
