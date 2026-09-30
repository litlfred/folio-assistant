---
name: bootstrap-graph-publication
description: >
  Where bootstrap's Knowledge Graph file is published, why its `@id` must be
  exactly that address, why a `.json` copy sits beside the `.jsonld`, and why
  the file is not kept in the repository.
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

The address follows the general pattern for anything a Harness publishes:
`<base>/<harness name>/<file>`, with `bootstrap` as the Harness name.

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
