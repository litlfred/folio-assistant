# who-style-guide

The **WHO house voices**. Three editorial profiles, each read rule by rule out
of one publication in the [`who-iris`](../who-iris/) library, every rule
carrying the quote and the page it came from.

Staged as a top-level directory ahead of becoming its own repository — the same
arrangement as [`who-iris/`](../who-iris/),
[`folio-assistant-sci/`](../folio-assistant-sci/) and
[`folio-assistant-core/`](../folio-assistant-core/).

## The three

| voice | read from | rules |
|---|---|---|
| `who-editorial` | WHO Editorial Style Manual (`who-pub-tps-931`, 1993) | spelling, capitalization, eponym form, reference layout, non-discriminatory language |
| `who-guideline-development` | Handbook for guideline development, 2nd ed (`9789241548960-eng`, 2014) | how a recommendation is stated, graded and attributed |
| `who-publication-design` | WPRO publication style guide (`wpr-rdo-2020-003-eng`, 2020) | logo integrity, exclusion zone, brand colour, typeface, photo provenance |

## Why the citations point somewhere else

A voice is **derived from** a publication; it is not the publication. The three
source documents live in `who-iris/library/`, so every rule here cites
`{ instance: "who-iris", libraryId, sectionId }` and resolves across the
instance boundary.

That is the case bean `r1lz` predicted the day before the move was decided —
*"a skill derived from a source text in another repo would cite evidence its
own instance cannot resolve"* — and bean `z7ev` built the resolver that makes
it representable. Before it, `check-voices` composed a path against the voice's
**own** instance root, which made a cross-instance citation unsayable rather
than merely unresolvable.

**The instance is declared once per voice and inherited by its rules.** A voice
names its sources in `sources[]`; a rule says which of them and where in it.
Repeating the instance on every rule would put one fact in two places and let
them disagree — a voice pointing at `who-iris` with a rule pointing at
`folio-assistant-sci` is representable, meaningless, and nothing would catch it.

## What is not here

**`milnor` did not come.** It is read from a mathematics paper, not a WHO
publication, and its source moved to `folio-assistant-sci/library/milnorlink/`
(bean `r1lz`). A directory named for one house style is not a place to keep
another domain's voice.

**No `library`.** This instance holds no corpus and declares none. The absence
is load-bearing: `resolveLibraryRef` answers a citation naming this instance
with `no-library-graph`, which is a different and more actionable finding than
"that section is missing".

## Checking it

```sh
bun run check:voices
```

It resolves every citation through the **target** instance's own declaration
and keeps four failure kinds apart — unknown instance, no library graph, never
ingested, no such section — because each sends a reader somewhere different.

The check **enumerates** the instances that ship a `voices/` directory rather
than assuming one. It did not, until these three moved: the first run after the
move reported `Voice graph (1 voices, 12 rules)` and exited 0, with
twenty-five rules across three voices unchecked and nothing saying so. Bean
`w095`.
