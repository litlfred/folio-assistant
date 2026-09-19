---
name: kg-navigation
description: >-
  Load a knowledge graph from its JSON-LD declaration and read a node, using
  nothing but a file reader. The first skill an agent with no context loads,
  and the one that makes every other instruction in bootstrap followable.
---

# Reading and navigating a knowledge graph

> Skill id: `kg-navigation` · Package: `bootstrap`

You have a file reader and nothing else. **No MCP server, no tools, no
harness** — those are what you are about to bootstrap, and assuming them is
how a cold start fails in exactly the case it exists for.

## A graph is a document plus the files it names

1. **Read the graph document.** `bootstrap/bootstrap.jsonld`. Its `@context`
   maps short names to IRIs; its `@graph` is a list of nodes.
2. **Each node has an `@id` and an `@type`.** The id is how other nodes refer
   to it; the type says what kind of thing it is.
3. **A node that has a body points at it.** `bs:path` is a repository-relative
   path — read that file to get the node's content. A node with no `bs:path`
   is fully described by its own properties.
4. **Follow a reference by matching `@id`.** `{"@id": "bs:determine-intent"}`
   inside one node means: find the node whose `@id` is `bs:determine-intent`.
   References are resolved **within the document you loaded** — this graph is
   standalone and names nothing outside itself.

## Three rules that stop a cold start going wrong

**A property absent from `@context` is dropped.** JSON-LD processing silently
discards a term the context does not define, so a node can look complete and
lose half its meaning. If a property you expect is missing after parsing, look
at the context before concluding the node is thin.

**A path that does not resolve is a finding, not a gap to route around.** If
`bs:path` names a file that is not there, say so and stop. Guessing the
intended file is how an agent acts on a document nobody wrote.

**Could not determine is a third state.** "I could not read the graph" and
"the graph says nothing about this" are different answers and must not be
reported as the same one.

## What you do with it here

Read `bootstrap.jsonld`, find the node of type `bs:Process`, read the file its
`bs:path` names, and follow that process. That is the whole of your next step.
