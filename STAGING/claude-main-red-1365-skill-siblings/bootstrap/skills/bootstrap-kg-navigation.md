---
name: bootstrap-kg-navigation
description: >
  Read and navigate a knowledge graph with nothing installed — no MCP server,
  no tools, no harness. The first skill bootstrap hands you, because the second
  step of the handoff cannot be followed without it. Named `bootstrap-` so it
  cannot be confused with a navigation Skill of a Harness that is installed.
consulted: true
---

# Reading a knowledge graph before you have anything

**This skill assumes a text editor and nothing else.** No MCP server, no
`skill_fetch`, no `beans`, no build. If those exist they are not yours to rely
on yet — see [`AGENTS.md`](../AGENTS.md).

That constraint is the reason this skill exists rather than a pointer to the
harness's own navigation tooling: an agent here may have no connected server,
and a bootstrap that required one would fail in exactly the cold-start case it
exists for.

## A graph is files that declare what they are

Three facts carry the whole model, and every one of them is checkable by
reading:

1. **An instance declares the directories it scans**, in its declaration at its
   root. Each entry is an id, a path, and the **kinds of graph** found there.
2. **A directory is a place to look, not a type.** One may hold more than one
   part of a graph, so the directory does not say what its files are —
   **the files do**, in their own front matter or `$schema`.
3. **Ids are stable across a relocation; paths are not.** An override matches
   on an entry's `id`, never its `path`. Matching on path turns one relocated
   graph into two, and every consumer then scans a directory that is not there.

## Do this, in order

1. **Read the repository's declaration.** If there is none, this repository is not
   an instance yet, and that is the case bootstrap exists for.
2. **Find the entry whose `graphKinds` name the kind you want.** In
   bootstrap they are named for what they hold: `skills`, `processes`,
   `scenarios` (the Roles) and `schemas`. The entry's `path` is relative to
   the declaration.
3. **Read the files in that directory.** A markdown file declaring `name:` and
   `description:` in front matter is a **skill** — its body is the instruction
   you were looking for. A file declaring `$schema:` is stating that it is
   **something else**, and is not a skill however it is named.
4. **Follow a reference by id, not by path.** A node that names another names
   it by id; resolve it through the declaration rather than guessing a filename.

## What "I could not determine" means here

**An absent declaration and an unreadable one are different**, and collapsing
them is the mistake this section exists to prevent:

| what you found | what it means | what to do |
|---|---|---|
| no declaration | not an instance yet | this is bootstrap's case — continue |
| a declaration that will not parse | an instance asserting something broken | **stop and say so**; do not fall back |
| a declared directory that is not there | the declaration is wrong | **stop and say so** — scanning nothing and reporting a clean run is the defect |
| no declaration for a kind you want | this instance has none of it | that is an answer, not a failure |

A declared-but-absent directory is the one to be loudest about. Every consumer
that scans it finds nothing and reports success, so the failure is silent and
looks exactly like a clean result.

## What this skill is NOT

It does not describe what a Harness above bootstrap holds, such as its content
or its checks. Those are concepts of the Harness you have not loaded yet, and
a description of them here would be a second one, free to disagree with the
first.

If you find yourself needing one of them to finish bootstrap, **that is a sign
the boundary is in the wrong place** — say so rather than importing the
definition.
