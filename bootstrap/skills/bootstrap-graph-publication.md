---
name: bootstrap-graph-publication
description: >
  Where bootstrap's Knowledge Graph file is published, why its `@id` must be
  exactly that address, why a `.json` copy sits beside the `.jsonld`, and why
  the file is not kept in the repository. Also what each subject in it is
  named: a path under the Harness's address, never a `#fragment` of the file.
consulted: true
---

# Publishing bootstrap's Knowledge Graph

## One address, and it must be the file's own name

    @id         <base>/bootstrap/bootstrap.jsonld
    served at   <base>/bootstrap/bootstrap.jsonld

The file names itself with its `@id`. If the address it is published at
differs, the `@id` leads nowhere, in the one file whose purpose is to be looked
up. So the publisher derives the published path from the `@id`, never the
other way round, and there is exactly **one** publisher. Two publishers at
one address means whichever runs last wins, and nobody can see it happen.
That publisher is bootstrap's toolset, never bootstrap itself (FR-7). Only the published build adds the commit
and time it was made from (PROV, at the top level); a build for a check leaves
them out, so two checks of one tree agree.

The address follows the general pattern for anything a Harness publishes:
`<base>/<harness name>/<file>`, with `bootstrap` as the Harness name.

## Each subject's own address

The file names itself; it also names everything in it. A **subject** — a
Skill, a Process, a step or lane of a Process, a Role, a Subgraph, an Asset,
anything the Knowledge Graph holds except an arrow — is named by a path
under the Harness's address, **never by a `#fragment` of the file**:

    <base>/bootstrap/<kind>/<id>                       a subject
    <base>/bootstrap/bootstrap.jsonld#<kind>/<id>      not this
    <base>/bootstrap/bootstrap.jsonld/<kind>/<id>      not this either: a
                                                       host cannot serve a file
                                                       and a folder under one name

So a Skill is `<base>/bootstrap/skill/publish-site`: the folder the file sits
in, then the kind, then the id. Any other Harness does the same under its own
address, `<base>/<harness name>/<kind>/<id>`.

**The parts of a Process.** A step and a lane are subjects; an arrow is not:

    <base>/bootstrap/process/<process>/node/<step>     a step: its own address
    <base>/bootstrap/process/<process>/lane/<lane>     a lane: its own address
    <base>/bootstrap/process/<process>#flow/<arrow>    an arrow: a fragment of
                                                       the Process's own page

Owner, 2026-10-23T14:56Z, choosing that option: *"Steps and lanes get pages,
and flows stay fragments of the process page … Everything anyone cites (a
step, a role's lane) is a real resource, and the arrows, which only matter
inside their diagram, stay on the process page."* An arrow is the one
`#fragment` allowed for anything a Knowledge Graph holds; the other `#` is
the vocabulary-term exception below.

Owner, 2026-10-23: *"hashes not so good... why not
`<instance doc>/<kind>/<id>`?"*, and, agreeing to the reasons below: *"yes
that is correct. please update authoring KG skills appropriately so this
doesnt happen again"*.

Why:

- **A fragment never reaches the server.** Following a subject's address
  fetches the whole file, and the subject cannot have a page or a file of its
  own.
- **A subject is a real thing to point at**: its own page, its own JSON-LD,
  its own history, cached on its own, linked to on its own.
- **`#` already means a place on a web page.** Using it for what a thing *is*
  mixes that up with where to scroll.
- **Paths nest** (`…/process/<process>/node/<step>`); fragments do not.
- **It is the convention FHIR uses**: `<base>/<Type>/<id>`.

**The other exception is a vocabulary term**, a glossary's terms included.
`ns.jsonld` keeps `…/ns#Term`:
one small file holds every term, and fetching all of it is what a reader of a
term wants. A term says what a word means; a subject is a thing that has its
own page and history. If it is a subject, it takes a path.

**Every address still has to load.** As with the file's own `@id` above, a
subject's address that answers 404 is worse than none. A static host does no
redirects and no content negotiation, so each subject gets **a file of its
own**: a small page at its path carrying it as JSON-LD, with a `.jsonld` beside
it. The publisher writes those files in the same change that starts using the
path.

**Today the file still names its subjects with fragments**: the toolset
writes `bootstrap.jsonld#<kind>/<id>`. Changing that is tracked in
[issue #22](https://github.com/litlfred/bootstrap/issues/22). Until it is
done, nothing new should add another fragment-named subject; when it is done,
this paragraph goes.

## The `.json` copy

    <base>/bootstrap/bootstrap.json

Many web hosts serve `.jsonld` as a download rather than as text, so a person
who clicks a link would get a file instead of seeing it. The `.json` copy is
for them. **The `.jsonld` is the real one**: it is what the `@id` names, and
what a program following the `@id` receives.

## Not kept in the repository

The file is built when the site is published and is not committed. A
committed copy could go out of date with nothing to notice, and no step of the
[README](../README.md) asks a reader to open it: a reader with nothing
installed is sent to the README, the Process diagram and the Skills, all of
which are plain files. If a reader with nothing installed ever needs this
file, the right change is a README step that says so, together with a check
that fails when the committed copy is out of date.

## Related

- [`bootstrap-graph-emission`](bootstrap-graph-emission.md): what the file
  contains, and the four properties it holds
- [`publish-documents`](publish-documents.md): every address a Harness names
  must answer
