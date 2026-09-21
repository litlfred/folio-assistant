---
layout: default
title: 'Publishing bootstrap''s graph'
parent: Skill instructions
---

{: .note }
> Generated from [`../bootstrap/render/bootstrap-graph-publication.md`](https://github.com/litlfred/folio-assistant/blob/main/../bootstrap/render/bootstrap-graph-publication.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/../bootstrap/render/bootstrap-graph-publication.md){: .fa-edit-source }

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

**So the test asserts the WORKFLOW, not the script.** A build that runs the
generator and writes it somewhere else leaves the `@id` just as dead as one
that never runs it, and a script name alone cannot tell those apart —
`scripts/tests/bootstrap-graph.test.ts` matches on the `--out` path in
`.github/workflows/docs-site.yml` for that reason.

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
as telling them to load it. **No prose file under `bootstrap/` mentions
this document at all.** The README sends that reader to
`workflows/initialize-harness.bpmn` and
`skills/bootstrap-kg-navigation.md`. The pair of tests defending
"committed" and "current" therefore defended an instruction that does not
exist, while the `@id` went unguarded.

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
