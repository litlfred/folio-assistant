---
$schema: folio-fsh-guts/v1
title: "Skill-instructions page \"bootstrap-graph-publication\" — a generated page nothing regenerates any more"
kind: generated-page
movedOn: 2026-09-23
movedFrom: "cat-harness/docs/reference/skill-instructions/bootstrap-graph-publication.md"
bean: folio-assistant-oe98
summary: >-
  A page gen-skill-docs.ts wrote before commit 258d6e0a (byql: fold detangle
  and kg-navigation into cat-harness) and has not written since. It was no
  longer in the skill-instructions index, --check could not see it, and both
  of its source/edit links pointed at paths that no longer exist. Moved here
  on the owner's choice (2026-09-23, "move to trashcan") rather than deleted;
  the live page for any skill that still exists is regenerated from its source.
---

> **Retired 2026-09-23.** Moved here rather than deleted, per
> `skills/folio-core/fsh-guts.md`. The original page follows verbatim,
> including its own front matter, fenced so it is not read as this node's.

````markdown
---
layout: default
title: 'Publishing bootstrap''s graph'
parent: Skill instructions
---

{: .note }
> Generated from [`../bootstrap/tools/bootstrap-graph-publication.md`](https://github.com/litlfred/folio-assistant/blob/main/../bootstrap/tools/bootstrap-graph-publication.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/../bootstrap/tools/bootstrap-graph-publication.md){: .fa-edit-source }

{% raw %}
# Publishing bootstrap's graph

## One path, named in three places, and they must agree

    @id            <base>/bootstrap/bootstrap.jsonld
    build writes   ./_site/bootstrap/bootstrap.jsonld
    served at      <base>/bootstrap/bootstrap.jsonld

`_site/` is served at the site base, so **the path the IRI carries must be
exactly the path under `_site/`**. Anything else is a link that 404s, and it
404s in the one artefact whose entire purpose is being dereferenced.

That is not hypothetical. The site build published `bootstrap/ns.jsonld` —
the **namespace** document — in a loop over all three layers, and nothing
published the **graph**. The generator ran, the document was correct, and its
`@id` resolved to nothing. Bean `blv9`.

**So the test asserts the WORKFLOW, not the script.** A build that runs a
generator and writes it somewhere else leaves the `@id` just as dead as one
that never runs it, and a script name alone cannot tell those apart —
`scripts/tests/bootstrap-graph.test.ts` matches on the `--out` path in
`.github/workflows/docs-site.yml` for that reason.

It matched on the script name until bean `dyd3`, while this paragraph said
otherwise, and the cost landed exactly where you would expect: the fix below
changed the publisher, and a name-matching test would have gone red on the
change that FIXED the defect it was guarding. It now derives the path from the
`@id` rather than writing it out, so the two sides cannot drift into agreeing
about different URLs.

## ONE publisher, and it is `kg-export`

Two generators wrote this document until `dyd3`. `gen-bootstrap-graph.ts`
wrote it here; `kg-export --instance ./bootstrap` wrote a second one at
`<base>/bootstrap.jsonld`. **Measured 2026-09-21: 88 nodes each, 85 of them
doc-relative** — so 85 subjects existed under two identities that no consumer
will ever merge, with only the 3 absolute `cat-harness/ns#graphKind/*` IRIs
shared.

**Collapsing the paths is not what settles it**, and that was measured too:
pointed at one URL the two documents still disagree on **74 of the 88 nodes**
and on six top-level fields, so the site would serve whichever step ran last.
Two publishers at one URL is last-writer-wins, which is worse than two URLs
because it is invisible.

`kg-export` is the one kept, because its output is the target of every
`skillHome` link cat-harness mints. `gen-bootstrap-graph.ts` stays as a
generator and a test subject; it publishes nothing. A second test asserts
the **count** — exactly one publisher per workflow — because the retired
generator still exists and still works, so re-adding it is the live failure
mode, and a path assertion cannot see it.

## This path is an INSTANCE of a general rule, not a one-off

The owner stated the rule on 2026-09-20 and named this document as its
example:

> rendered assets should be available at toplevel like `<baseURL>/` for main
> just the docs pipeline, or … `<baseurl>/<instantiated harness>/<path to
> rendered content>` — bootstrap jsonld/json is example

So `<base>/bootstrap/bootstrap.jsonld` is not a path somebody chose for
this file; it is `<instance>/<rendering>` with the instance filled in. Bean
`x0hj` carries the general rule and the three artefacts that do **not** yet
follow it. **Do not move this one on its own** — its `@id` would have to move
with it, which is the whole of the next section.

## The `.json` alias is an alias, not a rename

    cp ./_site/bootstrap/bootstrap.jsonld ./_site/bootstrap/bootstrap.json

GitHub Pages has no media type for `.jsonld` and serves it as
`application/octet-stream`, which a browser downloads rather than displays.
Every other rendering here carries the same pair for the same reason. **The
`.jsonld` stays canonical** — it is what the `@id` names — and the `.json` is
a convenience copy. A consumer that follows the `@id` gets the canonical one;
a person who clicks a link gets something their browser will show them.

## It is NOT committed, and the comment that still says otherwise is wrong

Until 2026-09-20 `bootstrap/bootstrap.jsonld` was a tracked file with a
byte-staleness gate in `code-quality-gates.yml`. It is now built at render time
into the published site, so there is no committed copy to go stale and nothing
for a byte gate to compare against.

**The rationale for committing it was checked and found false**, which is worth
recording because it was a good argument: a cold reader with nothing installed
cannot run `bun install`, let alone `kg:export`, so a graph that only appears
after a build is a graph that reader never sees — and README step 2 was cited
as telling them to load it. **No prose file under `bootstrap/` tells a reader
to load this document.** The README sends that reader to
`workflows/initialize-harness.bpmn` and
`skills/bootstrap-kg-navigation.md`. The pair of tests defending
"committed" and "current" therefore defended an instruction that does not
exist, while the `@id` went unguarded.

That sentence read *"no prose file under `bootstrap/` mentions this document
at all"* until `dyd3`, and it had stopped being true: `bootstrap/render/`
landed with bean `hfkl`, and **this file names the document throughout**. The
claim it was making — that the cited cold-start route does not exist — is
unaffected, because naming a path in a publication contract is not instructing
a reader to fetch it. Narrowed rather than deleted, since the narrow version
is the one the argument needs.

**Nothing was dropped with the gate.** Every property it protected —
purity, id ordering, no absolute build paths, skills derived from disk, graph
kinds a subset of the declaration, the `omitted` list — is asserted directly in
`bun test`. Removing a check whose coverage lives elsewhere is fine; removing
one *and saying so* is what stops the next reader reinstating it.

A test asserts the inverse of the old one: **no TRACKED copy exists.** An
ignored path is easy to re-add with `git add -f`, and a re-added copy goes
stale silently with no gate left to catch it. The file may exist locally —
`bun run bootstrap:graph` writes it — and that is fine.

## If you are about to re-commit it

Do not. If a cold reader genuinely needs the graph from a fresh clone, the
honest fix is a README step that says so plus a staleness gate that can
actually fail, not a tracked file with neither. Raise it as a bean; the
argument above is the one to falsify.

## Related

- [`bootstrap-graph-emission`](bootstrap-graph-emission.md) — what the
  document contains and the four properties it holds
{% endraw %}
````
