# The WHO style guide

The **WHO house voices** and the **WHO glossary**. There are three editorial
profiles. Each one is read rule by rule out of one publication in this
instance's [library](../library/), and every rule carries the quote and the
page it came from.

**It is a subgraph of `who-iris`, not an instance of its own.** It was
staged as the separate top-level instance `who-style-guide/` from 2026-09-20
until the owner ruled on 2026-09-30:
*"who voices style guide is derivative KG content from who-iris, merge content
into subgraph. including docs."* Bean `qsx4` carried it in by `git mv`:

| was | is | graph typology |
|---|---|---|
| `who-style-guide/skills/voices/` | [`who-iris/skills/voices/`](../skills/voices/) | `voices`, declared from within by `skills/skills.json` |
| `who-style-guide/glossary/` | [`who-iris/glossary/`](../glossary/) | `glossary` |
| `who-style-guide/README.md` | this page, in the `who-iris-docs` subgraph | `docs` |
| `who-style-guide/AGENTS.md` | [`who-iris/docs/style-guide-agents.md`](style-guide-agents.md) | the rules for working on a voice (not kept inside `skills/`, where any non-README `.md` is read as a skill) |

## The three

| voice | read from | rules |
|---|---|---|
| `who-editorial` | WHO Editorial Style Manual (`who-pub-tps-931`, 1993) | spelling, capitalization, eponym form, reference layout, non-discriminatory language |
| `who-guideline-development` | Handbook for guideline development, 2nd ed (`9789241548960-eng`, 2014) | how a recommendation is stated, graded and attributed |
| `who-publication-design` | WPRO publication style guide (`wpr-rdo-2020-003-eng`, 2020) | logo integrity, exclusion zone, brand colour, typeface, photo provenance |

## Derived from the library, and now in the same instance as it

A voice is **derived from** a publication; it is not the publication. So the
voices sit beside the library and not inside it, and no source text is copied
into them.

While the voices were a separate instance, every rule cited
`{ instance: "who-iris", libraryId, sectionId }` and was resolved across the
instance boundary. Bean `r1lz` predicted that need — *"a skill derived from a
source text in another repo would cite evidence its own instance cannot
resolve"* — and bean `z7ev` built the resolver for it.

**The voices no longer need that resolver.** A voice and the publication it is
read from are now in one instance, so each source is cited in the bare
`{ libraryId, sectionId }` form, which resolves against the citing instance.
The cross-instance form is still supported for any voice whose source really
does live elsewhere.

**A voice names its sources once, in `sources[]`, and its rules use them.** A
rule says which source it uses and where in that source. If every rule
repeated the source's details, one fact would sit in two places and could
disagree.

## What is not here

**`milnor` did not come.** It is read from a mathematics paper, not a WHO
publication, and its source moved to `folio-assistant-sci/library/milnorlink/`
(bean `r1lz`).

## Checking it

```sh
bun run check:voices
bun run check:glossary
```

`check:voices` resolves every citation through the declaration of the instance
that holds the source. It reports four kinds of failure separately, because
each needs a different fix: unknown instance, no library graph, never ingested,
and no such section.

The check **finds** the instances that have a `voices/` directory instead of
assuming one. It did not do this until these three voices first moved out of
the platform. The first run after that move reported
`Voice graph (1 voices, 12 rules)` and exited 0, and 25 rules across three
voices went unchecked with no warning (bean `w095`).
