---
name: fsh-guts
description: >-
  The trashcan that is kept — where work that is not wanted goes instead of
  being deleted, what declares itself there, and what does NOT belong.
# published: false — this skill DOCUMENTS the trashcan, so publishing it
# advertises it to every consumer of the folio's graph, which is the precise
# thing the owner's 2026-09-19 instruction forbids: "NEVER include fsh-guts,
# references to fsh-guts stripped out of KG before sending to publication."
# It was ALREADY stripped, by a name match against UNPUBLISHED_GRAPH_TYPOLOGIES.
# Declaring it states the fact where the author is looking, rather than
# inferring it from a collision between this skill's name and a graph typology's
# — which `isPublishedSkill` itself flags as the thing to replace: "if that
# ever stops being true this needs its own list, not a cleverer derivation".
published: false
graph-typologies:
  - fsh-guts
---

# `fsh-guts/` — the trashcan that is kept

**Delete means relocate.** Nothing in this repository is removed with `rm`
unless the owner has explicitly confirmed that removal; everything else that
has outlived its use moves to `fsh-guts/`, where it stays addressable,
exported and greppable, and where no reader of the folio will meet it.

Owner, 2026-09-19:

> do not pollute the KG with SDLC churn.... if you need to keep it, make a
> folder called `fsh-guts/` that you can put structured content in but that
> does not enter into main render pipeline. […] it is the trashcan that does
> not get rendered but […] where deprecated, throwaway stuff goes. […] do not
> delete unless explicit confirm.

## What makes it different from every other non-renderable graph

The declaration declares nine graph typologies and none of them renders. That makes
`renderable: false` look like a weak signal, and for the others it is: `tools`,
`schemas`, `beans` and the rest are graphs a **tool** reads, and there was
never a page to make of them.

**`fsh-guts` is the one whose contents COULD be rendered and deliberately are
not.** It exists so that something can be kept without being published. That
is a different fact wearing the same flag, and it is why this skill exists
rather than a line in the conventions table.

## Why the never-delete rule needed a destination

`AGENTS.md` has always forbidden deleting a bean, and its reason was never
about beans:

> a scrapped bean records that something was considered and rejected, which is
> what stops the next agent re-entering the same dead end; a deleted one leaves
> a sibling unable to tell abandonment from accident.

Every word of that is true of a page, a diagram, a script or a workflow. The
rule could not be applied to them because an agent removing one had only `rm`
and no third option. `fsh-guts/` is that option, and it converts an
unenforceable principle into a move.

**So the rule now reads, for everything:**

1. Work that is wanted but wrong → fix it.
2. Work that is not wanted → **move it to `fsh-guts/`**, with a note saying
   what superseded it. Since 2026-10-04 that means the MOUNTED copy, pushed
   to its branch — see §"Where it lives", below.
3. Actual deletion → **only on explicit confirmation from the owner**, asked
   for as a question, never inferred from "this is obviously dead".

A thing in `fsh-guts/` can be read, cited and restored. A thing that is gone
cannot be told from a thing that was never there.

## Where it lives — its own branch, mounted at `fsh-guts/` (bean `9c7h`)

Owner, 2026-10-02: *"fsh-guts content gets its own named branch,
cat/cat-harness/fsh-guts, and the contents of fsh-guts/ dir goes there."*
Since the 2026-10-04 cutover the trashcan is **not on `main`**. Its
declaration says `source: { kind: "branch", branch: "cat/cat-harness/fsh-guts",
keyedBy: "tip" }`, and `main` ignores the directory (`/fsh-guts/**`).

**To relocate something into it:**

```sh
bun run state:mount                      # the session-start hook already runs this
mv <file> fsh-guts/<where>/              # a plain mv, NOT git mv; then add the front matter below
git rm --cached -q <file>                # stage the removal from main (a no-op if it was never tracked)
bun run state:push -m "fsh-guts: <what moved, and what superseded it>"
```

A plain `mv`, because `git mv` would stage the NEW path, and that adds the
file to `main` underneath the ignore rule. `state:push` splices only what
changed onto the branch tip. A sibling's edit to the same file is reported as
a `conflict` and nothing is pushed, so it never silently overwrites anything.
The staged removal takes the file off `main` in your PR; the push puts it on
the branch. A relocation is both halves.

**Three things that are easy to get wrong:**

- **Never `git add -f` anything under `fsh-guts/` to `main`.** That makes a
  second copy that diverges from the branch. The ignore rule is there to stop
  `git add -A` from doing it by accident.
- **An unmounted `fsh-guts/` is not an empty trashcan.** Every reader (the
  export, the visualiser, `check:uploads-retired`, `check:retired-front-matter`)
  asks `contentAt("fsh-guts")` and exits 2, "could not determine", instead of
  reporting a clean, empty corpus. CI mounts before it reads.
- **`fsh-guts/logs/` stays local scratch.** It is never pushed, and logs
  written before the first mount do not block the mount.
- **There is no viewer page to commit after a relocation.** The page
  `cat-harness/docs/fsh-guts/index.md` is derived from this branch, so it is
  built at publish by `derive:publish` and gitignored (bean `0b8c`, #2230).
  Before that it was committed, and one relocation made it stale on main and
  on every open PR at once (2026-10-05). `fsh-guts:viz:check` now judges that
  the mounted graph renders. The rule is general:
  [`directory-conventions`](directory-conventions.md) §"The storage clock".

## Files declare themselves

Same contract as the bean and workflow stores: a directory is a place to look,
and the file says what it is. Every node carries front matter:

```yaml
---
$schema: folio-fsh-guts/v1
title: "Deployment topologies and operating modes"
kind: proposal
movedOn: 2026-09-19
movedFrom: "docs/folio-assistant/proposals/deployment-topologies.md"
issue: 363
summary: >-
  One or two sentences on what this was and why it left.
---
```

`movedFrom` and `movedOn` are the part that earns its keep. Without them a
node here is an orphan — a reader can see what it says and not where it used
to live, which is exactly the "abandonment or accident" ambiguity the rule
exists to prevent. `issue` points at the conversation that superseded it,
where there is one.

`kind` is **open**. A proposal, a webpage, a todo, a retired diagram, a script
nobody calls any more — the trashcan does not get to be fussy about what is
thrown into it.

## It is exported, and it is not rendered — and it is not in the KG either

- served as `<base>/fsh-guts.jsonld`, alongside the instance's other
  renderings, so a consumer can walk it **by name** — built by
  `scripts/fsh-guts-export.ts`, published by `docs-site.yml`, with a
  `.json` alias because Pages has no media type for `.jsonld` and serves it
  as octet-stream. **Logs are excluded by DECLARATION**: a file is included
  only if it says `$schema: folio-fsh-guts/v1`, so a log entry is left out
  because of what it says it is, not because `.gitignore` kept it off the
  build machine — which is a property of the checkout and not of the export
- **absent from the site build** — this is the property, not a side effect.
  A change that causes `fsh-guts/` to render has broken it
- **stripped from every other published graph.** Owner, 2026-09-19: *"NEVER
  include fsh-guts, references to fsh-guts stripped out of KG before sending
  to publication."*

**Those last two are different properties and the second is easy to miss.**
Keeping the CONTENT out of the render pipeline does not keep the REFERENCE
out of the graph: an instance's declared directories become nodes in
`<stub>.jsonld`, so declaring this directory — required, or nothing can find
it — put its id, path and description into the published document. That was
shipped and then corrected the same day.

A consumer may fetch `fsh-guts.jsonld` deliberately. It must never **arrive**
there by following an edge. Mechanism and the three emitters that had to be
filtered: [`kg-export`](kg-export.md) §"`fsh-guts` NEVER reaches a published
graph". Where this sits among everything else the site publishes, and what
else is never published: [`instance-publication`](instance-publication.md)
§"What each instance publishes".

Reaching it as a human is the dead-fish icon under settings, with a node
counter and a select dialog. Bean `folio-assistant-7vhe`; until that exists,
the files are reachable through the repository and the JSON-LD.

## On the name

`.fsh` is **FHIR Shorthand** — in `smart-base/schemas/dak.ts`, `jsonld.ts`,
`translation-tools.ts`, `block-qa.ts`, and throughout the WHO SMART folios
this platform targets. The overlap was raised and the owner confirmed this
spelling anyway.

It is recorded here so the next agent meets it as a known fact instead of
rediscovering it and proposing a rename. **Do not re-litigate it.** If you are
grepping for FHIR Shorthand, exclude this directory.

## An INGESTED SOURCE comes here — owner, 2026-09-29

> archival (once ingested into KG and put into a proper `library/` under a
> harness repo) then it should be moved to `fsh-guts`.

The third thing this directory is for, after a superseded page and a spent
script: **the source bytes of a document whose derivation has landed.** A
`library/<slug>/` entry holds `sections/`, `blocks/`, `images/` and the
manifest, and `check:l1-complete`'s `contents` check refuses anything else —
so the PDF cannot stay with what was derived from it, and deleting it would
remove the only copy in the working tree.

It arrives the way every other non-markdown node does: the bytes, plus a
same-basename `.md` sidecar with `kind: source`, whose `movedFrom` is the
`uploads/` path and whose `summary` names the library entry it was ingested
into. The full lifecycle is in
[`library-ingestion`](../../library/library-core/library-ingestion.md), in its detail
[`uploads-retirement`](../../library/library-core/library-ingestion/uploads-retirement.md) §"What happens to the upload after
it is ingested", and that skill is the one to change if the rule moves.

**`fsh-guts/uploads/` is the proposed sub-directory**, beside `retired/` and
`scripts/`, and is not yet ruled on.

## What does NOT go here

- **Anything a reader of the folio needs.** That is `docs/`, and moving it
  here to tidy up is the opposite mistake.
- **A bean.** Beans have their own lifecycle — `scrapped`, with reasons — and
  a second disposal mechanism for them would be two answers to one question.
  A cutover's snapshot of a whole `beans/` directory is not that: the beans
  stay live on their branch, and the archive is the copy `main` last held.
  The rule and its format are in
  [`directory-conventions`](directory-conventions.md) §"Cutting an EXISTING
  instance over".
- **Secrets, credentials or personal data.** This is not rendered; it is still
  committed, still public in a public repository, and still in the JSON-LD.
  Not-rendered is not private, and treating it as private is the one way this
  directory could do real harm.
