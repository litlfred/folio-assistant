---
name: bootstrap-graph-emission
description: >
  What bootstrap's own Knowledge Graph must be when it is written out as a data
  file, `.jsonld` with a `.json` copy. bootstrap renders no pages for a person
  to browse, so this file is how it shows it is a Knowledge Graph at all.
consulted: true
---

# Writing out bootstrap's own Knowledge Graph

bootstrap renders nothing for a person to look at. What it owes instead is its
own Knowledge Graph, written out as one data file. `bootstrap.json` records
that trade under `renderExemption`, and its `owes` field names this Skill. An
exemption with nothing owed in its place would be a gap.

bootstrap runs nothing (FR-7 of the [README](../README.md)), so the file is
written by a Tool of the Harness that publishes bootstrap, not by anything
here. This Skill states what that Tool must produce. Its shape is fixed by a
schema, and the Tool is tested against it.

## What goes in it

The declaration itself, its Subgraphs and their Graph Kinds, the declared
Assets, the Skills in the `skills` Subgraph, the Processes in `processes`
(with their steps and arrows), and the Roles in `scenarios`. The Tool finds each Subgraph
**through the declaration**, never by walking the directory tree, so a
Subgraph the declaration does not name is never exported by accident.

## Four properties

| property | why |
|---|---|
| **The same input gives the same file.** Two builds of one tree are byte-identical. | A check that fails on an unchanged tree gets switched off. |
| **Nodes are sorted by `@id`.** | Directory order differs between machines. |
| **The nodes carry no time and no commit.** Where the file was built from is recorded once, at the top level, and only in the published copy. | Two builds of one tree then agree on every node. |
| **No absolute path from the machine that built it.** | A different checkout path would make an untouched tree fail. |

Counts of nodes are deliberately not checked. A count cannot tell "the export
still works" from "somebody deleted a Skill".

## What it says it did not look at

The file's `omitted` list names what the Tool did not collect for bootstrap,
such as Tools. "bootstrap has no Tools" and "nobody looked for Tools" are
different facts, and an empty section must not be read as the first when it
means the second. Its `problems` list names anything that could not be read.

## Adding a Skill

Put the `.md` in `skills/` and add its name to `skills/package-manifest.json`.
A `.md` counts as a Skill unless its front matter declares `$schema:`, which
says it is some other kind of file. `README.md` and `AGENTS.md` are declared as
Assets instead, which is why they sit outside `skills/`.

## Related

- [`bootstrap-graph-publication`](bootstrap-graph-publication.md): where the
  file is published, and why its `@id` must equal that address
- [`bootstrap-kg-navigation`](bootstrap-kg-navigation.md): reading a
  Knowledge Graph with nothing installed
