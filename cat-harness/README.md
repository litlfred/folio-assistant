# cat-harness

**The harness layer.** Everything an agent needs in order to work — the
knowledge graph of skills, the BPMN processes they run inside, the roles that
own the swimlanes, the schemas that declare all of it, the MCP server that
serves it, and the published documentation site.

It is a *layer*, not the repository. The repository is
[`folio-assistant`](../README.md), which holds this layer beside several
others; [its instance table](../README.md#harness-instances) is the index.

## What is in here

The authoritative list is [`cat-harness.json`](cat-harness.json) — every directory this
instance declares, and the kind of graph each one holds. Read it rather than a
list in this file: a list here would be a second answer, free to disagree with
the first the day a directory moves. Four entries are worth naming because a
reader looks for them by name:

| | |
|---|---|
| [`skills/`](skills/) | the instruction bodies — ask for one with `skill_list` / `skill_fetch` rather than opening a path |
| [`skills/workflows/`](skills/workflows/) | the BPMN processes; the diagrams are executable, not illustrations |
| [`schemas/`](schemas/) | the Zod declarations every checker reads, `cat-harness.ts` first |
| [`docs/`](docs/) | the Jekyll site, published at <https://litlfred.github.io/folio-assistant/> |

## Reading it as a person, or as an agent

Both entries exist and they are different files on purpose:

- **A person** starts here, then the
  [documentation site](https://litlfred.github.io/folio-assistant/) —
  [installation](https://litlfred.github.io/folio-assistant/installation.html),
  [getting started](https://litlfred.github.io/folio-assistant/getting-started.html),
  [architecture](https://litlfred.github.io/folio-assistant/architecture.html).
- **An agent** starts at [`AGENTS.md`](AGENTS.md), which does not restate this
  file. It carries what a cold agent has to *do* — the order of operations,
  which store answers which question, and the rules that bind before the first
  edit.

## Running it

Commands live in the repository root [`README.md`](../README.md#common-commands)
and in [`package.json`](../package.json); they are run from the repository
root, not from here.

---

*`README.md` and [`AGENTS.md`](AGENTS.md) are declared assets of this instance
([`cat-harness.json`](cat-harness.json), roles `instance-readme` and
`agent-instructions`). Until 2026-09-20 this instance declared the
**repository's** two files as its own, so the file a reader opened first
answered "what is this repository" and "what is this layer" at once, and
`check:subgraph-coverage` reported nothing because the asset did resolve — to
the wrong file's job. Issue #592.*
